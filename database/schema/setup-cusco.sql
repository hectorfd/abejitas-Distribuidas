USE Abejitas_Cusco;
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

CREATE TABLE Productos (
    ProductoID VARCHAR(20) PRIMARY KEY,
    CodigoSucursal VARCHAR(3) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255),
    Precio DECIMAL(10,2) NOT NULL,
    Stock INT DEFAULT 0,
    StockMinimo INT DEFAULT 5,
    CodigoBarras VARCHAR(50),
    Categoria VARCHAR(50),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaModificacion DATETIME,
    Sincronizado BIT DEFAULT 0
);

CREATE TABLE Ventas (
    VentaID VARCHAR(25) PRIMARY KEY,
    CodigoSucursal VARCHAR(3) NOT NULL,
    ClienteNombre VARCHAR(100),
    ClienteDNI VARCHAR(8),
    Total DECIMAL(10,2) NOT NULL,
    FechaVenta DATETIME DEFAULT GETDATE(),
    UsuarioID INT,
    Sincronizado BIT DEFAULT 0,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
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
    FechaInicio DATETIME DEFAULT GETDATE(),
    FechaFin DATETIME,
    RegistrosEnviados INT,
    Estado VARCHAR(20),
    Mensaje VARCHAR(500)
);

CREATE INDEX IX_Ventas_Fecha ON Ventas(FechaVenta);
CREATE INDEX IX_Ventas_Sincronizado ON Ventas(Sincronizado);
CREATE INDEX IX_Productos_Sucursal ON Productos(CodigoSucursal);
CREATE INDEX IX_Productos_Sincronizado ON Productos(Sincronizado);
CREATE INDEX IX_DetalleVenta_Venta ON DetalleVenta(VentaID);
CREATE INDEX IX_Usuarios_Sucursal ON Usuarios(SucursalPermitida);

INSERT INTO Usuarios (NombreUsuario, Password, NombreCompleto, Rol, SucursalPermitida)
VALUES ('admin', '$2a$10$rGHLyVqZ8Z5.6nP4J7BYGu3Y6YXqI.8LHMJmZxQJ3L.YqE8KqLY4G', 'Administrador Cusco', 'ADMIN', 'CUS');

INSERT INTO Productos (ProductoID, CodigoSucursal, Nombre, Descripcion, Precio, Stock, CodigoBarras, Categoria)
VALUES
    ('CUS-PROD-001', 'CUS', 'Coca Cola 2L', 'Gaseosa', 5.50, 100, '7751234567890', 'Bebidas'),
    ('CUS-PROD-002', 'CUS', 'Pan Frances', 'Pan del dia', 0.50, 200, '7751234567891', 'Panaderia'),
    ('CUS-PROD-003', 'CUS', 'Arroz Superior', 'Bolsa 1kg', 4.20, 50, '7751234567892', 'Abarrotes');

PRINT 'Abejitas_Cusco: Tables and data created successfully';
PRINT 'User: admin / admin123';
GO
