import 'dotenv/config';
import { db } from './api/db';
import { users } from './shared/schema';
import { hash } from 'bcrypt';

async function main() {
  console.log("🔨 Fabricando usuario Admin...");

  // 1. Encriptamos la contraseña "admin123"
  const passwordEncriptada = await hash("admin123", 10);

  try {
    // 2. Insertamos el usuario en la base de datos
    await db.insert(users).values({
      name: "Super Admin",
      email: "admin@flowops.com",
      username: "admin",
      password: passwordEncriptada,
      role: "admin",
      status: "active",
      establishment: "Global",
      isSystemAdmin: true,
      phoneNumber: "555-555-555"
    });
    
    console.log("✅ ¡Usuario Admin creado con éxito!");

  } catch (error) {
    console.error("❌ Error (quizás el usuario ya existe):", error);
  }
  
  process.exit(0);
}

main();