const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration WhatsApp API
const WHATSAPP_CONFIG = {
  phoneNumberId: '941400289045871',
  accessToken: 'EAAWdZCWjwF6QBQKCMO8jvksmDNmXcvf4rhodQv7a0Vnfipi4ZB8fdvx8VH4ZAbYRaPLSal84VdKVTNZAe3enagLwGZBWKXDtpS1iuc19NXHZAPfBpo7c2riq5FvnNAHm6ZCfnBlFuZAdw2rPmqsezhadw4DKPwJsuSvbZC8ZCW4ZCpm4rB1AEUAjOpgg3YJkZBGw6uBY4wZDZD',
  recipientPhone: '2250143848821'
};

const PORT = 3001;

// MIME types for serving static files
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoint for sending WhatsApp messages
  if (req.method === 'POST' && req.url === '/api/send-whatsapp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        sendWhatsAppMessage(data, res);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function sendWhatsAppMessage(orderData, res) {
  const postData = JSON.stringify({
    messaging_product: 'whatsapp',
    to: WHATSAPP_CONFIG.recipientPhone,
    type: 'template',
    template: {
      name: 'order_confirmation',
      language: { code: 'fr' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: orderData.clientName || 'Client' },
          { type: 'text', text: orderData.clientPhone || 'Non fourni' },
          { type: 'text', text: orderData.items || 'Commande' },
          { type: 'text', text: orderData.total || '0' }
        ]
      }]
    }
  });

  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/v18.0/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      console.log('WhatsApp API Response:', data);
      res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  });

  apiReq.on('error', (error) => {
    console.error('WhatsApp API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  });

  apiReq.write(postData);
  apiReq.end();
}

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🍽️  LA TERANGA - Serveur démarré !                   ║
║                                                        ║
║   Ouvrez: http://localhost:${PORT}                       ║
║                                                        ║
║   L'API WhatsApp est prête sur /api/send-whatsapp      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});
