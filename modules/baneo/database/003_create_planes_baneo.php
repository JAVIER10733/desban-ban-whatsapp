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
// Tabla: planes_baneo
// JSONB de PostgreSQL se convierte a JSON en MySQL.
// plan_baneo (ENUM tipo) se define directo en la columna slug.
// TIMESTAMPTZ se convierte a DATETIME.
// RLS se omite (no existe en MySQL).
// ============================================================

$pdo->exec("
CREATE TABLE IF NOT EXISTS planes_baneo (
    id                  CHAR(36)        PRIMARY KEY,
    slug                ENUM('basico','pro','enterprise','business','business-pro') NOT NULL UNIQUE,
    nombre              VARCHAR(50)     NOT NULL,
    tipo                VARCHAR(20)     NOT NULL DEFAULT 'personal',
    precio_usd          DECIMAL(8,2)    NOT NULL,
    descripcion         VARCHAR(200),
    tiempo_respuesta    VARCHAR(20)     NOT NULL,
    numeros_incluidos   INT             NOT NULL DEFAULT 1,
    incluye_garantia    BOOLEAN         NOT NULL DEFAULT FALSE,
    es_popular          BOOLEAN         NOT NULL DEFAULT FALSE,
    badge_texto         VARCHAR(30),
    features            JSON,
    no_incluye          JSON,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    orden               INT             NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_planes_baneo_activo (activo, tipo, orden),
    INDEX idx_planes_baneo_slug   (slug)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Planes disponibles para el servicio de baneo'
");

echo "Tabla planes_baneo creada.\n";

// ============================================================
// Trigger: generar UUID al insertar
// ============================================================

$pdo->exec("DROP TRIGGER IF EXISTS trg_planes_baneo_insert");

$pdo->exec("
CREATE TRIGGER trg_planes_baneo_insert
BEFORE INSERT ON planes_baneo
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END
");

echo "Trigger trg_planes_baneo_insert creado.\n";

// ============================================================
// Trigger: updated_at automático
// ON UPDATE CURRENT_TIMESTAMP ya lo maneja la columna,
// pero se agrega el trigger para mantener paridad con Supabase.
// ============================================================

$pdo->exec("DROP TRIGGER IF EXISTS trg_planes_baneo_updated");

$pdo->exec("
CREATE TRIGGER trg_planes_baneo_updated
BEFORE UPDATE ON planes_baneo
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END
");

echo "Trigger trg_planes_baneo_updated creado.\n";
echo "Todo ejecutado con éxito.\n";