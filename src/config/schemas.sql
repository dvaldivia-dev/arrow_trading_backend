CREATE DATABASE IF NOT EXISTS ATC;

USE ATC;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS `syUsers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `Username` VARCHAR(50) NOT NULL UNIQUE,
  `Password` VARCHAR(255) NOT NULL, -- En una aplicación real, siempre almacena contraseñas hasheadas.
  `Full_Name` VARCHAR(100) NOT NULL,
  `Status` TINYINT(1) NOT NULL DEFAULT 1, -- 1: Activo, 0: Inactivo
  `Type` VARCHAR(50),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Facturas (Invoices)
CREATE TABLE IF NOT EXISTS `Invoices` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Consecutivo` INT,
  `Num` VARCHAR(50),
  `S0Num` VARCHAR(50),
  `IssueDate` DATETIME,
  `BillTo` VARCHAR(255),
  `ShipTo` VARCHAR(255),
  `lncotenn` VARCHAR(50),
  `ItemQty` INT,
  `PriceEach` DECIMAL(10, 2),
  `Amount` DECIMAL(10, 2),
  `Subtotal` DECIMAL(10, 2),
  `Total` DECIMAL(10, 2),
  `Status` TINYINT(1) NOT NULL DEFAULT 0, -- 0: Pendiente, 1: Completada
  PRIMARY KEY (`Id`),
  INDEX `idx_consecutivo` (`Consecutivo`),
  INDEX `idx_issuedate` (`IssueDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Información de Facturación (Billing)
-- Esta tabla parece ser para obtener listas de autocompletado.
CREATE TABLE IF NOT EXISTS `Billing` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `BillTo` VARCHAR(255) NOT NULL,
  `ShipTo` VARCHAR(255) NOT NULL,
  `lncotenn` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_billing_info` (`BillTo`, `ShipTo`, `lncotenn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar datos de ejemplo (opcional)
INSERT INTO `syUsers` (`Username`, `Password`, `Full_Name`, `Status`, `Type`) VALUES
('admin', 'admin123', 'Administrator', 1, 'Admin'), -- Recuerda usar hashes en producción
('testuser', 'password', 'Test User', 1, 'User');

INSERT INTO `Invoices` (`Consecutivo`, `IssueDate`, `BillTo`, `ShipTo`, `lncotenn`, `ItemQty`, `PriceEach`, `Amount`, `Subtotal`, `Total`, `Status`) VALUES
(1001, '2024-01-15 10:00:00', 'Cliente A', 'Destino A', 'FOB', 10, 25.50, 255.00, 255.00, 300.00, 0),
(1002, '2024-01-16 11:30:00', 'Cliente B', 'Destino B', 'CIF', 5, 100.00, 500.00, 500.00, 580.00, 1);

INSERT INTO `Billing` (`BillTo`, `ShipTo`, `lncotenn`) VALUES
('Cliente A', 'Destino A', 'FOB'),
('Cliente B', 'Destino B', 'CIF'),
('Cliente C', 'Destino C', 'EXW');