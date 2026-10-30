# Reglas del Proyecto (AI Agents Context)

Este documento define las directrices arquitectónicas y de estilo para el desarrollo de la API backend de la plataforma escolar. **Todo el código sigue arquitectura limpia y los principios SOLID.**

## 🛠️ Stack Tecnológico
*   **Framework:** NestJS (TypeScript en modo `strict`).
*   **Base de Datos:** MongoDB mediante Mongoose (solo en la capa de infraestructura).
*   **Seguridad:** JWT y bcrypt, detrás de interfaces (`TokenService`, `PasswordHasher`).

## 📐 Arquitectura: cuatro capas por módulo
Cada módulo vive en `src/modules/<modulo>/` (usuarios, auth, materias, clases, examenes); lo compartido en `src/shared/`.

| Capa | Contiene | Puede importar |
|---|---|---|
| `domain/` | Entidades (interfaces), reglas puras, errores de dominio e **interfaces de repositorio/servicio** con su token (`Symbol`) | Solo otros `domain/` |
| `application/` | Un caso de uso por acción (`CrearExamen`, `ResponderExamen`...), clase con método `ejecutar` y dependencias por constructor | `domain/` y otros `application/` |
| `infrastructure/` | Esquemas Mongoose, repositorios `Mongo*` que implementan las interfaces, mappers documento ↔ entidad, adaptadores (bcrypt, JWT) | Todo lo anterior + frameworks |
| `presentation/` | Controladores, DTOs (`class-validator`), presenters (entidad → JSON), guards y decoradores | `application/`, `domain/` |

*   **Regla de dependencia:** `domain/` y `application/` **no importan** `@nestjs/*`, `mongoose`, `bcrypt`, `passport`, `class-validator`, `express`, ni nada de `infrastructure/` o `presentation/`. ESLint lo hace cumplir (`npm run lint`).
*   **Inyección:** los casos de uso son clases planas; se registran en el módulo con `casoDeUso(Clase, [TOKENS...])` (`src/shared/infrastructure/caso-de-uso.provider.ts`). Las implementaciones se enlazan con `{ provide: TOKEN, useClass: MongoXRepository }`.
*   **Errores:** el dominio y la aplicación lanzan `NoEncontradoError`, `SinPermisoError`, `ConflictoError`, `DatosInvalidosError`, `NoAutenticadoError` (`src/shared/domain/errores.ts`); `FiltroErroresDominio` los traduce a 404/403/409/400/401. No lanzar `HttpException` fuera de `presentation/`.
*   **Materia y Grupo:** la Materia es permanente (contenido semanal y exámenes, se reutiliza cada semestre); el Grupo es una materia en un semestre (maestro, fechaInicio, alumnos inscritos, intentos). Los datos de alumnos nunca se guardan en la Materia.
*   **Permisos:** usar `AccesoMaterias.paraLeer` / `paraEditar` para contenido y exámenes, y `AccesoGrupos.paraLeer` para lo que ocurre en un grupo (módulo materias). Nunca repetir la lógica.
*   **Exámenes:** `Semanal` (uno por semana), `Reposicion` (uno por semana, requiere el Semanal) y `Final` (uno por materia). Cada alumno responde una vez por grupo. Las fechas de apertura y cierre se calculan con el calendario del grupo (`domain/ventana.ts`), no se guardan en el examen.
*   **Efectos entre módulos:** cuando borrar algo de un módulo debe limpiar datos de otro, publicar un evento (`PUBLICADOR_EVENTOS`, `src/shared/domain/eventos.ts`) y suscribirse en el otro módulo con `manejadorDeEventos(...)`. Así se evitan dependencias circulares entre módulos.
*   **Fecha actual:** inyectar `RELOJ` (`Reloj`), no usar `new Date()` en reglas de negocio.
*   **Validación:** formato de entrada en DTOs (`class-validator`); invariantes de negocio (rangos, unicidad, reglas) en el dominio o el caso de uso.
*   **Respuesta JSON:** los controladores devuelven el resultado de un presenter, nunca entidades ni documentos de Mongoose. Los ids se exponen como `_id`.

## 🔒 Seguridad y Control de Acceso
*   **Sin registro público:** solo el rol `admin` crea cuentas. El primer admin se crea al arrancar con `ADMIN_CORREO` / `ADMIN_PASSWORD`.
*   **Autenticación:** las rutas privadas usan `@UseGuards(JwtAuthGuard, RolesGuard)`; el actor se obtiene con `@ActorActual()`.
*   **Roles (RBAC):** `@Roles(Rol.MAESTRO)` restringe por rol; la pertenencia a la materia la decide `AccesoMaterias`.
*   **Variables de entorno:** se validan al arrancar (`validar-entorno.ts`); sin `MONGO_URI` o `JWT_SECRET` la app no inicia.

## 🧪 Pruebas
*   Los casos de uso se prueban con repositorios en memoria (`src/testing/`), sin base de datos.
*   Archivos `*.spec.ts` junto al código que prueban.

## 💻 Comandos de Desarrollo
*   **Verificación de tipos:** `npx tsc --noEmit`
*   **Linter (incluye la regla de capas):** `npm run lint`
*   **Pruebas:** `npm test`
*   **Ejecución:** `npm run start:dev`
