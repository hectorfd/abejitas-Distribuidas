/*
 * Script to create databases for each branch
 * Compatible with SQL Server 2014+
 * Execute only the block corresponding to your installation
 */

USE master;
GO

-- Lima Central database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Central_Lima')
BEGIN
    CREATE DATABASE Central_Lima;
    PRINT 'Database Central_Lima created successfully';
END
ELSE
BEGIN
    PRINT 'Database Central_Lima already exists';
END
GO

-- Cusco branch database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Sucursal_Cusco')
BEGIN
    CREATE DATABASE Sucursal_Cusco;
    PRINT 'Database Sucursal_Cusco created successfully';
END
ELSE
BEGIN
    PRINT 'Database Sucursal_Cusco already exists';
END
GO

-- Abancay branch database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Sucursal_Abancay')
BEGIN
    CREATE DATABASE Sucursal_Abancay;
    PRINT 'Database Sucursal_Abancay created successfully';
END
ELSE
BEGIN
    PRINT 'Database Sucursal_Abancay already exists';
END
GO

PRINT 'Databases created. Next step: Execute 02-tablas-sucursal.sql or 03-tablas-central.sql';
