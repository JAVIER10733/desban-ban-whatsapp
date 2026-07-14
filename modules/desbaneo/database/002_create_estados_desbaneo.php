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
// Tabla: estados_desbaneo
// ============================================================

$pdo->exec("
CREATE TABLE IF NOT EXISTS estados_desbaneo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    color VARCHAR(7) DEFAULT '#777777' COMMENT 'Hex color',
    icono VARCHAR(50) NULL COMMENT 'Icono o emoji',
    orden INT DEFAULT 0,
    es_final BOOLEAN DEFAULT FALSE COMMENT '¿Es un estado final?',
    es_exitoso BOOLEAN DEFAULT FALSE COMMENT '¿Es un estado exitoso?',
    requiere_accion BOOLEAN DEFAULT FALSE COMMENT '¿Requiere acción del cliente?',
    notificar_cliente BOOLEAN DEFAULT FALSE,
    notificar_equipo BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_slug (slug),
    INDEX idx_orden (orden)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Estados del flujo de desbaneo'
");

echo "Tabla estados_desbaneo creada correctamente.\n";

// ============================================================
// Insertar estados iniciales
// ============================================================

$estados = [
    ['Pendiente de Pago',       'pendiente-pago',          'Solicitud creada, esperando pago',                    '#EF9F27', '⏳', 1,  false, false, true,  false, true],
    ['Pagado - En Cola',        'pagado-cola',             'Pago confirmado, en cola de espera',                  '#3498DB', '📋', 2,  false, false, false, true,  true],
    ['En Proceso',              'en-proceso',              'Especialista trabajando en el caso',                  '#25D366', '⚡', 3,  false, false, false, true,  false],
    ['Esperando Información',   'esperando-info',          'Requiere información adicional del cliente',          '#9B59B6', '💬', 4,  false, false, true,  true,  false],
    ['Apelación Enviada',       'apelacion-enviada',       'Apelación enviada a WhatsApp/Meta',                   '#1ABC9C', '📤', 5,  false, false, false, true,  false],
    ['En Revisión',             'en-revision',             'WhatsApp revisando la apelación',                    '#F39C12', '🔍', 6,  false, false, false, false, false],
    ['Reintento Requerido',     'reintento-requerido',     'Se requiere intento adicional',                       '#E67E22', '🔄', 7,  false, false, false, true,  true],
    ['Completado - Exitoso',    'completado-exitoso',      'Número recuperado exitosamente',                      '#25D366', '✅', 8,  true,  true,  false, true,  false],
    ['Fallido - No Recuperable','fallido-no-recuperable',  'No fue posible recuperar el número',                 '#E24B4A', '❌', 9,  true,  false, false, true,  true],
    ['Reembolsado',             'reembolsado',             'Se aplicó garantía de reembolso',                    '#95A5A6', '💰', 10, true,  false, false, true,  true],
    ['Cancelado',               'cancelado',               'Solicitud cancelada por el cliente',                 '#7F8C8D', '🚫', 11, true,  false, false, false, true],
];

$sql = "INSERT IGNORE INTO estados_desbaneo 
    (nombre, slug, descripcion, color, icono, orden, es_final, es_exitoso, requiere_accion, notificar_cliente, notificar_equipo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $pdo->prepare($sql);

foreach ($estados as $estado) {
    $stmt->execute($estado);
}

echo "Estados iniciales insertados correctamente.\n";

// ============================================================
// Vista: Resumen de estados
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_resumen_estados");

$pdo->exec("
CREATE VIEW vw_resumen_estados AS
SELECT
    e.id,
    e.nombre,
    e.slug,
    e.color,
    e.icono,
    COUNT(s.id) AS total_solicitudes,
    COUNT(CASE WHEN s.resultado = 'exitoso' THEN 1 END) AS exitosos,
    COUNT(CASE WHEN s.resultado = 'fallido' THEN 1 END) AS fallidos,
    ROUND(AVG(s.tiempo_total_horas), 2) AS tiempo_promedio_horas
FROM estados_desbaneo e
LEFT JOIN solicitudes_desbaneo s ON e.id = s.estado_id AND s.deleted_at IS NULL
GROUP BY e.id
ORDER BY e.orden
");

echo "Vista vw_resumen_estados creada correctamente.\n";
echo "Todo ejecutado con éxito.\n";