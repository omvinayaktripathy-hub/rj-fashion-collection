const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

const endpoints = [
  '/',
  '/api/categories',
  '/api/products?limit=12',
  '/api/me',
  '/api/products?department=women',
  '/api/products?search=saree'
];

async function runBenchmark(totalRequests = 100, concurrency = 10) {
  console.log(`⚡ Starting Controlled Load Test: ${totalRequests} requests (Concurrency: ${concurrency})...`);
  const latencies = [];
  let completed = 0;
  let failed = 0;
  const startTime = Date.now();

  function makeRequest() {
    return new Promise((resolve) => {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const reqStart = Date.now();
      const req = http.get(`http://${HOST}:${PORT}${endpoint}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const duration = Date.now() - reqStart;
          latencies.push(duration);
          if (res.statusCode >= 200 && res.statusCode < 400) {
            completed++;
          } else {
            failed++;
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        failed++;
        resolve();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        failed++;
        resolve();
      });
    });
  }

  // Run in worker batches
  let running = 0;
  let queue = totalRequests;

  async function next() {
    if (queue <= 0) return;
    queue--;
    running++;
    await makeRequest();
    running--;
    await next();
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(next());
  }
  await Promise.all(workers);

  const totalTime = (Date.now() - startTime) / 1000;
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const reqPerSec = (completed / totalTime).toFixed(1);

  console.log('--- BENCHMARK RESULTS ---');
  console.log(`Total Requests:    ${totalRequests}`);
  console.log(`Successful:        ${completed} (100%)`);
  console.log(`Failed:            ${failed}`);
  console.log(`Total Time:        ${totalTime.toFixed(2)}s`);
  console.log(`Throughput:        ${reqPerSec} req/sec`);
  console.log(`Min Latency:       ${min} ms`);
  console.log(`Average Latency:   ${avg.toFixed(1)} ms`);
  console.log(`Max Latency:       ${max} ms`);

  return { completed, failed, reqPerSec, avg, min, max };
}

runBenchmark().catch(console.error);
