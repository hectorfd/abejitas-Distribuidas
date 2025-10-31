/*
 * Initial test data
 * Execute on each database after creating tables
 * Change database name and branch code accordingly
 */

USE Sucursal_Cusco;
GO

-- Default admin user (password: admin123)
INSERT INTO Usuarios (NombreUsuario, Password, NombreCompleto, Rol, SucursalPermitida)
VALUES ('admin', '$2a$10$rGHLyVqZ8Z5.6nP4J7BYGu3Y6YXqI.8LHMJmZxQJ3L.YqE8KqLY4G', 'Administrador', 'ADMIN', 'CUS');

-- Sample products
INSERT INTO Productos (ProductoID, CodigoSucursal, Nombre, Descripcion, Precio, Stock, CodigoBarras, Categoria)
VALUES
    ('CUS-PROD-001', 'CUS', 'Coca Cola 2L', 'Gaseosa', 5.50, 100, '7751234567890', 'Bebidas'),
    ('CUS-PROD-002', 'CUS', 'Pan Frances', 'Pan del dia', 0.50, 200, '7751234567891', 'Panaderia'),
    ('CUS-PROD-003', 'CUS', 'Arroz Superior', 'Bolsa 1kg', 4.20, 50, '7751234567892', 'Abarrotes');

PRINT 'Initial data inserted successfully';
PRINT 'Default user: admin / admin123';
