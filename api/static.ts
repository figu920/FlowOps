import { Express } from "express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// 1. Definimos __dirname manualmente (necesario en Node moderno)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // 2. Apuntamos a la carpeta 'dist/public' que Vite acaba de construir
  // Subimos un nivel (..) desde 'api' para encontrar 'dist'
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  // Servir archivos estáticos (JS, CSS, imágenes)
  app.use(express.static(distPath));

  // 3. Para cualquier otra ruta, devolver el index.html (Vital para React)
  app.use("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}