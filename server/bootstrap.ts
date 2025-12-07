import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function bootstrapSystemAdmin() {
  console.log('[BOOTSTRAP] Checking for system admin...');
  
  try {
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'angelglezz_')).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('[BOOTSTRAP] System admin not found, creating...');
      
      const hashedPassword = await bcrypt.hash('Jordan2005diocesano', SALT_ROUNDS);
      
      await db.insert(users).values({
        name: 'Angel Gonzalez',
        email: 'system.admin@flowops.internal',
        username: 'angelglezz_',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        establishment: 'Global',
        isSystemAdmin: true
      });
      
      console.log('[BOOTSTRAP] System admin created successfully!');
    } else {
      console.log('[BOOTSTRAP] System admin already exists.');
    }
  } catch (error) {
    console.error('[BOOTSTRAP] Error during bootstrap:', error);
  }
}
