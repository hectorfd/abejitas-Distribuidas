/*
 * Tables for Lima Central (consolidated data)
 * Execute this script only on Central_Lima database
 */

USE Central_Lima;
GO

-- Consolidated sales table
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

-- Consolidated sale details table
CREATE TABLE DetalleVenta_Consolidado (
    DetalleID VARCHAR(30) PRIMARY KEY,
    VentaID VARCHAR(25) NOT NULL,
    ProductoID VARCHAR(20) NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (VentaID) REFERENCES Ventas_Consolidadas(VentaID)
);

-- Consolidated products table
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

-- Branches information table
CREATE TABLE Sucursales (
    CodigoSucursal VARCHAR(3) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Ciudad VARCHAR(50),
    Direccion VARCHAR(200),
    Telefono VARCHAR(15),
    UltimaSincronizacion DATETIME,
    Estado VARCHAR(20) DEFAULT 'ACTIVA'
);

-- Performance indexes
CREATE INDEX IX_VentasConsolidadas_Fecha ON Ventas_Consolidadas(FechaVenta);
CREATE INDEX IX_VentasConsolidadas_Sucursal ON Ventas_Consolidadas(CodigoSucursal);
CREATE INDEX IX_ProductosConsolidado_Sucursal ON Productos_Consolidado(CodigoSucursal);

PRINT 'Central tables created successfully';
