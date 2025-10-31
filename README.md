# 🐝 Abarrotes Las Abejitas - Sistema Distribuido

## 📋 Descripción del Proyecto

Sistema de punto de venta (POS) distribuido con sincronización nocturna, simulando la arquitectura que usaban bancos y tiendas en Perú cuando no había conexión confiable a Internet. Cada sucursal opera de forma autónoma con su propia base de datos local, y por la noche sincroniza sus transacciones con la oficina central en Lima.

**Propósito educativo:** Comprender sistemas distribuidos, replicación de datos, consistencia eventual, y manejo de IDs únicos en arquitecturas descentralizadas.

---

## 📐 Estándares de Código

### Reglas Generales

1. **Código limpio y profesional**
   - Sin emojis ni caracteres especiales en comentarios del código
   - Sin comentarios obvios o innecesarios
   - Nombres de variables y funciones en inglés, claros y descriptivos

2. **Comentarios mínimos**
   - Solo comentar lógica compleja o no obvia
   - Cada archivo debe tener un breve comentario al inicio explicando su propósito
   - No comentar línea por línea

3. **Formato consistente**
   - Indentación: 2 espacios (JavaScript) o 4 espacios (SQL)
   - Punto y coma obligatorio en JavaScript
   - Comillas simples para strings (excepto JSON)

### Ejemplos

**BIEN:**
```javascript
// Auth controller - handles user authentication and session management

async function login(username, password) {
  const user = await db.query('SELECT * FROM Usuarios WHERE NombreUsuario = @username');

  if (!user || !bcrypt.compareSync(password, user.Password)) {
    return { error: 'Credenciales inválidas' };
  }

  return { success: true, user };
}
```

**MAL:**
```javascript
// 🔐 Auth controller - handles user authentication and session management ✨

async function login(username, password) {
  // Buscar el usuario en la base de datos
  const user = await db.query('SELECT * FROM Usuarios WHERE NombreUsuario = @username');

  // Verificar si el usuario existe
  if (!user || !bcrypt.compareSync(password, user.Password)) {
    // Retornar error si no existe o password incorrecto
    return { error: 'Credenciales inválidas' };
  }

  // Login exitoso! 🎉
  return { success: true, user };
}
```

---

## 📊 Estado del Proyecto

### ✅ Completado

**Configuración base:**
- [x] Documentación inicial (README.md)
- [x] Estructura de carpetas completa
- [x] package.json con dependencias
- [x] Archivos .gitignore
- [x] Configs por sucursal (config.cusco.json, config.abancay.json, config.lima.json)
- [x] Estándares de código definidos

**Base de datos:**
- [x] Scripts SQL completos:
  - [x] 01-crear-bd.sql (crear bases de datos)
  - [x] 02-tablas-sucursal.sql (tablas para sucursales)
  - [x] 03-tablas-central.sql (tablas para Lima)
  - [x] 04-datos-iniciales.sql (datos de prueba)
- [x] Módulo de conexión (database/connection.js)

**Backend:**
- [x] Servidor Express básico (src/backend/server.js)
- [x] Sistema de autenticación completo:
  - [x] Modelo de usuarios (models/usuarioModel.js)
  - [x] Controlador auth (controllers/authController.js)
  - [x] Middleware auth (middleware/auth.js)
  - [x] Rutas auth (routes/auth.js)
- [x] Generador de IDs con prefijos (utils/idGenerator.js)
- [x] Script de configuración inicial (scripts/setup.js)

### 🚧 Siguiente Paso (CONTINUAR AQUÍ)

**Electron + Frontend Login:**
- [ ] Crear src/main.js (proceso principal de Electron)
- [ ] Crear src/preload.js (bridge entre procesos)
- [ ] Crear src/frontend/login.html (pantalla de login)
- [ ] Crear src/frontend/js/login.js (lógica de login)
- [ ] Crear src/frontend/css/styles.css (estilos globales)
- [ ] Crear src/frontend/index.html (dashboard principal)

### ⏳ Pendiente

**Backend - CRUD Productos:**
- [ ] Modelo de productos (models/productoModel.js)
- [ ] Controlador de productos (controllers/productosController.js)
- [ ] Rutas de productos (routes/productos.js)

**Backend - CRUD Ventas:**
- [ ] Modelo de ventas (models/ventaModel.js)
- [ ] Controlador de ventas (controllers/ventasController.js)
- [ ] Rutas de ventas (routes/ventas.js)

**Backend - Sincronización:**
- [ ] Modelo de sincronización (models/sincronizacionModel.js)
- [ ] Controlador de sincronización (controllers/sincronizacionController.js)
- [ ] Rutas de sincronización (routes/sincronizacion.js)
- [ ] Sistema de sincronización automática nocturna

**Frontend - Páginas:**
- [ ] productos.html (gestión de productos)
- [ ] ventas.html (registro de ventas)
- [ ] sincronizacion.html (panel de sincronización)
- [ ] reportes.html (solo Lima Central)

**Testing:**
- [ ] Probar login en una PC
- [ ] Probar CRUD de productos
- [ ] Probar registro de ventas
- [ ] Probar sincronización entre 2 PCs
- [ ] Verificar validación de sucursales

**Deploy:**
- [ ] npm run build para generar .exe
- [ ] Instalar en múltiples PCs
- [ ] Documentación de instalación final

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────┐
│   LIMA CENTRAL (Laptop Actual)  │
│   • Servidor Principal           │
│   • Base de datos: Central_Lima  │
│   • API REST para recibir datos  │
│   • Puerto: 3000                 │
└─────────────┬───────────────────┘
              │
              │ Sincronización
              │ Nocturna (HTTP)
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼─────────┐    ┌───▼─────────┐
│  PC         │    │  LAPTOP 2   │
│  Sucursal   │    │  Sucursal   │
│  ABANCAY    │    │  CUSCO      │
│  BD Local   │    │  BD Local   │
│  Puerto:3001│    │  Puerto:3002│
└─────────────┘    └─────────────┘
```

### Principios Clave:

1. **Autonomía Local:** Cada sucursal funciona independientemente sin conexión permanente a Lima
2. **IDs Únicos:** Uso de prefijos de sucursal para evitar conflictos (ABA-PROD-001, CUS-PROD-001, LIM-PROD-001)
3. **Consistencia Eventual:** Los datos se consolidan en la noche, no en tiempo real
4. **Tolerancia a Fallos:** Si falla la red, las sucursales siguen operando localmente
5. **Autenticación por Sucursal:** Cada usuario pertenece a una sucursal específica, validado al iniciar sesión

---

## 🛠️ Stack Tecnológico

### Frontend
- **Electron** - Framework para aplicaciones de escritorio con HTML/CSS/JS
- **HTML5/CSS3** - Interfaz de usuario
- **Bootstrap 5** - Framework CSS para diseño responsivo
- **JavaScript (Vanilla)** - Lógica del cliente

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web para API REST
- **mssql** - Driver para SQL Server (compatible con versiones 2014-2022)
- **bcryptjs** - Librería para hashear contraseñas
- **jsonwebtoken** - Autenticación JWT (opcional)

### Base de Datos
- **SQL Server** (2014, 2019 o 2022)
  - Express Edition (gratuito)
  - Compatibilidad nivel 120 (SQL Server 2014)

### Networking (Opcionales para testing remoto)
- **Red Local (LAN/WiFi)** - Para pruebas en la misma red
- **Tailscale** (opcional) - VPN para simular sucursales remotas
- **ngrok** (opcional) - Túnel para exponer servidor local

---

## 📁 Estructura del Proyecto

```
abarrotes-abejitas/
│
├── README.md                      # Este archivo
├── package.json                   # Dependencias del proyecto
├── .gitignore                     # Archivos ignorados por git
│
├── config/
│   ├── config.json                # Configuración por defecto
│   ├── config.lima.json           # Config para Lima Central
│   ├── config.abancay.json        # Config para Sucursal Abancay
│   └── config.cusco.json          # Config para Sucursal Cusco
│
├── database/
│   ├── schema/
│   │   ├── 01-crear-bd.sql       # Script para crear la base de datos
│   │   ├── 02-tablas-sucursal.sql # Tablas para sucursales
│   │   ├── 03-tablas-central.sql  # Tablas para Lima Central
│   │   └── 04-datos-iniciales.sql # Datos de prueba
│   └── connection.js              # Módulo de conexión a SQL Server
│
├── src/
│   ├── main.js                    # Proceso principal de Electron
│   ├── preload.js                 # Script de precarga
│   │
│   ├── backend/
│   │   ├── server.js              # Servidor Express
│   │   ├── routes/
│   │   │   ├── auth.js            # Endpoints de autenticación
│   │   │   ├── productos.js       # Endpoints de productos
│   │   │   ├── ventas.js          # Endpoints de ventas
│   │   │   └── sincronizacion.js  # Endpoints de sincronización
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── productosController.js
│   │   │   ├── ventasController.js
│   │   │   └── sincronizacionController.js
│   │   ├── models/
│   │   │   ├── usuarioModel.js
│   │   │   ├── productoModel.js
│   │   │   ├── ventaModel.js
│   │   │   └── sincronizacionModel.js
│   │   ├── middleware/
│   │   │   └── auth.js            # Middleware de autenticación
│   │   └── utils/
│   │       └── idGenerator.js     # Generador de IDs con prefijos
│   │
│   └── frontend/
│       ├── login.html             # Página de inicio de sesión
│       ├── index.html             # Página principal (dashboard)
│       ├── ventas.html            # Página de ventas
│       ├── productos.html         # Página de productos
│       ├── sincronizacion.html    # Página de sincronización
│       ├── reportes.html          # Página de reportes (Lima)
│       ├── css/
│       │   └── styles.css
│       └── js/
│           ├── login.js
│           ├── ventas.js
│           ├── productos.js
│           └── sincronizacion.js
│
├── scripts/
│   └── setup.js                   # Script de instalación inicial
│
└── docs/
    ├── INSTALACION.md             # Guía de instalación detallada
    ├── CONFIGURACION.md           # Guía de configuración
    └── ARQUITECTURA.md            # Documentación técnica
```

---

## 💾 Esquema de Base de Datos

### Compatibilidad
✅ Compatible con SQL Server 2014, 2016, 2017, 2019, 2022

### Tablas Principales (Sucursales)

```sql
-- Usuarios (en cada sucursal)
CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,          -- Hash bcrypt
    NombreCompleto VARCHAR(100) NOT NULL,
    Rol VARCHAR(20) NOT NULL,                -- CAJERO, ADMIN, SUPERVISOR
    SucursalPermitida VARCHAR(3) NOT NULL,   -- ABA, CUS, LIM
    Activo BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    UltimaModificacion DATETIME
);

-- Productos en cada sucursal
CREATE TABLE Productos (
    ProductoID VARCHAR(20) PRIMARY KEY,      -- Ej: ABA-PROD-001, CUS-PROD-001
    CodigoSucursal VARCHAR(3) NOT NULL,      -- ABA, CUS, LIM
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255),
    Precio DECIMAL(10,2) NOT NULL,
    Stock INT DEFAULT 0,
    StockMinimo INT DEFAULT 5,               -- Alerta de reabastecimiento
    CodigoBarras VARCHAR(50),                -- Para agrupar en reportes
    Categoria VARCHAR(50),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaModificacion DATETIME,
    Sincronizado BIT DEFAULT 0
);

-- Ventas en cada sucursal
CREATE TABLE Ventas (
    VentaID VARCHAR(25) PRIMARY KEY,         -- Ej: ABA-20241030-001
    CodigoSucursal VARCHAR(3) NOT NULL,
    ClienteNombre VARCHAR(100),
    ClienteDNI VARCHAR(8),
    Total DECIMAL(10,2) NOT NULL,
    FechaVenta DATETIME DEFAULT GETDATE(),
    UsuarioID INT,                           -- Referencia al cajero
    Sincronizado BIT DEFAULT 0,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Detalle de ventas
CREATE TABLE DetalleVenta (
    DetalleID VARCHAR(30) PRIMARY KEY,       -- Ej: ABA-20241030-001-1
    VentaID VARCHAR(25) NOT NULL,
    ProductoID VARCHAR(20) NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Log de sincronización
CREATE TABLE LogSincronizacion (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    FechaInicio DATETIME DEFAULT GETDATE(),
    FechaFin DATETIME,
    RegistrosEnviados INT,
    Estado VARCHAR(20),                      -- EXITO, ERROR, PENDIENTE
    Mensaje VARCHAR(500)
);
```

### Tablas Lima Central

```sql
-- Consolidado de todas las ventas
CREATE TABLE Ventas_Consolidadas (
    VentaID VARCHAR(25) PRIMARY KEY,
    CodigoSucursal VARCHAR(3) NOT NULL,
    ClienteNombre VARCHAR(100),
    ClienteDNI VARCHAR(8),
    Total DECIMAL(10,2) NOT NULL,
    FechaVenta DATETIME,
    UsuarioID INT,                           -- ID del cajero
    NombreCajero VARCHAR(100),               -- Nombre del cajero
    FechaSincronizacion DATETIME DEFAULT GETDATE()
);

-- Detalle de ventas consolidadas
CREATE TABLE DetalleVenta_Consolidado (
    DetalleID VARCHAR(30) PRIMARY KEY,
    VentaID VARCHAR(25) NOT NULL,
    ProductoID VARCHAR(20) NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (VentaID) REFERENCES Ventas_Consolidadas(VentaID)
);

-- Consolidado de productos (con stock por sucursal)
CREATE TABLE Productos_Consolidado (
    ProductoID VARCHAR(20) PRIMARY KEY,      -- ABA-PROD-001, CUS-PROD-001
    CodigoSucursal VARCHAR(3) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Precio DECIMAL(10,2),
    Stock INT,
    CodigoBarras VARCHAR(50),
    Categoria VARCHAR(50),
    FechaSincronizacion DATETIME DEFAULT GETDATE()
);

-- Información de sucursales
CREATE TABLE Sucursales (
    CodigoSucursal VARCHAR(3) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Ciudad VARCHAR(50),
    Direccion VARCHAR(200),
    Telefono VARCHAR(15),
    UltimaSincronizacion DATETIME,
    Estado VARCHAR(20) DEFAULT 'ACTIVA'      -- ACTIVA, INACTIVA
);
```

### Índices para Performance

```sql
-- Índices en sucursales
CREATE INDEX IX_Ventas_Fecha ON Ventas(FechaVenta);
CREATE INDEX IX_Ventas_Sincronizado ON Ventas(Sincronizado);
CREATE INDEX IX_Productos_Sucursal ON Productos(CodigoSucursal);
CREATE INDEX IX_Productos_Sincronizado ON Productos(Sincronizado);
CREATE INDEX IX_DetalleVenta_Venta ON DetalleVenta(VentaID);
CREATE INDEX IX_Usuarios_Sucursal ON Usuarios(SucursalPermitida);

-- Índices en Lima Central
CREATE INDEX IX_VentasConsolidadas_Fecha ON Ventas_Consolidadas(FechaVenta);
CREATE INDEX IX_VentasConsolidadas_Sucursal ON Ventas_Consolidadas(CodigoSucursal);
CREATE INDEX IX_ProductosConsolidado_Sucursal ON Productos_Consolidado(CodigoSucursal);
```

---

## ⚙️ Archivo de Configuración

### config.json (Estructura)

```json
{
  "tipo": "SUCURSAL",
  "sucursal_instalacion": "ABA",
  "nombre_sucursal": "Abancay",

  "base_datos": {
    "servidor": "localhost",
    "bd": "Sucursal_Abancay",
    "usuario": "sa",
    "password": "tuPassword123",
    "puerto": 1433
  },

  "servidor_app": {
    "puerto": 3001,
    "host": "localhost"
  },

  "servidor_central": {
    "host": "192.168.1.10",
    "puerto": 3000,
    "habilitado": true
  },

  "sincronizacion": {
    "automatica": true,
    "hora": "23:00",
    "intervalo_minutos": null
  },

  "negocio": {
    "nombre_empresa": "Abarrotes Las Abejitas",
    "ruc": "20123456789",
    "direccion": "Av. Ejemplo 123, Abancay"
  }
}
```

---

## 🚀 Instalación

### Requisitos Previos

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **SQL Server** 2014+ Express o superior ([descargar](https://www.microsoft.com/sql-server/sql-server-downloads))
- **Git** (opcional) ([descargar](https://git-scm.com/))

### Paso 1: Clonar o Descargar el Proyecto

```bash
# Si usas Git
git clone https://github.com/tuusuario/abarrotes-abejitas.git
cd abarrotes-abejitas

# O descarga el ZIP y extrae
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar SQL Server

**En CADA PC:**

1. Abrir SQL Server Management Studio (SSMS)
2. Ejecutar los scripts en orden:
   ```sql
   -- Desde database/schema/
   01-crear-bd.sql
   02-tablas-sucursal.sql (en sucursales)
   03-tablas-central.sql (solo en Lima)
   04-datos-iniciales.sql
   ```

### Paso 4: Configurar la Aplicación

**Para Lima Central:**
```bash
cp config/config.lima.json config/config.json
# Editar config.json con tus datos
```

**Para Sucursal Abancay:**
```bash
cp config/config.abancay.json config/config.json
# Editar config.json con tus datos
```

**Para Sucursal Cusco:**
```bash
cp config/config.cusco.json config/config.json
# Editar config.json con tus datos
```

### Paso 5: Probar la Conexión

```bash
node database/connection.js
# Debería mostrar: ✅ Conectado a SQL Server
```

### Paso 6: Iniciar la Aplicación

**Modo Desarrollo:**
```bash
npm run dev
```

**Compilar para Producción:**
```bash
npm run build
# Genera: dist/AbarrotesAbejitas-Setup.exe
```

---

## 🔄 Flujo de Sincronización

### Proceso Nocturno (23:00)

```
SUCURSAL ABANCAY:
1. Selecciona registros con Sincronizado = 0
2. Prepara JSON con las transacciones (ventas y productos)
3. Envía POST a Lima: http://192.168.1.10:3000/api/sincronizar
4. Recibe confirmación
5. Marca registros como Sincronizado = 1
6. Guarda log de sincronización

LIMA CENTRAL:
1. Recibe POST en /api/sincronizar
2. Valida los datos
3. Inserta en tablas consolidadas (Ventas_Consolidadas, DetalleVenta_Consolidado, Productos_Consolidado)
4. Devuelve confirmación
5. Actualiza tabla Sucursales (UltimaSincronizacion)
```

### Endpoint de Sincronización

```javascript
// POST /api/sincronizar
{
  "sucursal": "ABA",
  "timestamp": "2024-10-30T23:00:00Z",
  "ventas": [
    {
      "VentaID": "ABA-20241030-001",
      "CodigoSucursal": "ABA",
      "ClienteNombre": "Juan Pérez",
      "ClienteDNI": "12345678",
      "Total": 150.50,
      "FechaVenta": "2024-10-30T14:30:00Z",
      "UsuarioID": 1,
      "NombreCajero": "María García",
      "detalles": [
        {
          "DetalleID": "ABA-20241030-001-1",
          "ProductoID": "ABA-PROD-001",
          "Cantidad": 2,
          "PrecioUnitario": 75.25,
          "Subtotal": 150.50
        }
      ]
    }
  ],
  "productos": [
    {
      "ProductoID": "ABA-PROD-001",
      "CodigoSucursal": "ABA",
      "Nombre": "Miel Premium",
      "Precio": 75.25,
      "Stock": 10,
      "CodigoBarras": "7751234567890",
      "Categoria": "Alimentos"
    }
  ]
}
```

---

## 🎯 Roadmap de Implementación

### Fase 1: Base (Semana 1)
- [ ] Configurar proyecto Node.js + Electron
- [ ] Crear esquema de base de datos
- [ ] Implementar conexión a SQL Server
- [ ] Crear interfaz básica de ventas

### Fase 2: CRUD Local (Semana 2)
- [ ] Módulo de productos (crear, listar, editar)
- [ ] Módulo de ventas (registrar venta, detalle)
- [ ] Validaciones y manejo de errores
- [ ] Interfaz de usuario mejorada

### Fase 3: Sincronización (Semana 3)
- [ ] Servidor Express en Lima
- [ ] Endpoint POST /api/sincronizar
- [ ] Cliente de sincronización en sucursales
- [ ] Proceso manual de sincronización
- [ ] Logs de sincronización

### Fase 4: Automatización (Semana 4)
- [ ] Sincronización automática nocturna
- [ ] Notificaciones de estado
- [ ] Manejo de conflictos básico
- [ ] Dashboard en Lima Central

### Fase 5: Testing & Deploy (Semana 5)
- [ ] Pruebas en red local
- [ ] Instalación en las 3 PCs
- [ ] Configuración específica por sucursal
- [ ] Compilar ejecutables
- [ ] Documentación final

---

## 🧪 Testing

### Probar en Red Local

1. **Verificar conexión entre PCs:**
```bash
# Desde Abancay, hacer ping a Lima
ping 192.168.1.10

# Si responde, están conectadas ✅
```

2. **Probar sincronización manual:**
```bash
# En Abancay, hacer una venta de prueba
# Luego ejecutar sincronización
# Verificar en Lima que llegó la venta
```

3. **Verificar logs:**
```sql
-- En cada sucursal
SELECT * FROM LogSincronizacion
ORDER BY FechaInicio DESC;
```

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar en modo desarrollo
npm run debug            # Iniciar con DevTools abierto

# Producción
npm run build            # Compilar aplicación
npm run build:win        # Compilar para Windows
npm run build:all        # Compilar para todas las plataformas

# Base de datos
npm run db:create        # Crear base de datos
npm run db:seed          # Insertar datos de prueba
npm run db:reset         # Resetear base de datos

# Testing
npm test                 # Ejecutar tests
npm run test:sync        # Probar sincronización
```

---

## 🐛 Troubleshooting

### Error: No se puede conectar a SQL Server
```bash
# Verificar que SQL Server está corriendo
services.msc
# Buscar: SQL Server (SQLEXPRESS)

# Verificar conexión TCP/IP habilitada
# SQL Server Configuration Manager > Protocols > TCP/IP > Enabled
```

### Error: Puerto 3000 ya en uso
```bash
# Cambiar puerto en config.json
"servidor_app": {
  "puerto": 3001  # Usar otro puerto
}
```

### Error: No se pueden ver las PCs en la red
```bash
# Desactivar Firewall temporalmente
# O agregar excepción para el puerto 3000/3001/3002
```

---

## 📚 Conceptos Importantes

### 1. IDs Únicos con Prefijos
```javascript
// Cada sucursal genera IDs con su prefijo
Abancay: ABA-20241030-001
Cusco:   CUS-20241030-001
Lima:    LIM-20241030-001

// TODOS los registros creados localmente llevan prefijo
Productos: ABA-PROD-001, CUS-PROD-001
Ventas: ABA-20241030-001, CUS-20241030-001
Detalles: ABA-20241030-001-1, CUS-20241030-001-1

// Nunca hay conflicto porque el prefijo es único
```

### 2. Consistencia Eventual
```
Durante el día: Datos INCONSISTENTES entre sucursales
Después de sincronización: Datos CONSISTENTES en Lima

Esto es ACEPTABLE para el negocio (no es banca en tiempo real)
```

### 3. Autonomía Local
```
Si se cae Internet:
✅ Abancay sigue vendiendo (usa BD local)
✅ Cusco sigue vendiendo (usa BD local)
❌ No se sincronizan hasta que vuelva conexión

Esto es la VENTAJA del sistema distribuido
```

### 4. Stock Independiente por Sucursal
```
MISMO PRODUCTO, DIFERENTE ID:
- Abancay: ABA-PROD-001 "Miel Premium" → Stock: 10 unidades
- Cusco:   CUS-PROD-001 "Miel Premium" → Stock: 200 unidades

Cada sucursal gestiona su propio inventario.
Lima consolida la información:
"Miel Premium: 210 unidades totales (10 en Abancay, 200 en Cusco)"
```

### 5. Validación de Sucursal en Login
```
PC configurada como Sucursal Cusco (config.json):
✅ Usuario maria_cus (SucursalPermitida=CUS) → Login exitoso
❌ Usuario juan_aba (SucursalPermitida=ABA) → Login rechazado

Esto evita que alguien use el sistema en la sucursal incorrecta
```

---

## 🤝 Contribuir

Para agregar nuevas funcionalidades o reportar bugs, crear un issue en el repositorio.

---

## 📄 Licencia

MIT License - Proyecto educativo

---

## 👨‍💻 Autor

**Tu Nombre**
- Curso: Sistemas Distribuidos
- Universidad: [Tu Universidad]
- Año: 2024

---

## 🎓 Referencias

- [SQL Server Documentation](https://docs.microsoft.com/sql-server/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [CAP Theorem](https://en.wikipedia.org/wiki/CAP_theorem)
- [Distributed Systems Principles](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/)

---

## 📞 Contacto

Para preguntas o soporte técnico sobre el proyecto, contactar a: [tu-email@example.com]

---

**¡Éxito con tu proyecto! 🐝🚀**
