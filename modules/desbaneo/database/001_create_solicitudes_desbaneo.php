<?php
// Conexión a la base de datos
$host = 'localhost';
$dbname = 'ban_desban_wapro';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}

// ============================================================
// Tabla: solicitudes_desbaneo
// ============================================================

$pdo->exec("
CREATE TABLE IF NOT EXISTS solicitudes_desbaneo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código público: DSB-2025-ABC123',
    cliente_id INT NULL COMMENT 'FK a clientes si está registrado',
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono_contacto VARCHAR(20) NULL,
    pais VARCHAR(50) NOT NULL DEFAULT 'Ecuador',
    numero_whatsapp VARCHAR(20) NOT NULL COMMENT 'Número con código de país (+593991234567)',
    numero_hash VARCHAR(64) NOT NULL COMMENT 'Hash del número para privacidad',
    tipo_baneo ENUM('temporal','permanente','suspicion','spam','verification','reports','otro') NOT NULL,
    mensaje_error TEXT NULL COMMENT 'Mensaje exacto de error',
    dias_baneado INT NULL COMMENT 'Días que lleva baneado',
    plan_id INT NOT NULL COMMENT 'FK a planes_desbaneo',
    precio_pagado DECIMAL(10,2) NOT NULL COMMENT 'Precio al momento de la compra',
    descuento_aplicado DECIMAL(5,2) DEFAULT 0.00,
    codigo_descuento VARCHAR(50) NULL,
    estado_id INT NOT NULL DEFAULT 1 COMMENT 'FK a estados_desbaneo',
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_trabajo DATETIME NULL,
    fecha_estimada_fin DATETIME NULL,
    fecha_completado DATETIME NULL,
    fecha_reembolso DATETIME NULL,
    tiempo_respuesta_horas DECIMAL(5,2) NULL COMMENT 'Horas hasta primera respuesta',
    tiempo_total_horas DECIMAL(5,2) NULL COMMENT 'Horas totales hasta completar',
    reintentos_usados INT DEFAULT 0,
    reintentos_maximos INT DEFAULT 1,
    metodo_pago ENUM('tarjeta','paypal','transferencia','crypto','efectivo','yape_plin') NULL,
    id_transaccion_pago VARCHAR(100) NULL COMMENT 'ID de Stripe/PayPal',
    estado_pago ENUM('pendiente','pagado','reembolsado','fallido') DEFAULT 'pendiente',
    fecha_pago DATETIME NULL,
    resultado ENUM('exitoso','fallido','reembolsado','pendiente','en_proceso') DEFAULT 'pendiente',
    fecha_recuperacion DATETIME NULL COMMENT 'Cuándo se recuperó el número',
    notas_internas TEXT NULL COMMENT 'Solo visible para el equipo',
    notas_cliente TEXT NULL COMMENT 'Visible para el cliente',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    utm_source VARCHAR(50) NULL,
    utm_medium VARCHAR(50) NULL,
    utm_campaign VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL COMMENT 'Soft delete',

    INDEX idx_reference_code (reference_code),
    INDEX idx_email (email),
    INDEX idx_numero_hash (numero_hash),
    INDEX idx_estado (estado_id),
    INDEX idx_plan (plan_id),
    INDEX idx_fecha_solicitud (fecha_solicitud),
    INDEX idx_resultado (resultado),
    INDEX idx_cliente (cliente_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Solicitudes de desbaneo de WhatsApp'
");

echo "Tabla creada correctamente.\n";

// ============================================================
// Trigger: Generar reference_code automáticamente
// ============================================================

$pdo->exec("DROP TRIGGER IF EXISTS before_insert_solicitudes_desbaneo");

$pdo->exec("
CREATE TRIGGER before_insert_solicitudes_desbaneo
BEFORE INSERT ON solicitudes_desbaneo
FOR EACH ROW
BEGIN
    DECLARE code_base VARCHAR(20);
    DECLARE timestamp_part VARCHAR(10);
    DECLARE random_part VARCHAR(6);

    SET timestamp_part = DATE_FORMAT(NOW(), '%Y%m%d');
    SET random_part = UPPER(SUBSTRING(MD5(RAND()), 1, 6));
    SET code_base = CONCAT('DSB-', timestamp_part, '-', random_part);

    WHILE EXISTS (SELECT 1 FROM solicitudes_desbaneo WHERE reference_code = code_base) DO
        SET random_part = UPPER(SUBSTRING(MD5(RAND()), 1, 6));
        SET code_base = CONCAT('DSB-', timestamp_part, '-', random_part);
    END WHILE;

    SET NEW.reference_code = code_base;
END
");

echo "Trigger de referencia creado correctamente.\n";

// ============================================================
// Trigger: Calcular tiempo total al completar
// ============================================================

$pdo->exec("DROP TRIGGER IF EXISTS before_update_solicitudes_desbaneo");

$pdo->exec("
CREATE TRIGGER before_update_solicitudes_desbaneo
BEFORE UPDATE ON solicitudes_desbaneo
FOR EACH ROW
BEGIN
    IF NEW.fecha_completado IS NOT NULL AND OLD.fecha_completado IS NULL THEN
        SET NEW.tiempo_total_horas = TIMESTAMPDIFF(HOUR, NEW.fecha_solicitud, NEW.fecha_completado);
    END IF;
END
");

echo "Trigger de tiempo total creado correctamente.\n";
echo "Todo ejecutado con éxito.\n";