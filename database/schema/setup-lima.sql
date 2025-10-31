USE Abejitas_Lima;
GO

CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    NombreCompleto VARCHAR(100) NOT NULL,
    Rol VARCHAR(20) NOT NULL,
    SucursalPermitida VARCHAR(3) NOT NULL,
    Activo BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    UltimaModificacion DATETIME
);

CREATE TABLE Ventas_Consolidadas (
    VentaID VARCHAR(25) PRIMARY KEY,
    CodigoSucursal VARCHAR(3) NOT NULL,
    ClienteNombre VARCHAR(100),
    ClienteDNI VARCHAR(8),
    Total DECIMAL(10,2) NOT NULL,
    FechaVenta DATETIME,
    UsuarioID INT,
    NombreCajero VARCHAR(100),
    FechaSincronizacion DATETIME DEFAULT GETDATE()
);

CREATE TABLE DetalleVenta_Consolidado (
    DetalleID VARCHAR(30) PRIMARY KEY,
    VentaID VARCHAR(25) NOT NULL,
    ProductoID VARCHAR(20) NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (VentaID) REFERENCES Ventas_Consolidadas(VentaID)
);

CREATE TABLE Productos_Consolidado (
    ProductoID VARCHAR(20) PRIMARY KEY,
    CodigoSucursal VARCHAR(3) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Precio DECIMAL(10,2),
    Stock INT,
    CodigoBarras VARCHAR(50),
    Categoria VARCHAR(50),
    FechaSincronizacion DATETIME DEFAULT GETDATE()
);

CREATE TABLE Sucursales (
    CodigoSucursal VARCHAR(3) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Ciudad VARCHAR(50),
    Direccion VARCHAR(200),
    Telefono VARCHAR(15),
    UltimaSincronizacion DATETIME,
    Estado VARCHAR(20) DEFAULT 'ACTIVA'
);

CREATE TABLE LogSincronizacion (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    FechaInicio DATETIME DEFAULT GETDATE(),
    FechaFin DATETIME,
    RegistrosEnviados INT,
    Estado VARCHAR(20),
    Mensaje VARCHAR(500)
);

CREATE INDEX IX_VentasConsolidadas_Fecha ON Ventas_Consolidadas(FechaVenta);
CREATE INDEX IX_VentasConsolidadas_Sucursal ON Ventas_Consolidadas(CodigoSucursal);
CREATE INDEX IX_ProductosConsolidado_Sucursal ON Productos_Consolidado(CodigoSucursal);

INSERT INTO Usuarios (NombreUsuario, Password, NombreCompleto, Rol, SucursalPermitida)
VALUES ('admin', '$2a$10$rGHLyVqZ8Z5.6nP4J7BYGu3Y6YXqI.8LHMJmZxQJ3L.YqE8KqLY4G', 'Administrador Lima', 'ADMIN', 'LIM');

INSERT INTO Sucursales (CodigoSucursal, Nombre, Ciudad, Direccion, Estado)
VALUES
    ('CUS', 'Sucursal Cusco', 'Cusco', 'Av. El Sol 123', 'ACTIVA'),
    ('ABA', 'Sucursal Abancay', 'Abancay', 'Jr. Arequipa 456', 'ACTIVA'),
    ('LIM', 'Oficina Central', 'Lima', 'Av. La Marina 789', 'ACTIVA');

PRINT 'Abejitas_Lima: Tables and data created successfully';
PRINT 'User: admin / admin123';
GO
