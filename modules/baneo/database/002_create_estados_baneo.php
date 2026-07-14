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
// Tabla: estados_baneo
// UUID se usa CHAR(36). El ENUM estado_baneo se define
// directamente en la columna. RLS se omite (no existe en MySQL).
// ============================================================

$pdo->exec("
CREATE TABLE IF NOT EXISTS estados_baneo (
    id              CHAR(36)    PRIMARY KEY,
    solicitud_id    CHAR(36)    NOT NULL,
    estado          ENUM('pendiente_pago','en_revision','reporte_enviado','esperando_meta','completado','fallido','cancelado') NOT NULL,
    nota            TEXT,
    es_publico      BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_por      VARCHAR(50) NOT NULL DEFAULT 'sistema',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_estados_solicitud
        FOREIGN KEY (solicitud_id)
        REFERENCES solicitudes_baneo(id)
        ON DELETE CASCADE,

    INDEX idx_estados_baneo_solicitud (solicitud_id),
    INDEX idx_estados_baneo_created   (created_at ASC),
    INDEX idx_estados_baneo_publico   (solicitud_id, es_publico)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Historial de cambios de estado de cada solicitud de baneo'
");

echo "Tabla estados_baneo creada.\n";

// ============================================================
// Trigger: generar UUID al insertar
// ============================================================

$pdo->exec("DROP TRIGGER IF EXISTS trg_estados_baneo_insert");

$pdo->exec("
CREATE TRIGGER trg_estados_baneo_insert
BEFORE INSERT ON estados_baneo
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END
");

echo "Trigger trg_estados_baneo_insert creado.\n";

// ============================================================
// Vista: solicitudes con último estado
// La subconsulta con RETURNING de PostgreSQL no existe en MySQL.
// Se resuelve con subqueries correlacionadas, igual que el original.
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS v_solicitudes_baneo_resumen");

$pdo->exec("
CREATE VIEW v_solicitudes_baneo_resumen AS
SELECT
    s.id,
    s.caso_numero,
    s.numero,
    s.prefijo_pais,
    s.motivo,
    s.plan,
    s.nombre,
    s.email,
    s.estado,
    s.pago_completado,
    s.monto_pagado,
    s.created_at,
    s.updated_at,
    (
        SELECT e.nota
        FROM estados_baneo e
        WHERE e.solicitud_id = s.id
        ORDER BY e.created_at DESC
        LIMIT 1
    ) AS ultima_nota,
    (
        SELECT e.created_at
        FROM estados_baneo e
        WHERE e.solicitud_id = s.id
        ORDER BY e.created_at DESC
        LIMIT 1
    ) AS ultimo_cambio,
    (
        SELECT COUNT(*)
        FROM estados_baneo e
        WHERE e.solicitud_id = s.id
    ) AS total_estados
FROM solicitudes_baneo s
");

echo "Vista v_solicitudes_baneo_resumen creada.\n";

// ============================================================
// Procedimiento: cambiar_estado_baneo
// PostgreSQL usa FUNCTION con RETURNS. En MySQL se convierte
// en PROCEDURE porque necesita ejecutar INSERT y UPDATE juntos.
// El resultado se retorna con un SELECT al final.
// ============================================================

$pdo->exec("DROP PROCEDURE IF EXISTS cambiar_estado_baneo");

$pdo->exec("
CREATE PROCEDURE cambiar_estado_baneo(
    IN p_solicitud_id   CHAR(36),
    IN p_nuevo_estado   VARCHAR(30),
    IN p_nota           TEXT,
    IN p_es_publico     BOOLEAN,
    IN p_creado_por     VARCHAR(50)
)
BEGIN
    DECLARE v_nuevo_id CHAR(36);

    SET v_nuevo_id = UUID();

    INSERT INTO estados_baneo (id, solicitud_id, estado, nota, es_publico, creado_por)
    VALUES (v_nuevo_id, p_solicitud_id, p_nuevo_estado, p_nota, p_es_publico, p_creado_por);

    UPDATE solicitudes_baneo
    SET estado     = p_nuevo_estado,
        updated_at = NOW()
    WHERE id = p_solicitud_id;

    SELECT * FROM estados_baneo WHERE id = v_nuevo_id;
END
");

echo "Procedimiento cambiar_estado_baneo creado.\n";
echo "Todo ejecutado con éxito.\n";