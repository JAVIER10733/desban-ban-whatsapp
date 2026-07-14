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
// Tabla: solicitudes_baneo
// Los ENUM de PostgreSQL se convierten directamente en
// columnas ENUM de MySQL. UUID se reemplaza por CHAR(36).
// ROW LEVEL SECURITY no existe en MySQL, se omite.
// ============================================================

$pdo->exec("
CREATE TABLE IF NOT EXISTS solicitudes_baneo (
    id                  CHAR(36)        PRIMARY KEY,
    numero              VARCHAR(20)     NOT NULL,
    prefijo_pais        VARCHAR(6)      NOT NULL DEFAULT '+52',
    motivo              ENUM('acoso','spam','estafa','suplantacion','contenido-ilegal','otro') NOT NULL,
    otro_motivo         TEXT,
    descripcion         TEXT            NOT NULL,
    plan                ENUM('basico','pro','enterprise','business','business-pro') NOT NULL DEFAULT 'pro',
    nombre              VARCHAR(100)    NOT NULL,
    email               VARCHAR(255)    NOT NULL,
    whatsapp_contacto   VARCHAR(25),
    pref_contacto       VARCHAR(20)     NOT NULL DEFAULT 'email',
    acepta_aviso        BOOLEAN         NOT NULL DEFAULT FALSE,
    estado              ENUM('pendiente_pago','en_revision','reporte_enviado','esperando_meta','completado','fallido','cancelado') NOT NULL DEFAULT 'pendiente_pago',
    payment_intent_id   VARCHAR(100),
    pago_completado     BOOLEAN         NOT NULL DEFAULT FALSE,
    monto_pagado        DECIMAL(8,2),
    ip_origen           VARCHAR(45),
    caso_numero         VARCHAR(20)     NULL COMMENT 'Generado por trigger al insertar',
    asesor_id           CHAR(36)        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email     (email),
    INDEX idx_estado    (estado),
    INDEX idx_numero    (numero),
    INDEX idx_created   (created_at),
    INDEX idx_motivo    (motivo),
    INDEX idx_payment   (payment_intent_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Solicitudes de baneo de números WhatsApp'
");

echo "Tabla solicitudes_baneo creada.\n";

// ============================================================
// Trigger: generar UUID y caso_numero al insertar
// En MySQL, GENERATED ALWAYS no soporta concatenación con UUID.
// Se resuelve con un trigger BEFORE INSERT.
// ============================================================

$pdo->exec("DROP TRIGGER IF EXISTS trg_solicitudes_baneo_insert");

$pdo->exec("
CREATE TRIGGER trg_solicitudes_baneo_insert
BEFORE INSERT ON solicitudes_baneo
FOR EACH ROW
BEGIN
    DECLARE nuevo_uuid CHAR(36);
    SET nuevo_uuid = UUID();

    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = nuevo_uuid;
    ELSE
        SET nuevo_uuid = NEW.id;
    END IF;

    SET NEW.caso_numero = CONCAT('BAN-', UPPER(SUBSTRING(nuevo_uuid, 1, 6)));
END
");

echo "Trigger trg_solicitudes_baneo_insert creado.\n";

// ============================================================
// Trigger: updated_at automático
// En MySQL, ON UPDATE CURRENT_TIMESTAMP ya lo maneja la columna,
// pero se agrega el trigger para mantener paridad con Supabase.
// ============================================================

$pdo->exec("DROP TRIGGER IF EXISTS trg_solicitudes_baneo_updated");

$pdo->exec("
CREATE TRIGGER trg_solicitudes_baneo_updated
BEFORE UPDATE ON solicitudes_baneo
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END
");

echo "Trigger trg_solicitudes_baneo_updated creado.\n";
echo "Todo ejecutado con éxito.\n";