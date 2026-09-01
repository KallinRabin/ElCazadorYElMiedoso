/**
 * Servidor Web de Producción para Render.com (server.js)
 * Sirve los archivos compilados de Vite en dist/ y maneja SPA routing
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos de la compilación de producción
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Healthcheck para el monitor de Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', game: 'Laberinto 3D Multijugador' });
});

// SPA Fallback: todas las rutas cargan index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Servidor de Laberinto 3D corriendo en http://0.0.0.0:${PORT}`);
});
