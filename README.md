# 🎮 Player2Join — Video Game Collective & Manager

Single Page Application (SPA) desarrollada con **Angular 21** para el proyecto final de Desarrollo Web en Entorno Cliente (DWEC). Permite explorar el catálogo de videojuegos de RAWG API, autenticarse con Firebase, gestionar una colección personal con estados/notas, añadir juegos custom al catálogo (admin) y conectar con otros jugadores mediante un sistema social de seguidores.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Angular 21.1 · Standalone Components · Signals · Zoneless |
| **Auth & DB** | Firebase Authentication (JWT) · Cloud Firestore |
| **API externa** | [RAWG Video Games Database](https://rawg.io/apidocs) |
| **Estilos** | SCSS · Dark gaming theme |
| **Despliegue** | Firebase Hosting / Vercel |

---

## 📦 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/hugote04/Player2Join.git
cd Player2Join

# 2. Instalar dependencias
npm install

# 3. Arrancar el servidor de desarrollo
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

---

## ⚙️ Variables de entorno

La configuración se encuentra en `src/app/environments/environments.ts`:

| Variable | Descripción |
|---|---|
| `rawgKey` | API Key de RAWG (obligatoria para el catálogo) |
| `firebase.apiKey` | Clave pública del proyecto Firebase |
| `firebase.authDomain` | Dominio de autenticación Firebase |
| `firebase.projectId` | ID del proyecto Firestore (`player2join-577dd`) |
| `firebase.storageBucket` | Bucket de almacenamiento |
| `firebase.messagingSenderId` | ID del remitente de mensajes |
| `firebase.appId` | ID de la app Firebase |

> **Nota:** Para un entorno de producción se recomienda duplicar el archivo como `environments.prod.ts` con `production: true`.

---

## 👤 Cuentas de prueba

### Administrador

| Campo | Valor |
|---|---|
| Email | `admin@player2join.com` |
| Contraseña | `    ` |

### Administrador (secundario)

| Campo | Valor |
|---|---|
| Email | `marinohugo07@gmail.com` |
| Contraseña | *(credencial privada del autor)* |

### Usuario normal

| Campo | Valor |
|---|---|
| Email | `user@player2join.com` |
| Contraseña | `User1234!` |

> Puede registrarse cualquier cuenta nueva desde la pantalla de Registro.

---

## 🌐 URL de despliegue

```
(todavia no está)
```

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # AuthGuard, RoleGuard
│   │   ├── interceptors/    # AuthInterceptor, RawgInterceptor, ErrorInterceptor
│   │   └── services/        # AuthService, GameService, CollectionService, …
│   ├── features/
│   │   ├── admin/           # Historial de acciones admin
│   │   ├── auth/            # Login, Registro, Perfil
│   │   ├── games/           # Dashboard, Catálogo, Detalle
│   │   ├── home/            # Página de bienvenida
│   │   └── social/          # Búsqueda, Perfil de usuario, Seguidores
│   ├── shared/
│   │   └── components/      # Navbar, Footer, Loader, Toast
│   └── environments/        # Variables de entorno
├── assets/                  # Recursos estáticos
└── styles.scss              # Estilos globales
```

---

## 🔒 Roles y permisos

| Acción | Usuario | Admin |
|---|:---:|:---:|
| Ver catálogo | ✅ | ✅ |
| Buscar juegos | ✅ | ✅ |
| Añadir a colección | ✅ | ✅ |
| Editar/eliminar de colección | ✅ | ✅ |
| Añadir juego custom al catálogo | ❌ | ✅ |
| Editar/eliminar juego custom | ❌ | ✅ |
| Ocultar/restaurar juego RAWG | ❌ | ✅ |
| Ver historial admin | ❌ | ✅ |

---

## 📋 Checks de la rúbrica cubiertos

- **RA6:** Autenticación JWT, roles (admin/user), guards, interceptores
- **RA7:** CRUD completo (colección, juegos custom), validaciones, mensajes éxito/error
- **RA8:** Angular 21, Signals, Standalone, API REST (RAWG), Firebase Firestore
- **RA9:** README, TSDoc, despliegue HTTPS, credenciales documentadas

---

## 🛠️ Scripts disponibles

| Script | Descripción |
|---|---|
| `npm start` / `ng serve` | Servidor de desarrollo en `localhost:4200` |
| `npm test` | Ejecuta tests con Jest |
| `ng build` | Build de producción en `dist/` |

---

## ✍️ Autor

**Hugo Tejero** — 2026

