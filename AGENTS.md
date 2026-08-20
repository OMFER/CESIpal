# Reglas del Proyecto (AI Agents Context)

Este documento define las directrices arquitectónicas y de estilo para el desarrollo de la API backend de la plataforma escolar.

## 🛠️ Stack Tecnológico
*   **Framework:** NestJS (TypeScript).
*   **Base de Datos:** MongoDB mediante Mongoose.
*   **Seguridad:** JWT (JSON Web Tokens) nativo y bcrypt.

## 📐 Reglas de Arquitectura
*   **Separación de Responsabilidades:** Los Controladores solo gestionan las peticiones HTTP. Toda la lógica de negocio y consultas a la base de datos debe residir exclusivamente en los Servicios.
*   **Validación de Datos:** Toda entrada de datos debe validarse usando DTOs con `class-validator` y transformarse con `class-transformer`.
*   **Schemas (Mongoose):** Los modelos de base de datos se definen usando clases y decoradores (`@Schema`, `@Prop`).
*   **Referencias NoSQL:** Utilizar `Types.ObjectId` para relacionar documentos (ej. relacionar Clases con Materias).

## 🔒 Seguridad y Control de Acceso
*   **Autenticación:** Las rutas privadas deben usar `@UseGuards(JwtAuthGuard)`.
*   **Roles (RBAC):** Restringir acciones específicas con el decorador `@Roles(Rol.MAESTRO)` en conjunto con `RolesGuard`.

## 💻 Comandos de Desarrollo
*   **Verificación de tipos:** `npx tsc --noEmit`
*   **Linter:** `npm run lint`
*   **Ejecución:** `npm run start:dev`