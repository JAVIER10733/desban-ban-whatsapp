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
// Seed: Planes de Baneo
// ::jsonb de PostgreSQL se elimina, PHP maneja json_encode.
// ON CONFLICT (slug) DO UPDATE -> INSERT ... ON DUPLICATE KEY UPDATE
// ============================================================

$planes = [
    [
        'slug'              => 'basico',
        'nombre'            => 'Básico',
        'tipo'              => 'personal',
        'precio_usd'        => 29.00,
        'descripcion'       => 'Para reportes simples y directos.',
        'tiempo_respuesta'  => '72h',
        'numeros_incluidos' => 1,
        'incluye_garantia'  => false,
        'es_popular'        => false,
        'badge_texto'       => null,
        'features'          => json_encode([
            '1 número',
            'Reporte estándar ante Meta',
            'Respuesta en 72 horas',
            'Soporte por chat',
            'Seguimiento del caso',
        ]),
        'no_incluye'        => json_encode([
            'Garantía de devolución',
            'Especialista dedicado',
            'Prioridad express',
        ]),
        'activo'            => true,
        'orden'             => 1,
    ],
    [
        'slug'              => 'pro',
        'nombre'            => 'Pro',
        'tipo'              => 'personal',
        'precio_usd'        => 49.00,
        'descripcion'       => 'Para reportes urgentes con garantía.',
        'tiempo_respuesta'  => '24h',
        'numeros_incluidos' => 1,
        'incluye_garantia'  => true,
        'es_popular'        => true,
        'badge_texto'       => 'Más elegido',
        'features'          => json_encode([
            '1 número',
            'Reporte prioritario ante Meta',
            'Respuesta en 24 horas',
            'Especialista dedicado',
            'Garantía de devolución 100%',
            'Seguimiento en tiempo real',
        ]),
        'no_incluye'        => json_encode([
            'Prioridad express',
            'Múltiples números',
        ]),
        'activo'            => true,
        'orden'             => 2,
    ],
    [
        'slug'              => 'enterprise',
        'nombre'            => 'Enterprise',
        'tipo'              => 'personal',
        'precio_usd'        => 89.00,
        'descripcion'       => 'Para múltiples reportes o casos urgentes.',
        'tiempo_respuesta'  => '12h',
        'numeros_incluidos' => 5,
        'incluye_garantia'  => true,
        'es_popular'        => false,
        'badge_texto'       => null,
        'features'          => json_encode([
            'Hasta 5 números',
            'Reporte express ante Meta',
            'Respuesta en 12 horas',
            'Asesor dedicado 24/7',
            'Garantía de devolución 100%',
            'Seguimiento en tiempo real',
            'Prioridad máxima',
        ]),
        'no_incluye'        => json_encode([]),
        'activo'            => true,
        'orden'             => 3,
    ],
    [
        'slug'              => 'business',
        'nombre'            => 'Business',
        'tipo'              => 'business',
        'precio_usd'        => 69.00,
        'descripcion'       => 'Para reportar cuentas WhatsApp Business.',
        'tiempo_respuesta'  => '24h',
        'numeros_incluidos' => 1,
        'incluye_garantia'  => false,
        'es_popular'        => false,
        'badge_texto'       => null,
        'features'          => json_encode([
            '1 número Business',
            'Reporte con documentación empresarial',
            'Respuesta en 24 horas',
            'Asesor de negocio',
            'Seguimiento del caso',
        ]),
        'no_incluye'        => json_encode([
            'Garantía de devolución',
            'Múltiples números',
        ]),
        'activo'            => true,
        'orden'             => 4,
    ],
    [
        'slug'              => 'business-pro',
        'nombre'            => 'Business Pro',
        'tipo'              => 'business',
        'precio_usd'        => 109.00,
        'descripcion'       => 'Para negocios con múltiples cuentas Business.',
        'tiempo_respuesta'  => '12h',
        'numeros_incluidos' => 3,
        'incluye_garantia'  => true,
        'es_popular'        => true,
        'badge_texto'       => 'Recomendado',
        'features'          => json_encode([
            'Hasta 3 números Business',
            'Reporte express',
            'Respuesta en 12 horas',
            'Asesor dedicado 24/7',
            'Garantía de devolución 100%',
            'Seguimiento en tiempo real',
        ]),
        'no_incluye'        => json_encode([
            'Integración API',
        ]),
        'activo'            => true,
        'orden'             => 5,
    ],
];

// ON CONFLICT (slug) DO UPDATE -> INSERT ... ON DUPLICATE KEY UPDATE
$sql = "
    INSERT INTO planes_baneo
        (slug, nombre, tipo, precio_usd, descripcion, tiempo_respuesta,
         numeros_incluidos, incluye_garantia, es_popular, badge_texto,
         features, no_incluye, activo, orden)
    VALUES
        (:slug, :nombre, :tipo, :precio_usd, :descripcion, :tiempo_respuesta,
         :numeros_incluidos, :incluye_garantia, :es_popular, :badge_texto,
         :features, :no_incluye, :activo, :orden)
    ON DUPLICATE KEY UPDATE
        precio_usd        = VALUES(precio_usd),
        descripcion       = VALUES(descripcion),
        tiempo_respuesta  = VALUES(tiempo_respuesta),
        numeros_incluidos = VALUES(numeros_incluidos),
        incluye_garantia  = VALUES(incluye_garantia),
        es_popular        = VALUES(es_popular),
        badge_texto       = VALUES(badge_texto),
        features          = VALUES(features),
        no_incluye        = VALUES(no_incluye),
        activo            = VALUES(activo),
        updated_at        = NOW()
";

$stmt = $pdo->prepare($sql);

foreach ($planes as $plan) {
    $stmt->execute([
        ':slug'              => $plan['slug'],
        ':nombre'            => $plan['nombre'],
        ':tipo'              => $plan['tipo'],
        ':precio_usd'        => $plan['precio_usd'],
        ':descripcion'       => $plan['descripcion'],
        ':tiempo_respuesta'  => $plan['tiempo_respuesta'],
        ':numeros_incluidos' => $plan['numeros_incluidos'],
        ':incluye_garantia'  => (int) $plan['incluye_garantia'],
        ':es_popular'        => (int) $plan['es_popular'],
        ':badge_texto'       => $plan['badge_texto'],
        ':features'          => $plan['features'],
        ':no_incluye'        => $plan['no_incluye'],
        ':activo'            => (int) $plan['activo'],
        ':orden'             => $plan['orden'],
    ]);

    $accion = $stmt->rowCount() === 1 ? 'insertado' : 'actualizado';
    echo "Plan '{$plan['nombre']}' {$accion} correctamente.\n";
}

echo "\nTodo ejecutado con éxito.\n";