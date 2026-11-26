# Reglas del Proyecto (AI Agents Context)

Este documento define las directrices arquitectónicas y de estilo para el desarrollo de la API backend de la plataforma escolar. **Todo el código sigue arquitectura limpia y los principios SOLID.**

## 🛠️ Stack Tecnológico
*   **Framework:** NestJS (TypeScript en modo `strict`).
*   **Base de Datos:** MongoDB mediante Mongoose (solo en la capa de infraestructura).
*   **Seguridad:** JWT y bcrypt, detrás de interfaces (`TokenService`, `PasswordHasher`).

## 📐 Arquitectura: cuatro capas por módulo
Cada módulo vive en `src/modules/<modulo>/` (usuarios, auth, planes, clases, examenes, publicacion); lo compartido en `src/shared/`.

| Capa | Contiene | Puede importar |
|---|---|---|
| `domain/` | Entidades (interfaces), reglas puras, errores de dominio e **interfaces de repositorio/servicio** con su token (`Symbol`) | Solo otros `domain/` |
| `application/` | Un caso de uso por acción (`CrearExamen`, `ResponderExamen`...), clase con método `ejecutar` y dependencias por constructor | `domain/` y otros `application/` |
| `infrastructure/` | Esquemas Mongoose, repositorios `Mongo*` que implementan las interfaces, mappers documento ↔ entidad, adaptadores (bcrypt, JWT) | Todo lo anterior + frameworks |
| `presentation/` | Controladores, DTOs (`class-validator`), presenters (entidad → JSON), guards y decoradores | `application/`, `domain/` |

*   **Regla de dependencia:** `domain/` y `application/` **no importan** `@nestjs/*`, `mongoose`, `bcrypt`, `passport`, `class-validator`, `express`, ni nada de `infrastructure/` o `presentation/`. ESLint lo hace cumplir (`npm run lint`).
*   **Inyección:** los casos de uso son clases planas; se registran en el módulo con `casoDeUso(Clase, [TOKENS...])` (`src/shared/infrastructure/caso-de-uso.provider.ts`). Las implementaciones se enlazan con `{ provide: TOKEN, useClass: MongoXRepository }`.
*   **Errores:** el dominio y la aplicación lanzan `NoEncontradoError`, `SinPermisoError`, `ConflictoError`, `DatosInvalidosError`, `NoAutenticadoError` (`src/shared/domain/errores.ts`); `FiltroErroresDominio` los traduce a 404/403/409/400/401. No lanzar `HttpException` fuera de `presentation/`.
*   **Plan de estudios:** el contenido es igual para todos los grupos y vive en una versión del `Plan` (módulo `planes`): sus `Materia`s (cada una en un `bloque` de 2 semanas; las del mismo bloque se cursan a la vez), el contenido semanal (`clases`, semanas 1 y 2 de la materia) y los exámenes. Un `Grupo` es una generación de alumnos que cursa una versión **publicada** desde su `fechaInicio` (un lunes); pueden coexistir varios. Los datos de alumnos (inscripciones, intentos) nunca se guardan en el plan.
*   **Borrador y publicado:** en borrador todo se edita. Publicado (`validarEstructuraEditable`) solo admite correcciones: textos, recursos, ligas, nombre/maestro de la materia y la redacción de preguntas; no se agregan, quitan ni mueven materias, contenido ni exámenes. Para eso se crea una nueva versión (`CrearNuevaVersion`, módulo `publicacion`), que copia todo a un borrador. Solo se publica un plan completo (`pendientesParaPublicar`).
*   **Bitácora:** toda creación, corrección o borrado en un plan se registra con `BITACORA` (`src/shared/domain/bitacora.ts`): quién, cuándo, cómo estaba y cómo quedó.
*   **Permisos:** usar `AccesoMaterias.paraLeer` / `paraEditar` para contenido y exámenes (los edita el admin o el maestro asignado a la materia; los leen además los alumnos de un grupo que cursa el plan), y `AccesoGrupos.paraLeer` para lo que ocurre en un grupo (módulo planes). Nunca repetir la lógica.
*   **Exámenes:** dos por semana de la materia (`numero` 1 y 2), los dos cuentan. El 1 abre el lunes y el 2 el jueves; ambos cierran al terminar el domingo (+ `diasExtra`). Las fechas se calculan con el calendario del grupo (`domain/ventana.ts`), no se guardan en el examen. Se califican sobre 10; la materia se califica con el promedio de sus 4 exámenes y se aprueba con 6 (`domain/boleta.ts`). Cada alumno responde una vez por grupo. La respuesta correcta solo se revela al alumno cuando el examen ya cerró en su grupo (`puedeRevelarRespuestas`). Con intentos registrados solo se corrige la redacción (`esCorreccionDeTexto`). Se pueden importar desde el CSV de la plantilla (`docs/plantilla-examenes.csv`, `domain/importacion.ts`): se valida toda la hoja y, si hay un error, no se guarda nada.
*   **Efectos entre módulos:** cuando borrar algo de un módulo debe limpiar datos de otro, publicar un evento (`PUBLICADOR_EVENTOS`, `src/shared/domain/eventos.ts`) y suscribirse en el otro módulo con `manejadorDeEventos(...)`. El evento se publica después de borrar lo propio, para que una falla a medias no se lleve datos de algo que sigue existiendo.
*   **Fecha actual:** inyectar `RELOJ` (`Reloj`), no usar `new Date()` en reglas de negocio.
*   **Fechas del calendario:** una fecha `YYYY-MM-DD` que viene del cliente se convierte con `inicioDelDia(fecha, zona)` usando `ZONA_HORARIA` (env, por defecto `America/Mexico_City`), nunca con `new Date(fecha)`, que daría medianoche UTC.
*   **Cambios de esquema:** si una versión deja un índice o dato incompatible, agregar la corrección a `MigracionAlPlanDeEstudios` (módulo publicacion) o a una clase similar para que se aplique sola al arrancar; los índices se alinean solos con los esquemas (`syncIndexes`). Sin transacciones (Mongo puede no ser réplica): cada operación crítica (publicar, responder, abrir un grupo) es una sola escritura.
*   **Validación:** formato de entrada en DTOs (`class-validator`); invariantes de negocio (rangos, unicidad, reglas) en el dominio o el caso de uso.
*   **Respuesta JSON:** los controladores devuelven el resultado de un presenter, nunca entidades ni documentos de Mongoose. Los ids se exponen como `_id`.

## 🔒 Seguridad y Control de Acceso
*   **Sin registro público:** solo el rol `admin` crea cuentas. El primer admin se crea al arrancar con `ADMIN_CORREO` / `ADMIN_PASSWORD`.
*   **Autenticación:** las rutas privadas usan `@UseGuards(JwtAuthGuard, RolesGuard)`; el actor se obtiene con `@ActorActual()`.
*   **Roles (RBAC):** `@Roles(Rol.MAESTRO)` restringe por rol; la asignación a la materia la decide `AccesoMaterias`.
*   **Variables de entorno:** se validan al arrancar (`validar-entorno.ts`); sin `MONGO_URI` o `JWT_SECRET` la app no inicia.

## 🧪 Pruebas
*   Los casos de uso se prueban con repositorios en memoria (`src/testing/`), sin base de datos.
*   Archivos `*.spec.ts` junto al código que prueban.

## 💻 Comandos de Desarrollo
*   **Verificación de tipos:** `npx tsc --noEmit`
*   **Linter (incluye la regla de capas):** `npm run lint`
*   **Pruebas:** `npm test`
*   **Ejecución:** `npm run start:dev`
