-- Script para agregar campos de sincronización a la tabla Ventas
-- EJECUTAR ESTE SCRIPT EN AMBAS BASES DE DATOS: Abejitas_Cusco Y Abejitas_Lima

USE Abejitas_Cusco;  -- Cambiar a Abejitas_Lima cuando lo ejecutes en Lima
GO

-- Verificar si la columna Sincronizada existe, si no, agregarla
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Ventas') AND name = 'Sincronizada')
BEGIN
    ALTER TABLE Ventas
    ADD Sincronizada BIT NULL DEFAULT 0;

    PRINT 'Columna Sincronizada agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'La columna Sincronizada ya existe';
END
GO

-- Verificar si la columna FechaSincronizacion existe, si no, agregarla
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Ventas') AND name = 'FechaSincronizacion')
BEGIN
    ALTER TABLE Ventas
    ADD FechaSincronizacion DATETIME NULL;

    PRINT 'Columna FechaSincronizacion agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'La columna FechaSincronizacion ya existe';
END
GO

-- Actualizar ventas existentes para marcarlas como no sincronizadas
UPDATE Ventas
SET Sincronizada = 0
WHERE Sincronizada IS NULL;
GO

PRINT 'Script completado exitosamente';
GO
