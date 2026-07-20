#!/usr/bin/env node
/**
 * Lightweight load test for smoke endpoints.
 * Run: node scripts/load-test.mjs [baseUrl] [requests]
 */
const baseUrl = process.argv[2] ?? 'http://localhost:3000'
const totalRequests = Number(process.argv[3] ?? 50)
const concurrency = 5

async function hitHealth() {
  const started = Date.now()
  const response = await fetch(`${baseUrl}/health`)
  const elapsed = Date.now() - started
  return { ok: response.ok, elapsed }
}

async function runBatch(batchSize) {
  return Promise.all(Array.from({ length: batchSize }, () => hitHealth()))
}

async function main() {
  console.log(
    `Load test: ${totalRequests} requests to ${baseUrl}/health (concurrency ${concurrency})`,
  )

  const latencies = []
  let failures = 0

  for (let index = 0; index < totalRequests; index += concurrency) {
    const batch = await runBatch(Math.min(concurrency, totalRequests - index))
    for (const result of batch) {
      latencies.push(result.elapsed)
      if (!result.ok) failures += 1
    }
  }

  latencies.sort((a, b) => a - b)
  const p95 = latencies[Math.floor(latencies.length * 0.95) - 1] ?? 0

  console.log(`Failures: ${failures}/${totalRequests}`)
  console.log(`P95 latency: ${p95}ms`)
  console.log(p95 < 500 ? 'PASS — p95 under 500ms budget' : 'WARN — p95 exceeds 500ms budget')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
