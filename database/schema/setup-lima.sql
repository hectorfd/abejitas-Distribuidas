create database Abejitas_Lima;
go
USE Abejitas_Lima;
GO

CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    NombreCompleto VARCHAR(100) NOT NULL,
    Rol VARCHAR(20) NOT NULL,
    SucursalPermitida VARCHAR(3) NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    UltimaModificacion DATETIME
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

CREATE TABLE Productos (
    ProductoID VARCHAR(20) PRIMARY KEY,
    CodigoSucursal VARCHAR(3) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255),
    Imagen VARCHAR(500),
    PrecioCompra DECIMAL(10,2) DEFAULT 0,
    PrecioVenta DECIMAL(10,2) NOT NULL,
    Stock INT DEFAULT 0,
    StockMinimo INT DEFAULT 5,
    Categoria VARCHAR(50),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaModificacion DATETIME,
    Sincronizado BIT DEFAULT 0,
    FOREIGN KEY (CodigoSucursal) REFERENCES Sucursales(CodigoSucursal)
);

CREATE TABLE Ventas (
    VentaID VARCHAR(25) PRIMARY KEY,
    CodigoSucursal VARCHAR(3) NOT NULL,
    ClienteNombre VARCHAR(100),
    ClienteDNI VARCHAR(8),
    Total DECIMAL(10,2) NOT NULL,
    FechaVenta DATETIME DEFAULT GETDATE(),
    UsuarioID INT,
    Sincronizada BIT DEFAULT 0,
    FechaSincronizacion DATETIME NULL,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID),
    FOREIGN KEY (CodigoSucursal) REFERENCES Sucursales(CodigoSucursal)
);

CREATE TABLE DetalleVenta (
    DetalleID VARCHAR(30) PRIMARY KEY,
    VentaID VARCHAR(25) NOT NULL,
    ProductoID VARCHAR(20) NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

CREATE TABLE LogSincronizacion (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoSucursal VARCHAR(3),
    TipoSincronizacion VARCHAR(50),
    FechaHora DATETIME DEFAULT GETDATE(),
    RegistrosEnviados INT,
    Estado VARCHAR(20),
    Mensaje VARCHAR(500),
    FOREIGN KEY (CodigoSucursal) REFERENCES Sucursales(CodigoSucursal)
);

INSERT INTO Sucursales (CodigoSucursal, Nombre, Ciudad, Direccion, Estado)
VALUES
    ('LIM', 'Oficina Central', 'Lima', 'Av. La Marina 789', 'ACTIVA'),
    ('CUS', 'Sucursal Cusco', 'Cusco', 'Av. El Sol 123', 'ACTIVA'),
    ('ABA', 'Sucursal Abancay', 'Abancay', 'Jr. Arequipa 456', 'ACTIVA');

INSERT INTO Usuarios (NombreUsuario, Password, NombreCompleto, Rol, SucursalPermitida)
VALUES ('admin', '$2a$10$YqDphR0NnEoQm.7WwqUaGOpxz6X8nU.j4J3zHyDH8MYaDX7ca3F1C', 'Administrador Lima', 'ADMIN', 'LIM');

PRINT 'Abejitas_Lima: Database created successfully';
PRINT 'User: admin / admin123';
GO
