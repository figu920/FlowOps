// api/index.ts
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { bootstrapSystemAdmin } from "./bootstrap";
import { serveStatic } from "./static";

// Inicializa Express
const app = express();

// --- Configuración de sesiones con PostgreSQL ---
const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "flowops-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// --- Middleware para parsear JSON y URL-encoded ---
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// --- Logging simple de requests ---
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// --- FUNCIÓN PRINCIPAL DE ARRANQUE ---
(async () => {
  // 1. Crear datos iniciales (Admin)
  await bootstrapSystemAdmin();

  // 2. Registrar rutas (y obtener el servidor HTTP si existe)
  // IMPORTANTE: registerRoutes suele devolver el servidor HTTP para websockets
  const server = await registerRoutes(app);

  // --- Error handler ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // --- Servir frontend estático solo en producción ---
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  // 3. ARRANCAR EL SERVIDOR (CORREGIDO)
  // Render nos da el puerto en process.env.PORT (usualmente 10000)
  const PORT = process.env.PORT || 5000;
  
  // CORRECCIÓN: Como registerRoutes no devuelve nada, usamos 'app' directamente.
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
  });
})();