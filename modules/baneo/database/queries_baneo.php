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
// Clase con todas las queries del módulo Baneo
// Equivale a los archivos .model.js de Supabase.
// $1, $2... de PostgreSQL se reemplazan por ? en PDO MySQL.
// JSON_AGG + JSON_BUILD_OBJECT se reemplazan por JSON_ARRAYAGG
// + JSON_OBJECT. FILTER (WHERE ...) no existe en MySQL,
// se reemplaza por SUM(CASE WHEN ... THEN 1 ELSE 0 END).
// EXTRACT(EPOCH ...) se reemplaza por TIMESTAMPDIFF.
// DATE_TRUNC se reemplaza por DATE() y DATE_FORMAT().
// ILIKE se reemplaza por LIKE (MySQL no distingue mayúsculas).
// ============================================================

class BaneoModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ============================================================
    // [Q-BAN-01] Insertar nueva solicitud
    // ============================================================
    public function insertarSolicitud(
        string $numero,
        string $prefijo_pais,
        string $motivo,
        ?string $otro_motivo,
        string $descripcion,
        string $plan,
        string $nombre,
        string $email,
        ?string $whatsapp_contacto,
        string $pref_contacto,
        bool $acepta_aviso,
        ?string $payment_intent_id,
        ?string $ip_origen
    ): array {
        $stmt = $this->pdo->prepare("
            INSERT INTO solicitudes_baneo
                (numero, prefijo_pais, motivo, otro_motivo, descripcion, plan,
                 nombre, email, whatsapp_contacto, pref_contacto, acepta_aviso,
                 payment_intent_id, ip_origen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $numero, $prefijo_pais, $motivo, $otro_motivo, $descripcion, $plan,
            $nombre, $email, $whatsapp_contacto, $pref_contacto,
            (int) $acepta_aviso, $payment_intent_id, $ip_origen
        ]);

        $id = $this->pdo->lastInsertId();

        // MySQL no soporta RETURNING, se hace un SELECT posterior
        $stmt2 = $this->pdo->prepare("
            SELECT id, caso_numero, created_at
            FROM solicitudes_baneo
            WHERE id = ?
        ");
        $stmt2->execute([$id]);

        return $stmt2->fetch(PDO::FETCH_ASSOC);
    }

    // ============================================================
    // [Q-BAN-02] Obtener solicitud por ID con timeline
    // JSON_AGG + JSON_BUILD_OBJECT -> JSON_ARRAYAGG + JSON_OBJECT
    // ============================================================
    public function obtenerSolicitudConTimeline(string $id): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                s.*,
                IFNULL(
                    JSON_ARRAYAGG(
                        CASE WHEN e.id IS NOT NULL THEN
                            JSON_OBJECT(
                                'estado',     e.estado,
                                'nota',       e.nota,
                                'es_publico', e.es_publico,
                                'creado_por', e.creado_por,
                                'created_at', e.created_at
                            )
                        ELSE NULL END
                        ORDER BY e.created_at ASC
                    ),
                    JSON_ARRAY()
                ) AS timeline
            FROM solicitudes_baneo s
            LEFT JOIN estados_baneo e
                ON e.solicitud_id = s.id AND e.es_publico = TRUE
            WHERE s.id = ?
            GROUP BY s.id
        ");

        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return null;

        $row['timeline'] = json_decode($row['timeline'], true) ?? [];

        return $row;
    }

    // ============================================================
    // [Q-BAN-03] Obtener solicitudes por email
    // ============================================================
    public function obtenerPorEmail(string $email): array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, caso_numero, numero, plan, motivo, estado, created_at
            FROM solicitudes_baneo
            WHERE LOWER(email) = LOWER(?)
            ORDER BY created_at DESC
            LIMIT 20
        ");

        $stmt->execute([$email]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ============================================================
    // [Q-BAN-04] Obtener solicitud por payment_intent_id
    // ============================================================
    public function obtenerPorPaymentIntent(string $payment_intent_id): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, caso_numero, email, plan, estado, monto_pagado
            FROM solicitudes_baneo
            WHERE payment_intent_id = ?
        ");

        $stmt->execute([$payment_intent_id]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // ============================================================
    // [Q-BAN-05] Actualizar pago completado tras webhook Stripe
    // RETURNING no existe en MySQL, se hace SELECT posterior.
    // ============================================================
    public function confirmarPago(string $payment_intent_id, float $monto): ?array
    {
        $stmt = $this->pdo->prepare("
            UPDATE solicitudes_baneo
            SET
                pago_completado = TRUE,
                monto_pagado    = ?,
                estado          = 'en_revision',
                updated_at      = NOW()
            WHERE payment_intent_id = ?
        ");

        $stmt->execute([$monto, $payment_intent_id]);

        $stmt2 = $this->pdo->prepare("
            SELECT id, caso_numero, email, nombre, plan
            FROM solicitudes_baneo
            WHERE payment_intent_id = ?
        ");

        $stmt2->execute([$payment_intent_id]);

        return $stmt2->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // ============================================================
    // [Q-BAN-06] Cambiar estado (llama al procedimiento)
    // SELECT function() de PostgreSQL -> CALL procedure() en MySQL
    // ============================================================
    public function cambiarEstado(
        string $solicitud_id,
        string $nuevo_estado,
        ?string $nota = null,
        bool $es_publico = true,
        string $creado_por = 'sistema'
    ): ?array {
        $stmt = $this->pdo->prepare("
            CALL cambiar_estado_baneo(?, ?, ?, ?, ?)
        ");

        $stmt->execute([$solicitud_id, $nuevo_estado, $nota, (int) $es_publico, $creado_por]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // ============================================================
    // [Q-BAN-07] Solicitudes pendientes de revisión (panel admin)
    // EXTRACT(EPOCH FROM ...) / 3600 -> TIMESTAMPDIFF(HOUR, ...)
    // ============================================================
    public function solicitudesPendientes(): array
    {
        $stmt = $this->pdo->query("
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
                s.created_at,
                TIMESTAMPDIFF(HOUR, s.created_at, NOW()) AS horas_activo
            FROM solicitudes_baneo s
            WHERE s.estado IN ('en_revision', 'reporte_enviado', 'esperando_meta')
              AND s.pago_completado = TRUE
            ORDER BY s.created_at ASC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ============================================================
    // [Q-BAN-08] Estadísticas generales (panel admin)
    // FILTER (WHERE ...) -> SUM(CASE WHEN ... THEN 1 ELSE 0 END)
    // INTERVAL -> NOW() - INTERVAL en MySQL es igual.
    // DATE_TRUNC('month') -> DATE_FORMAT(NOW(), '%Y-%m-01')
    // ============================================================
    public function estadisticasGenerales(): array
    {
        $stmt = $this->pdo->query("
            SELECT
                COUNT(*)                                                    AS total_solicitudes,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END)     AS completadas,
                SUM(CASE WHEN estado = 'fallido' THEN 1 ELSE 0 END)        AS fallidas,
                SUM(CASE WHEN estado IN ('en_revision','reporte_enviado','esperando_meta')
                         THEN 1 ELSE 0 END)                                AS en_proceso,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL 24 HOUR
                         THEN 1 ELSE 0 END)                                AS ultimas_24h,
                ROUND(
                    SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(
                        SUM(CASE WHEN estado IN ('completado','fallido') THEN 1 ELSE 0 END),
                        0
                    ), 1
                )                                                           AS tasa_exito_pct,
                SUM(CASE WHEN pago_completado = TRUE THEN monto_pagado ELSE 0 END)
                                                                            AS ingresos_total,
                SUM(CASE WHEN pago_completado = TRUE
                         AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
                         THEN monto_pagado ELSE 0 END)                     AS ingresos_mes_actual
            FROM solicitudes_baneo
        ");

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ============================================================
    // [Q-BAN-09] Distribución por motivo
    // ============================================================
    public function distribucionPorMotivo(): array
    {
        $stmt = $this->pdo->query("
            SELECT
                motivo,
                COUNT(*)                        AS total,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) AS completados,
                ROUND(AVG(monto_pagado), 2)     AS ticket_promedio
            FROM solicitudes_baneo
            WHERE pago_completado = TRUE
            GROUP BY motivo
            ORDER BY total DESC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ============================================================
    // [Q-BAN-10] Solicitudes con garantía pendientes de devolución
    // ILIKE -> LIKE (MySQL no distingue mayúsculas por defecto)
    // ============================================================
    public function garantiasPendientes(): array
    {
        $stmt = $this->pdo->query("
            SELECT
                s.id,
                s.caso_numero,
                s.nombre,
                s.email,
                s.plan,
                s.monto_pagado,
                s.created_at,
                TIMESTAMPDIFF(HOUR, s.created_at, NOW()) AS horas_desde_inicio
            FROM solicitudes_baneo s
            WHERE s.estado = 'fallido'
              AND s.plan IN ('pro', 'enterprise', 'business-pro')
              AND s.pago_completado = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM estados_baneo e
                  WHERE e.solicitud_id = s.id
                    AND e.estado = 'cancelado'
                    AND e.nota LIKE '%devolucion%'
              )
            ORDER BY s.created_at ASC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ============================================================
    // [Q-BAN-11] Planes activos por tipo
    // ============================================================
    public function planesActivosPorTipo(string $tipo): array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                id, slug, nombre, precio_usd, descripcion,
                tiempo_respuesta, numeros_incluidos,
                incluye_garantia, es_popular, badge_texto,
                features, no_incluye
            FROM planes_baneo
            WHERE activo = TRUE AND tipo = ?
            ORDER BY orden ASC
        ");

        $stmt->execute([$tipo]);
        $planes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($planes as &$plan) {
            $plan['features']   = json_decode($plan['features'], true) ?? [];
            $plan['no_incluye'] = json_decode($plan['no_incluye'], true) ?? [];
        }

        return $planes;
    }

    // ============================================================
    // [Q-BAN-12] Obtener plan por slug
    // ============================================================
    public function planPorSlug(string $slug): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT * FROM planes_baneo
            WHERE slug = ? AND activo = TRUE
        ");

        $stmt->execute([$slug]);
        $plan = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$plan) return null;

        $plan['features']   = json_decode($plan['features'], true) ?? [];
        $plan['no_incluye'] = json_decode($plan['no_incluye'], true) ?? [];

        return $plan;
    }

    // ============================================================
    // [Q-BAN-13] Solicitudes por día (últimos 30 días)
    // DATE_TRUNC('day') -> DATE()
    // ============================================================
    public function solicitudesPorDia(): array
    {
        $stmt = $this->pdo->query("
            SELECT
                DATE(created_at)    AS fecha,
                COUNT(*)            AS total,
                SUM(monto_pagado)   AS ingresos
            FROM solicitudes_baneo
            WHERE created_at >= NOW() - INTERVAL 30 DAY
              AND pago_completado = TRUE
            GROUP BY DATE(created_at)
            ORDER BY fecha ASC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ============================================================
    // [Q-BAN-14] Top motivos del último mes
    // SUM(COUNT(*)) OVER () -> variable calculada en PHP.
    // Las window functions existen en MySQL 8+, pero XAMPP
    // usa versiones anteriores. Se calcula el porcentaje en PHP.
    // ============================================================
    public function topMotivosMes(): array
    {
        $stmt = $this->pdo->query("
            SELECT
                motivo,
                COUNT(*) AS total
            FROM solicitudes_baneo
            WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
            GROUP BY motivo
            ORDER BY total DESC
        ");

        $rows  = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $total = array_sum(array_column($rows, 'total'));

        foreach ($rows as &$row) {
            $row['porcentaje'] = $total > 0
                ? round($row['total'] * 100.0 / $total, 1)
                : 0;
        }

        return $rows;
    }
}

