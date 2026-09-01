/**
 * Servidor Web de Producción para Render.com (server.js)
 * Sirve los archivos compilados de Vite en dist/ con tipos MIME estrictos y soporte SPA.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Middleware para tipos MIME correctos y compresión
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  } else if (req.url.endsWith('.js') || req.url.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.url.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
  } else if (req.url.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// Servir la carpeta assets directamente
const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
  app.use('/assets', express.static(assetsPath, {
    maxAge: '1y',
    immutable: true,
  }));
}

// Servir la carpeta dist completa
app.use(express.static(distPath, {
  maxAge: '1h',
}));

// Healthcheck para Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', game: 'El Cazador y El Miedoso' });
});

// SPA Fallback: redirigir rutas no estáticas a index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Error: La compilación del juego (dist/) no fue encontrada. Ejecuta npm run build.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Servidor de El Cazador y El Miedoso corriendo en http://0.0.0.0:${PORT}`);
});
