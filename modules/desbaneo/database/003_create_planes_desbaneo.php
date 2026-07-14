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
// Tabla: planes_desbaneo
// ============================================================

$pdo->exec("
CREATE TABLE IF NOT EXISTS planes_desbaneo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código interno (pro, premium, etc)',
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    categoria ENUM('personal','business','enterprise') DEFAULT 'personal',
    precio DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    precio_final DECIMAL(10,2) GENERATED ALWAYS AS (precio * (1 - descuento_porcentaje/100)) STORED,
    descripcion_corta VARCHAR(255) NULL,
    descripcion_larga TEXT NULL,
    tiempo_respuesta_horas INT NOT NULL COMMENT 'Horas máximas para primera respuesta',
    tiempo_estimado_recuperacion_min INT NULL,
    tiempo_estimado_recuperacion_max INT NULL,
    numeros_incluidos INT DEFAULT 1,
    reintentos_incluidos INT DEFAULT 1,
    tipo_soporte ENUM('email','whatsapp','telefono','dedicado') DEFAULT 'email',
    frecuencia_actualizacion ENUM('diaria','6h','3h','1h','realtime') DEFAULT 'diaria',
    garantia_devolucion BOOLEAN DEFAULT TRUE,
    tiempo_reembolso_horas INT DEFAULT 48,
    diagnostico_gratuito BOOLEAN DEFAULT TRUE,
    dashboard_acceso BOOLEAN DEFAULT FALSE,
    api_acceso BOOLEAN DEFAULT FALSE,
    facturacion_empresarial BOOLEAN DEFAULT FALSE,
    asesor_dedicado BOOLEAN DEFAULT FALSE,
    sla_garantizado BOOLEAN DEFAULT FALSE,
    sla_porcentaje DECIMAL(5,2) NULL,
    es_popular BOOLEAN DEFAULT FALSE,
    es_exclusivo BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    features_json JSON NULL COMMENT 'Características en formato JSON',
    bonus_json JSON NULL COMMENT 'Bonus incluidos',
    meta_title VARCHAR(255) NULL,
    meta_description VARCHAR(500) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_codigo (codigo),
    INDEX idx_slug (slug),
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo),
    INDEX idx_precio (precio),
    INDEX idx_orden (orden)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Planes y precios de desbaneo'
");

echo "Tabla planes_desbaneo creada correctamente.\n";

// ============================================================
// Tabla: plan_features
// ============================================================

$pdo->exec("
CREATE TABLE IF NOT EXISTS plan_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    categoria VARCHAR(50) NULL,
    incluido BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 0,

    FOREIGN KEY (plan_id) REFERENCES planes_desbaneo(id) ON DELETE CASCADE,
    INDEX idx_plan (plan_id),
    INDEX idx_categoria (categoria)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

echo "Tabla plan_features creada correctamente.\n";

// ============================================================
// Vista: Planes con estadísticas
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_planes_stats");

$pdo->exec("
CREATE VIEW vw_planes_stats AS
SELECT
    p.id,
    p.codigo,
    p.nombre,
    p.precio,
    p.precio_final,
    p.categoria,
    p.es_popular,
    COUNT(s.id) AS total_ventas,
    SUM(CASE WHEN s.estado_pago = 'pagado' THEN s.precio_pagado ELSE 0 END) AS ingresos_totales,
    ROUND(AVG(s.tiempo_total_horas), 2) AS tiempo_promedio_recuperacion,
    COUNT(CASE WHEN s.resultado = 'exitoso' THEN 1 END) AS casos_exitosos,
    ROUND(
        COUNT(CASE WHEN s.resultado = 'exitoso' THEN 1 END) * 100.0 / NULLIF(COUNT(s.id), 0),
        2
    ) AS tasa_exito_porcentaje
FROM planes_desbaneo p
LEFT JOIN solicitudes_desbaneo s ON p.id = s.plan_id AND s.deleted_at IS NULL
WHERE p.activo = TRUE
GROUP BY p.id
ORDER BY p.orden
");

echo "Vista vw_planes_stats creada correctamente.\n";
echo "Todo ejecutado con éxito.\n";