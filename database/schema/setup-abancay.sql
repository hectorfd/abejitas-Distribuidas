USE Abejitas_Abancay;
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
VALUES ('admin', '$2a$10$rGHLyVqZ8Z5.6nP4J7BYGu3Y6YXqI.8LHMJmZxQJ3L.YqE8KqLY4G', 'Administrador Abancay', 'ADMIN', 'ABA');

INSERT INTO Productos (ProductoID, CodigoSucursal, Nombre, Descripcion, Precio, Stock, CodigoBarras, Categoria)
VALUES
    ('ABA-PROD-001', 'ABA', 'Inka Cola 2L', 'Gaseosa', 5.00, 80, '7751234567893', 'Bebidas'),
    ('ABA-PROD-002', 'ABA', 'Leche Gloria', 'Leche evaporada', 3.80, 150, '7751234567894', 'Lacteos'),
    ('ABA-PROD-003', 'ABA', 'Aceite Primor', 'Botella 1L', 8.50, 40, '7751234567895', 'Abarrotes');

PRINT 'Abejitas_Abancay: Tables and data created successfully';
PRINT 'User: admin / admin123';
GO
