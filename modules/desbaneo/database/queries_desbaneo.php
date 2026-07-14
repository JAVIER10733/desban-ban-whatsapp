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
// Vista: Solicitudes completas
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_solicitudes_completas");

$pdo->exec("
CREATE VIEW vw_solicitudes_completas AS
SELECT
    s.id,
    s.reference_code,
    s.nombre_completo,
    s.email,
    s.numero_whatsapp,
    s.tipo_baneo,
    s.dias_baneado,
    s.mensaje_error,
    p.codigo AS plan_codigo,
    p.nombre AS plan_nombre,
    p.categoria AS plan_categoria,
    s.precio_pagado,
    s.descuento_aplicado,
    e.nombre AS estado_nombre,
    e.slug AS estado_slug,
    e.color AS estado_color,
    e.icono AS estado_icono,
    s.fecha_solicitud,
    s.fecha_inicio_trabajo,
    s.fecha_estimada_fin,
    s.fecha_completado,
    s.tiempo_respuesta_horas,
    s.tiempo_total_horas,
    s.resultado,
    s.fecha_recuperacion,
    s.metodo_pago,
    s.estado_pago,
    s.fecha_pago,
    s.reintentos_usados,
    s.reintentos_maximos,
    s.notas_cliente,
    s.created_at,
    s.updated_at
FROM solicitudes_desbaneo s
INNER JOIN planes_desbaneo p ON s.plan_id = p.id
INNER JOIN estados_desbaneo e ON s.estado_id = e.id
WHERE s.deleted_at IS NULL
");

echo "Vista vw_solicitudes_completas creada.\n";

// ============================================================
// Vista: Dashboard stats
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_dashboard_stats");

$pdo->exec("
CREATE VIEW vw_dashboard_stats AS
SELECT
    COUNT(*) AS total_solicitudes,
    COUNT(DISTINCT cliente_id) AS total_clientes,
    COUNT(DISTINCT numero_whatsapp) AS total_numeros_unicos,
    COUNT(CASE WHEN estado_id = 1 THEN 1 END) AS pendientes_pago,
    COUNT(CASE WHEN estado_id = 3 THEN 1 END) AS en_proceso,
    COUNT(CASE WHEN resultado = 'exitoso' THEN 1 END) AS completados_exitosos,
    COUNT(CASE WHEN resultado = 'fallido' THEN 1 END) AS completados_fallidos,
    COUNT(CASE WHEN resultado = 'reembolsado' THEN 1 END) AS reembolsados,
    SUM(CASE WHEN estado_pago = 'pagado' THEN precio_pagado ELSE 0 END) AS ingresos_totales,
    SUM(CASE WHEN estado_pago = 'reembolsado' THEN precio_pagado ELSE 0 END) AS reembolsos_totales,
    AVG(precio_pagado) AS ticket_promedio,
    ROUND(AVG(tiempo_total_horas), 2) AS tiempo_promedio_horas,
    ROUND(AVG(tiempo_respuesta_horas), 2) AS tiempo_promedio_respuesta,
    ROUND(
        COUNT(CASE WHEN resultado = 'exitoso' THEN 1 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN resultado IN ('exitoso','fallido') THEN 1 END), 0),
        2
    ) AS tasa_exito_porcentaje,
    MIN(fecha_solicitud) AS primera_solicitud,
    MAX(fecha_solicitud) AS ultima_solicitud
FROM solicitudes_desbaneo
WHERE deleted_at IS NULL
");

echo "Vista vw_dashboard_stats creada.\n";

// ============================================================
// Vista: Solicitudes por tipo de baneo
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_solicitudes_por_tipo_baneo");

$pdo->exec("
CREATE VIEW vw_solicitudes_por_tipo_baneo AS
SELECT
    tipo_baneo,
    COUNT(*) AS total,
    COUNT(CASE WHEN resultado = 'exitoso' THEN 1 END) AS exitosos,
    COUNT(CASE WHEN resultado = 'fallido' THEN 1 END) AS fallidos,
    ROUND(COUNT(CASE WHEN resultado = 'exitoso' THEN 1 END) * 100.0 / COUNT(*), 2) AS tasa_exito,
    ROUND(AVG(tiempo_total_horas), 2) AS tiempo_promedio_horas,
    ROUND(AVG(precio_pagado), 2) AS precio_promedio,
    SUM(CASE WHEN estado_pago = 'pagado' THEN precio_pagado ELSE 0 END) AS ingresos_totales
FROM solicitudes_desbaneo
WHERE deleted_at IS NULL
GROUP BY tipo_baneo
ORDER BY total DESC
");

echo "Vista vw_solicitudes_por_tipo_baneo creada.\n";

// ============================================================
// Vista: Rendimiento por plan
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_rendimiento_por_plan");

$pdo->exec("
CREATE VIEW vw_rendimiento_por_plan AS
SELECT
    p.id,
    p.codigo,
    p.nombre,
    p.precio,
    p.categoria,
    COUNT(s.id) AS total_ventas,
    COUNT(DISTINCT s.cliente_id) AS clientes_unicos,
    SUM(CASE WHEN s.estado_pago = 'pagado' THEN s.precio_pagado ELSE 0 END) AS ingresos_totales,
    AVG(s.precio_pagado) AS precio_promedio_pagado,
    COUNT(CASE WHEN s.resultado = 'exitoso' THEN 1 END) AS casos_exitosos,
    COUNT(CASE WHEN s.resultado = 'fallido' THEN 1 END) AS casos_fallidos,
    COUNT(CASE WHEN s.resultado = 'reembolsado' THEN 1 END) AS casos_reembolsados,
    ROUND(
        COUNT(CASE WHEN s.resultado = 'exitoso' THEN 1 END) * 100.0 /
        NULLIF(COUNT(s.id), 0),
        2
    ) AS tasa_exito_porcentaje,
    ROUND(AVG(s.tiempo_total_horas), 2) AS tiempo_promedio_recuperacion,
    MIN(s.tiempo_total_horas) AS tiempo_minimo,
    MAX(s.tiempo_total_horas) AS tiempo_maximo,
    ROUND(AVG(s.reintentos_usados), 2) AS reintentos_promedio,
    MIN(s.fecha_solicitud) AS primera_venta,
    MAX(s.fecha_solicitud) AS ultima_venta
FROM planes_desbaneo p
LEFT JOIN solicitudes_desbaneo s ON p.id = s.plan_id AND s.deleted_at IS NULL
WHERE p.activo = TRUE
GROUP BY p.id
ORDER BY p.orden
");

echo "Vista vw_rendimiento_por_plan creada.\n";

// ============================================================
// Vista: Solicitudes prioritarias
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_solicitudes_prioritarias");

$pdo->exec("
CREATE VIEW vw_solicitudes_prioritarias AS
SELECT
    s.id,
    s.reference_code,
    s.nombre_completo,
    s.email,
    s.numero_whatsapp,
    s.tipo_baneo,
    s.dias_baneado,
    p.nombre AS plan_nombre,
    p.tiempo_respuesta_horas AS sla_respuesta,
    e.nombre AS estado_nombre,
    e.color AS estado_color,
    s.fecha_solicitud,
    s.fecha_inicio_trabajo,
    TIMESTAMPDIFF(HOUR, s.fecha_solicitud, NOW()) AS horas_transcurridas,
    CASE
        WHEN TIMESTAMPDIFF(HOUR, s.fecha_solicitud, NOW()) > p.tiempo_respuesta_horas THEN 'OVERDUE'
        WHEN TIMESTAMPDIFF(HOUR, s.fecha_solicitud, NOW()) > (p.tiempo_respuesta_horas * 0.8) THEN 'WARNING'
        ELSE 'OK'
    END AS sla_status,
    CASE
        WHEN s.tipo_baneo = 'permanente' THEN 1
        WHEN s.tipo_baneo = 'spam' THEN 2
        WHEN s.dias_baneado > 7 THEN 2
        WHEN p.categoria = 'enterprise' THEN 2
        WHEN p.categoria = 'business' THEN 3
        ELSE 4
    END AS prioridad_calculada
FROM solicitudes_desbaneo s
INNER JOIN planes_desbaneo p ON s.plan_id = p.id
INNER JOIN estados_desbaneo e ON s.estado_id = e.id
WHERE s.deleted_at IS NULL
AND s.estado_id NOT IN (8, 9, 10, 11)
ORDER BY prioridad_calculada ASC, horas_transcurridas DESC
");

echo "Vista vw_solicitudes_prioritarias creada.\n";

// ============================================================
// Vista: Clientes frecuentes
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_clientes_frecuentes");

$pdo->exec("
CREATE VIEW vw_clientes_frecuentes AS
SELECT
    cliente_id,
    nombre_completo,
    email,
    COUNT(*) AS total_solicitudes,
    COUNT(DISTINCT numero_whatsapp) AS numeros_diferentes,
    SUM(CASE WHEN estado_pago = 'pagado' THEN precio_pagado ELSE 0 END) AS total_gastado,
    AVG(precio_pagado) AS ticket_promedio,
    COUNT(CASE WHEN resultado = 'exitoso' THEN 1 END) AS casos_exitosos,
    MIN(fecha_solicitud) AS primera_solicitud,
    MAX(fecha_solicitud) AS ultima_solicitud,
    ROUND(COUNT(CASE WHEN resultado = 'exitoso' THEN 1 END) * 100.0 / COUNT(*), 2) AS tasa_exito_personal
FROM solicitudes_desbaneo
WHERE cliente_id IS NOT NULL AND deleted_at IS NULL
GROUP BY cliente_id
HAVING COUNT(*) > 1
ORDER BY total_solicitudes DESC, total_gastado DESC
");

echo "Vista vw_clientes_frecuentes creada.\n";

// ============================================================
// Vista: Ingresos por período
// ============================================================

$pdo->exec("DROP VIEW IF EXISTS vw_ingresos_por_periodo");

$pdo->exec("
CREATE VIEW vw_ingresos_por_periodo AS
SELECT
    DATE_FORMAT(fecha_pago, '%Y-%m') AS mes,
    DATE_FORMAT(fecha_pago, '%Y-%u') AS semana,
    DATE(fecha_pago) AS dia,
    COUNT(*) AS total_transacciones,
    COUNT(DISTINCT cliente_id) AS clientes_unicos,
    SUM(precio_pagado) AS ingresos_brutos,
    AVG(precio_pagado) AS ticket_promedio,
    COUNT(CASE WHEN plan_id = (SELECT id FROM planes_desbaneo WHERE codigo = 'pro') THEN 1 END) AS ventas_pro,
    COUNT(CASE WHEN plan_id = (SELECT id FROM planes_desbaneo WHERE codigo = 'premium') THEN 1 END) AS ventas_premium,
    COUNT(CASE WHEN plan_id = (SELECT id FROM planes_desbaneo WHERE codigo = 'business-pro') THEN 1 END) AS ventas_business,
    COUNT(CASE WHEN plan_id = (SELECT id FROM planes_desbaneo WHERE codigo = 'enterprise') THEN 1 END) AS ventas_enterprise
FROM solicitudes_desbaneo
WHERE estado_pago = 'pagado' AND deleted_at IS NULL
GROUP BY DATE(fecha_pago), DATE_FORMAT(fecha_pago, '%Y-%u'), DATE_FORMAT(fecha_pago, '%Y-%m')
ORDER BY fecha_pago DESC
");

echo "Vista vw_ingresos_por_periodo creada.\n";

// ============================================================
// Procedimiento: Actualizar estado de solicitud
// ============================================================

$pdo->exec("DROP PROCEDURE IF EXISTS sp_actualizar_estado_solicitud");

$pdo->exec("
CREATE PROCEDURE sp_actualizar_estado_solicitud(
    IN p_solicitud_id INT,
    IN p_nuevo_estado_id INT,
    IN p_notas TEXT
)
BEGIN
    DECLARE v_estado_anterior INT;
    DECLARE v_reference_code VARCHAR(20);

    SELECT estado_id, reference_code
    INTO v_estado_anterior, v_reference_code
    FROM solicitudes_desbaneo
    WHERE id = p_solicitud_id;

    UPDATE solicitudes_desbaneo
    SET
        estado_id = p_nuevo_estado_id,
        notas_internas = CONCAT(
            COALESCE(notas_internas, ''),
            '\n[', NOW(), '] Estado cambiado a ID ', p_nuevo_estado_id,
            '. Notas: ', COALESCE(p_notas, '')
        ),
        updated_at = NOW()
    WHERE id = p_solicitud_id;

    SELECT
        p_solicitud_id AS id,
        v_reference_code AS reference_code,
        v_estado_anterior AS estado_anterior,
        p_nuevo_estado_id AS nuevo_estado;
END
");

echo "Procedimiento sp_actualizar_estado_solicitud creado.\n";

// ============================================================
// Procedimiento: Aplicar reembolso
// ============================================================

$pdo->exec("DROP PROCEDURE IF EXISTS sp_aplicar_reembolso");

$pdo->exec("
CREATE PROCEDURE sp_aplicar_reembolso(
    IN p_solicitud_id INT,
    IN p_motivo TEXT
)
BEGIN
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_estado_pago VARCHAR(20);
    DECLARE v_reference_code VARCHAR(20);

    SELECT precio_pagado, estado_pago, reference_code
    INTO v_precio, v_estado_pago, v_reference_code
    FROM solicitudes_desbaneo
    WHERE id = p_solicitud_id;

    IF v_estado_pago != 'pagado' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La solicitud no está pagada, no se puede reembolsar';
    END IF;

    UPDATE solicitudes_desbaneo
    SET
        estado_id = (SELECT id FROM estados_desbaneo WHERE slug = 'reembolsado'),
        resultado = 'reembolsado',
        estado_pago = 'reembolsado',
        fecha_reembolso = NOW(),
        notas_internas = CONCAT(
            COALESCE(notas_internas, ''),
            '\n[', NOW(), '] REEMBOLSO APLICADO. Motivo: ', COALESCE(p_motivo, 'N/A')
        ),
        updated_at = NOW()
    WHERE id = p_solicitud_id;

    SELECT
        v_reference_code AS reference_code,
        v_precio AS monto_reembolso,
        NOW() AS fecha_reembolso;
END
");

echo "Procedimiento sp_aplicar_reembolso creado.\n";

// ============================================================
// Índices adicionales
// ============================================================

$indices = [
    "CREATE INDEX idx_solicitudes_estado_fecha ON solicitudes_desbaneo(estado_id, fecha_solicitud)",
    "CREATE INDEX idx_solicitudes_cliente_fecha ON solicitudes_desbaneo(cliente_id, fecha_solicitud)",
    "CREATE INDEX idx_solicitudes_plan_resultado ON solicitudes_desbaneo(plan_id, resultado)",
    "CREATE INDEX idx_solicitudes_pago_estado ON solicitudes_desbaneo(estado_pago, fecha_pago)",
];

foreach ($indices as $sql) {
    try {
        $pdo->exec($sql);
        echo "Índice creado correctamente.\n";
    } catch (PDOException $e) {
        // Si el índice ya existe, lo omite sin detener la ejecución
        echo "Índice ya existe, se omite: " . $e->getMessage() . "\n";
    }
}

// Full-text index
try {
    $pdo->exec("
        CREATE FULLTEXT INDEX ft_solicitudes_busqueda
        ON solicitudes_desbaneo(numero_whatsapp, email, nombre_completo, mensaje_error)
    ");
    echo "Índice FULLTEXT creado correctamente.\n";
} catch (PDOException $e) {
    echo "Índice FULLTEXT ya existe, se omite.\n";
}

echo "Todo ejecutado con éxito.\n";