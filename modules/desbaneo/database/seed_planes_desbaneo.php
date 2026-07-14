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
// Seed: Planes de Desbaneo
// ============================================================

$planes = [
    [
        'codigo'                          => 'pro',
        'nombre'                          => 'Pro',
        'slug'                            => 'plan-pro',
        'categoria'                       => 'personal',
        'precio'                          => 39.00,
        'descuento_porcentaje'            => 0.00,
        'descripcion_corta'               => 'Ideal para recuperaciones estándar con garantía completa.',
        'descripcion_larga'               => 'Plan diseñado para usuarios individuales que necesitan recuperar su número de WhatsApp de forma rápida y segura. Incluye garantía de devolución del 100% si no logramos recuperar tu número en el plazo acordado.',
        'tiempo_respuesta_horas'          => 24,
        'tiempo_estimado_recuperacion_min' => 24,
        'tiempo_estimado_recuperacion_max' => 48,
        'numeros_incluidos'               => 1,
        'reintentos_incluidos'            => 1,
        'tipo_soporte'                    => 'email',
        'frecuencia_actualizacion'        => 'diaria',
        'garantia_devolucion'             => true,
        'tiempo_reembolso_horas'          => 48,
        'dashboard_acceso'                => true,
        'api_acceso'                      => false,
        'asesor_dedicado'                 => false,
        'es_popular'                      => false,
        'es_exclusivo'                    => false,
        'activo'                          => true,
        'orden'                           => 1,
        'features_json' => json_encode([
            ['nombre' => 'Garantía de devolución 100%', 'incluido' => true, 'destacado' => true],
            ['nombre' => 'Respuesta en 24 horas',       'incluido' => true, 'destacado' => false],
            ['nombre' => '1 número de WhatsApp',        'incluido' => true, 'destacado' => false],
            ['nombre' => 'Especialista dedicado',       'incluido' => true, 'destacado' => false],
            ['nombre' => 'Diagnóstico gratuito',        'incluido' => true, 'destacado' => true],
            ['nombre' => 'Soporte por email',           'incluido' => true, 'destacado' => false],
            ['nombre' => 'Actualizaciones diarias',     'incluido' => true, 'destacado' => false],
            ['nombre' => '1 reintento incluido',        'incluido' => true, 'destacado' => false],
            ['nombre' => 'Documentación básica',        'incluido' => true, 'destacado' => false],
            ['nombre' => 'Reporte final PDF',           'incluido' => true, 'destacado' => false],
            ['nombre' => 'Dashboard básico',            'incluido' => true, 'destacado' => false],
        ]),
        'bonus_json' => json_encode([
            ['icono' => '📄', 'texto' => 'Reporte final detallado'],
        ]),
    ],
    [
        'codigo'                          => 'premium',
        'nombre'                          => 'Premium',
        'slug'                            => 'plan-premium',
        'categoria'                       => 'personal',
        'precio'                          => 59.00,
        'descuento_porcentaje'            => 0.00,
        'descripcion_corta'               => 'Recuperación prioritaria con todas las ventajas y garantía express.',
        'descripcion_larga'               => 'Nuestro plan más popular. Perfecto para quienes necesitan una recuperación rápida con soporte prioritario 24/7. Incluye 3 reintentos y garantía express de 24 horas.',
        'tiempo_respuesta_horas'          => 12,
        'tiempo_estimado_recuperacion_min' => 12,
        'tiempo_estimado_recuperacion_max' => 24,
        'numeros_incluidos'               => 1,
        'reintentos_incluidos'            => 3,
        'tipo_soporte'                    => 'whatsapp',
        'frecuencia_actualizacion'        => '6h',
        'garantia_devolucion'             => true,
        'tiempo_reembolso_horas'          => 24,
        'dashboard_acceso'                => true,
        'api_acceso'                      => false,
        'asesor_dedicado'                 => false,
        'es_popular'                      => true,
        'es_exclusivo'                    => false,
        'activo'                          => true,
        'orden'                           => 2,
        'features_json' => json_encode([
            ['nombre' => 'Garantía de devolución 100%', 'incluido' => true, 'destacado' => true],
            ['nombre' => 'Respuesta en 12 horas',       'incluido' => true, 'destacado' => true],
            ['nombre' => 'Prioridad express',           'incluido' => true, 'destacado' => true],
            ['nombre' => '1 número de WhatsApp',        'incluido' => true, 'destacado' => false],
            ['nombre' => 'Diagnóstico prioritario',     'incluido' => true, 'destacado' => false],
            ['nombre' => 'Soporte prioritario 24/7',    'incluido' => true, 'destacado' => true],
            ['nombre' => 'Actualizaciones cada 6h',     'incluido' => true, 'destacado' => false],
            ['nombre' => '3 reintentos incluidos',      'incluido' => true, 'destacado' => true],
            ['nombre' => 'Reembolso en 24h',            'incluido' => true, 'destacado' => true],
            ['nombre' => 'Documentación avanzada',      'incluido' => true, 'destacado' => false],
            ['nombre' => 'WhatsApp directo',            'incluido' => true, 'destacado' => true],
            ['nombre' => 'Reporte detallado',           'incluido' => true, 'destacado' => false],
            ['nombre' => 'Dashboard premium',           'incluido' => true, 'destacado' => false],
            ['nombre' => 'Alertas en tiempo real',      'incluido' => true, 'destacado' => false],
            ['nombre' => 'Guía anti-baneo',             'incluido' => true, 'destacado' => true],
            ['nombre' => 'Configuración segura',        'incluido' => true, 'destacado' => false],
        ]),
        'bonus_json' => json_encode([
            ['icono' => '🎁', 'texto' => 'Guía de prevención de baneos'],
            ['icono' => '📱', 'texto' => 'Configuración de seguridad'],
            ['icono' => '🔐', 'texto' => 'Checklist de verificación'],
        ]),
    ],
    [
        'codigo'                          => 'business-pro',
        'nombre'                          => 'Business Pro',
        'slug'                            => 'plan-business-pro',
        'categoria'                       => 'business',
        'precio'                          => 99.00,
        'descuento_porcentaje'            => 0.00,
        'descripcion_corta'               => 'Solución empresarial para múltiples números con atención dedicada.',
        'descripcion_larga'               => 'Diseñado para profesionales y pequeñas empresas que gestionan múltiples números de WhatsApp. Incluye asesor dedicado, soporte telefónico y reintentos ilimitados.',
        'tiempo_respuesta_horas'          => 6,
        'tiempo_estimado_recuperacion_min' => 6,
        'tiempo_estimado_recuperacion_max' => 12,
        'numeros_incluidos'               => 3,
        'reintentos_incluidos'            => -1,
        'tipo_soporte'                    => 'telefono',
        'frecuencia_actualizacion'        => '3h',
        'garantia_devolucion'             => true,
        'tiempo_reembolso_horas'          => 0,
        'dashboard_acceso'                => true,
        'api_acceso'                      => true,
        'asesor_dedicado'                 => true,
        'es_popular'                      => false,
        'es_exclusivo'                    => false,
        'activo'                          => true,
        'orden'                           => 3,
        'features_json' => json_encode([
            ['nombre' => 'Garantía de devolución 100%', 'incluido' => true, 'destacado' => true],
            ['nombre' => 'Hasta 3 números',             'incluido' => true, 'destacado' => true],
            ['nombre' => 'Asesor dedicado 24/7',        'incluido' => true, 'destacado' => true],
            ['nombre' => 'Respuesta en 6 horas',        'incluido' => true, 'destacado' => true],
            ['nombre' => 'Diagnóstico empresarial',     'incluido' => true, 'destacado' => false],
            ['nombre' => 'Soporte telefónico',          'incluido' => true, 'destacado' => true],
            ['nombre' => 'Actualizaciones cada 3h',     'incluido' => true, 'destacado' => false],
            ['nombre' => 'Reembolso inmediato',         'incluido' => true, 'destacado' => true],
            ['nombre' => 'Reintentos ilimitados',       'incluido' => true, 'destacado' => true],
            ['nombre' => 'Documentación premium',       'incluido' => true, 'destacado' => false],
            ['nombre' => 'Línea directa WhatsApp',      'incluido' => true, 'destacado' => false],
            ['nombre' => 'API acceso básico',           'incluido' => true, 'destacado' => true],
            ['nombre' => 'Facturación empresarial',     'incluido' => true, 'destacado' => false],
            ['nombre' => 'Multi-usuario dashboard',     'incluido' => true, 'destacado' => false],
            ['nombre' => 'Auditoría de seguridad',      'incluido' => true, 'destacado' => true],
            ['nombre' => 'Capacitación equipo',         'incluido' => true, 'destacado' => false],
        ]),
        'bonus_json' => json_encode([
            ['icono' => '🎁', 'texto' => 'Auditoría de seguridad'],
            ['icono' => '📱', 'texto' => 'Capacitación equipo'],
            ['icono' => '🔐', 'texto' => 'Protocolo anti-baneo'],
            ['icono' => '📊', 'texto' => 'Reportes mensuales'],
        ]),
    ],
    [
        'codigo'                          => 'enterprise',
        'nombre'                          => 'Enterprise',
        'slug'                            => 'plan-enterprise',
        'categoria'                       => 'enterprise',
        'precio'                          => 199.00,
        'descuento_porcentaje'            => 0.00,
        'descripcion_corta'               => 'Solución corporativa completa para empresas con múltiples cuentas.',
        'descripcion_larga'               => 'Plan empresarial premium para organizaciones que requieren gestión de múltiples números con SLA garantizado, integración API completa y soporte dedicado 24/7/365.',
        'tiempo_respuesta_horas'          => 2,
        'tiempo_estimado_recuperacion_min' => 2,
        'tiempo_estimado_recuperacion_max' => 6,
        'numeros_incluidos'               => 10,
        'reintentos_incluidos'            => -1,
        'tipo_soporte'                    => 'dedicado',
        'frecuencia_actualizacion'        => 'realtime',
        'garantia_devolucion'             => true,
        'tiempo_reembolso_horas'          => 0,
        'dashboard_acceso'                => true,
        'api_acceso'                      => true,
        'asesor_dedicado'                 => true,
        'es_popular'                      => false,
        'es_exclusivo'                    => true,
        'activo'                          => true,
        'orden'                           => 4,
        'features_json' => json_encode([
            ['nombre' => 'Garantía de devolución 100%', 'incluido' => true, 'destacado' => true],
            ['nombre' => 'Hasta 10 números',            'incluido' => true, 'destacado' => true],
            ['nombre' => 'Gerente de cuenta',           'incluido' => true, 'destacado' => true],
            ['nombre' => 'Respuesta en 2 horas',        'incluido' => true, 'destacado' => true],
            ['nombre' => 'Soporte dedicado 24/7/365',   'incluido' => true, 'destacado' => true],
            ['nombre' => 'Actualizaciones real-time',   'incluido' => true, 'destacado' => true],
            ['nombre' => 'Reembolso inmediato',         'incluido' => true, 'destacado' => false],
            ['nombre' => 'Reintentos ilimitados',       'incluido' => true, 'destacado' => false],
            ['nombre' => 'Documentación legal',         'incluido' => true, 'destacado' => false],
            ['nombre' => 'Dashboard empresarial',       'incluido' => true, 'destacado' => true],
            ['nombre' => 'API completa',                'incluido' => true, 'destacado' => true],
            ['nombre' => 'SLA garantizado 99.9%',       'incluido' => true, 'destacado' => true],
            ['nombre' => 'Consultoría mensual',         'incluido' => true, 'destacado' => true],
            ['nombre' => 'Auditoría trimestral',        'incluido' => true, 'destacado' => false],
            ['nombre' => 'SSO / SAML',                  'incluido' => true, 'destacado' => true],
            ['nombre' => 'Cumplimiento GDPR',           'incluido' => true, 'destacado' => true],
            ['nombre' => 'Integración CRM',             'incluido' => true, 'destacado' => false],
            ['nombre' => 'Webhooks personalizados',     'incluido' => true, 'destacado' => false],
            ['nombre' => 'Soporte multi-idioma',        'incluido' => true, 'destacado' => false],
            ['nombre' => 'Onboarding dedicado',         'incluido' => true, 'destacado' => false],
        ]),
        'bonus_json' => json_encode([
            ['icono' => '🎁', 'texto' => 'Consultoría mensual'],
            ['icono' => '📊', 'texto' => 'Reportes analytics'],
            ['icono' => '🔐', 'texto' => 'Auditoría trimestral'],
            ['icono' => '🎓', 'texto' => 'Training equipo'],
            ['icono' => '🔗', 'texto' => 'Integración CRM'],
        ]),
    ],
];

$sql = "INSERT IGNORE INTO planes_desbaneo 
    (codigo, nombre, slug, categoria, precio, descuento_porcentaje,
     descripcion_corta, descripcion_larga,
     tiempo_respuesta_horas, tiempo_estimado_recuperacion_min, tiempo_estimado_recuperacion_max,
     numeros_incluidos, reintentos_incluidos,
     tipo_soporte, frecuencia_actualizacion,
     garantia_devolucion, tiempo_reembolso_horas,
     dashboard_acceso, api_acceso, asesor_dedicado,
     es_popular, es_exclusivo, activo, orden,
     features_json, bonus_json)
    VALUES
    (:codigo, :nombre, :slug, :categoria, :precio, :descuento_porcentaje,
     :descripcion_corta, :descripcion_larga,
     :tiempo_respuesta_horas, :tiempo_estimado_recuperacion_min, :tiempo_estimado_recuperacion_max,
     :numeros_incluidos, :reintentos_incluidos,
     :tipo_soporte, :frecuencia_actualizacion,
     :garantia_devolucion, :tiempo_reembolso_horas,
     :dashboard_acceso, :api_acceso, :asesor_dedicado,
     :es_popular, :es_exclusivo, :activo, :orden,
     :features_json, :bonus_json)";

$stmt = $pdo->prepare($sql);

foreach ($planes as $plan) {
    $stmt->execute($plan);
    echo "Plan '{$plan['nombre']}' insertado correctamente.\n";
}

// ============================================================
// Features adicionales para business-pro y enterprise
// ============================================================

$features_extra = [
    ['nombre' => 'Soporte telefónico',  'descripcion' => 'Atención telefónica directa',     'categoria' => 'soporte',   'incluido' => false, 'destacado' => false, 'orden' => 20],
    ['nombre' => 'Backup automático',   'descripcion' => 'Copia de seguridad automática',    'categoria' => 'seguridad', 'incluido' => false, 'destacado' => false, 'orden' => 21],
    ['nombre' => 'Migración asistida',  'descripcion' => 'Ayuda en migración de datos',      'categoria' => 'servicios', 'incluido' => false, 'destacado' => false, 'orden' => 22],
];

$codigos_objetivo = ['business-pro', 'enterprise'];

$stmt_plan = $pdo->prepare("SELECT id FROM planes_desbaneo WHERE codigo = ?");
$stmt_check = $pdo->prepare("SELECT 1 FROM plan_features WHERE plan_id = ? AND nombre = ?");
$stmt_feature = $pdo->prepare("
    INSERT INTO plan_features (plan_id, nombre, descripcion, categoria, incluido, destacado, orden)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");

foreach ($codigos_objetivo as $codigo) {
    $stmt_plan->execute([$codigo]);
    $plan = $stmt_plan->fetch(PDO::FETCH_ASSOC);

    if (!$plan) continue;

    foreach ($features_extra as $feature) {
        $stmt_check->execute([$plan['id'], $feature['nombre']]);

        if ($stmt_check->fetchColumn()) continue;

        $stmt_feature->execute([
            $plan['id'],
            $feature['nombre'],
            $feature['descripcion'],
            $feature['categoria'],
            (int) $feature['incluido'],
            (int) $feature['destacado'],
            $feature['orden'],
        ]);

        echo "Feature '{$feature['nombre']}' agregada al plan '{$codigo}'.\n";
    }
}

// ============================================================
// Verificación
// ============================================================

$stmt_ver = $pdo->query("
    SELECT codigo, nombre, precio, categoria, numeros_incluidos, tiempo_respuesta_horas, es_popular, activo
    FROM planes_desbaneo
    ORDER BY orden
");

echo "\n--- Planes registrados ---\n";
foreach ($stmt_ver->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo sprintf(
        "[%s] %s | $%s | %s | %d número(s) | SLA %dh | Popular: %s | Activo: %s\n",
        $row['codigo'],
        $row['nombre'],
        $row['precio'],
        $row['categoria'],
        $row['numeros_incluidos'],
        $row['tiempo_respuesta_horas'],
        $row['es_popular'] ? 'Sí' : 'No',
        $row['activo']    ? 'Sí' : 'No'
    );
}

// ============================================================
// Tabla: planes_desbaneo
// ============================================================
$pdo->exec("
CREATE TABLE IF NOT EXISTS planes_desbaneo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    descripcion_corta VARCHAR(255) NOT NULL,
    descripcion_larga TEXT NOT NULL,
    tiempo_respuesta_horas INT NOT NULL,
    tiempo_estimado_recuperacion_min INT NOT NULL,
    tiempo_estimado_recuperacion_max INT NOT NULL,
    numeros_incluidos INT NOT NULL,
    reintentos_incluidos INT NOT NULL,
    tipo_soporte ENUM('email', 'whatsapp', 'telefono', 'dedicado') NOT NULL,
    frecuencia_actualizacion ENUM('diaria', '6h', '3h', 'realtime') NOT NULL,
    garantia_devolucion BOOLEAN DEFAULT FALSE,
    tiempo_reembolso_horas INT DEFAULT 0,
    dashboard_acceso BOOLEAN DEFAULT FALSE,
    api_acceso BOOLEAN DEFAULT FALSE,
    asesor_dedicado BOOLEAN DEFAULT FALSE,
    es_popular BOOLEAN DEFAULT FALSE,
    es_exclusivo BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    features_json JSON NULL,
    bonus_json JSON NULL,
    meta_title VARCHAR(255) NULL,
    meta_description VARCHAR(500) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");

echo "\nTodo ejecutado con éxito.\n";
echo "Tabla planes_desbaneo creada correctamente.\n";
