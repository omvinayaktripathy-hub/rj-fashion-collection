const https = require('https');

https.get('https://rj-fashion-collection.web.app/login', res => {
  console.log('Status:', res.statusCode);
  console.log('Cache-Control:', res.headers['cache-control']);
  console.log('ETag:', res.headers['etag']);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Has auth-blade:', data.includes('auth-blade'));
    const match = data.match(/<script src="\/js\/auth\.js[^"]*">/);
    console.log('Script tag found:', match ? match[0] : 'None');
  });
});
