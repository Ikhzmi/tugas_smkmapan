<?php

use Illuminate\Support\Facades\Route;
use Symfony\Component\Yaml\Yaml;

test('openapi contract matches every registered API route', function () {
    $spec = Yaml::parseFile(base_path('docs/openapi.yaml'));
    $documented = [];

    foreach ($spec['paths'] as $path => $operations) {
        foreach (['get', 'post', 'put', 'patch', 'delete'] as $method) {
            if (isset($operations[$method])) {
                $documented[$method.' '.$path] = true;
            }
        }
    }

    $registered = [];

    foreach (Route::getRoutes() as $route) {
        $uri = $route->uri();

        if (! str_starts_with($uri, 'api/v1')) {
            continue;
        }

        $path = '/'.ltrim(substr($uri, strlen('api/v1')), '/');

        foreach ($route->methods() as $method) {
            if (in_array($method, ['HEAD', 'OPTIONS'], true)) {
                continue;
            }

            $registered[strtolower($method).' '.$path] = true;
        }
    }

    expect(array_keys(array_diff_key($registered, $documented)))->toBe([])
        ->and(array_keys(array_diff_key($documented, $registered)))->toBe([]);
});

test('openapi operations have unique ids and valid local references', function () {
    $spec = Yaml::parseFile(base_path('docs/openapi.yaml'));
    $operationIds = [];
    $references = [];

    $walk = function (mixed $value) use (&$walk, &$references): void {
        if (! is_array($value)) {
            return;
        }

        foreach ($value as $key => $child) {
            if ($key === '$ref' && is_string($child)) {
                $references[] = $child;
            }

            $walk($child);
        }
    };

    foreach ($spec['paths'] as $path => $operations) {
        foreach (['get', 'post', 'put', 'patch', 'delete'] as $method) {
            if (! isset($operations[$method])) {
                continue;
            }

            $operationId = $operations[$method]['operationId'] ?? null;

            expect($operationId)->not->toBeNull();
            $operationIds[] = $operationId;
        }
    }

    expect(array_unique($operationIds))->toHaveCount(count($operationIds));

    $walk($spec);

    foreach (array_unique($references) as $reference) {
        if (! str_starts_with($reference, '#/')) {
            continue;
        }

        $node = $spec;

        foreach (array_slice(explode('/', $reference), 1) as $segment) {
            expect($node)->toBeArray()->toHaveKey($segment);
            $node = $node[$segment];
        }
    }
});

test('postman collection is valid and covers core role flows', function () {
    $path = base_path('docs/postman_collection.json');
    $collection = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

    expect($collection['info']['name'])->toBe('SMKM 8 Medan API v1')
        ->and($collection['variable'])->toContainEqual(['key' => 'base_url', 'value' => 'http://smkm8medan-api.test/api/v1']);

    $requests = [];

    $collect = function (array $items) use (&$collect, &$requests): void {
        foreach ($items as $item) {
            if (isset($item['item'])) {
                $collect($item['item']);

                continue;
            }

            $requests[] = strtoupper($item['request']['method']).' '.$item['request']['url'];
        }
    };

    $collect($collection['item']);

    expect($requests)->toContain(
        'POST {{base_url}}/auth/login',
        'GET {{base_url}}/admin/accounts?per_page=20',
        'GET {{base_url}}/guru/exams/{{exam_id}}/recap',
        'GET {{base_url}}/siswa/grades',
    );
});
