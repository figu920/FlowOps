import { db } from './db';
import { users, inventory, equipment, checklistItems, weeklyTasks, chatMessages, menuItems, ingredients } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function bootstrapSystemAdmin() {
  const env = process.env.NODE_ENV || 'development';
  console.log(`[BOOTSTRAP] Starting bootstrap in ${env} environment...`);
  console.log(`[BOOTSTRAP] Database URL exists: ${!!process.env.DATABASE_URL}`);
  
  try {
    await ensureSystemAdmin();
    await ensureDemoUser(); // <--- LLAMAMOS A LA NUEVA FUNCIÓN AQUÍ
    await seedAllDataIfEmpty();
    console.log('[BOOTSTRAP] Bootstrap completed successfully!');
  } catch (error) {
    console.error('[BOOTSTRAP] CRITICAL ERROR during bootstrap:', error);
  }
}

async function ensureSystemAdmin() {
  console.log('[BOOTSTRAP] Checking for system admin...');
  
  try {
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'angelglezz_')).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('[BOOTSTRAP] System admin not found, creating...');
      
      // 🚨 SEGURIDAD: Cambiada la contraseña a una genérica para GitHub
      const hashedPassword = await bcrypt.hash('AdminFlowOps2024!', SALT_ROUNDS);
      
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
    console.error('[BOOTSTRAP] Error ensuring system admin:', error);
    throw error;
  }
}

// === NUEVA FUNCIÓN PARA EL USUARIO DEMO ===
async function ensureDemoUser() {
  console.log('[BOOTSTRAP] Checking for demo user...');
  
  try {
    const existingDemo = await db.select().from(users).where(eq(users.username, 'demo')).limit(1);
    
    if (existingDemo.length === 0) {
      console.log('[BOOTSTRAP] Demo user not found, creating...');
      
      const hashedPassword = await bcrypt.hash('demo123', SALT_ROUNDS);
      
      await db.insert(users).values({
        name: 'Guest User (Demo)',
        email: 'demo@flowops.com',
        username: 'demo',
        password: hashedPassword,
        role: 'manager', // Rol de manager para que puedan ver todo
        status: 'active',
        establishment: 'Bison Den', // Misma tienda que los datos de prueba
        isSystemAdmin: false
      });
      
      console.log('[BOOTSTRAP] Demo user created successfully!');
    } else {
      console.log('[BOOTSTRAP] Demo user already exists.');
    }
  } catch (error) {
    console.error('[BOOTSTRAP] Error ensuring demo user:', error);
    // No lanzamos el error para que la app siga arrancando aunque falle el demo
  }
}

async function seedAllDataIfEmpty() {
  console.log('[BOOTSTRAP] Checking if data needs to be seeded...');
  
  try {
    const existingInventory = await db.select().from(inventory).limit(1);
    const existingEquipment = await db.select().from(equipment).limit(1);
    const existingChecklists = await db.select().from(checklistItems).limit(1);
    const existingTasks = await db.select().from(weeklyTasks).limit(1);
    const existingChat = await db.select().from(chatMessages).limit(1);
    const existingMenu = await db.select().from(menuItems).limit(1);
    
    console.log(`[BOOTSTRAP] Data status - Inventory: ${existingInventory.length}, Equipment: ${existingEquipment.length}, Checklists: ${existingChecklists.length}, Tasks: ${existingTasks.length}, Chat: ${existingChat.length}, Menu: ${existingMenu.length}`);
    
    if (existingInventory.length === 0) {
      console.log('[BOOTSTRAP] Seeding inventory...');
      await db.insert(inventory).values([
        { emoji: '📦', name: 'Beef Patties', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
        { emoji: '🥬', name: 'Lettuce', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
        { emoji: '🍅', name: 'Tomatoes', category: 'Food', status: 'LOW', establishment: 'Bison Den', updatedBy: 'System', lowComment: 'Need to restock soon' },
        { emoji: '🧀', name: 'Cheese Slices', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
        { emoji: '🍟', name: 'French Fries', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
        { emoji: '🥤', name: 'Cola Syrup', category: 'Drink', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
      ]);
      console.log('[BOOTSTRAP] Inventory seeded');
    }

    if (existingEquipment.length === 0) {
      console.log('[BOOTSTRAP] Seeding equipment...');
      await db.insert(equipment).values([
        { name: 'Fryer', category: 'Kitchen', status: 'Working', establishment: 'Bison Den' },
        { name: 'Grill', category: 'Kitchen', status: 'Working', establishment: 'Bison Den' },
        { name: 'Fridge', category: 'Kitchen', status: 'Attention', establishment: 'Bison Den', lastIssue: 'Temperature fluctuating' },
        { name: 'Ice Machine', category: 'Bar', status: 'Working', establishment: 'Bison Den' },
        { name: 'Dishwasher', category: 'Kitchen', status: 'Working', establishment: 'Bison Den' },
      ]);
      console.log('[BOOTSTRAP] Equipment seeded');
    }

    if (existingChecklists.length === 0) {
      console.log('[BOOTSTRAP] Seeding checklists...');
      await db.insert(checklistItems).values([
        { text: 'Turn on grill', listType: 'opening', establishment: 'Bison Den', completed: false, assignedTo: 'Team' },
        { text: 'Prep lettuce & tomato', listType: 'opening', establishment: 'Bison Den', completed: false, assignedTo: 'Team' },
        { text: 'Refill sauces', listType: 'opening', establishment: 'Bison Den', completed: false, assignedTo: 'Team' },
        { text: 'Wipe tables', listType: 'shift', establishment: 'Bison Den', completed: false, assignedTo: 'Team' },
        { text: 'Check trash bins', listType: 'shift', establishment: 'Bison Den', completed: false, assignedTo: 'Team' },
        { text: 'Clean fryer', listType: 'closing', establishment: 'Bison Den', completed: false, assignedTo: 'Team' },
        { text: 'Sweep floors', listType: 'closing', establishment: 'Bison Den', completed: false, assignedTo: 'Team' },
      ]);
      console.log('[BOOTSTRAP] Checklists seeded');
    }

    if (existingTasks.length === 0) {
      console.log('[BOOTSTRAP] Seeding weekly tasks...');
      await db.insert(weeklyTasks).values([
        { text: 'Deep clean fridge', assignedTo: 'Team', establishment: 'Bison Den', completed: false },
        { text: 'Clean vents', assignedTo: 'Team', establishment: 'Bison Den', completed: false },
      ]);
      console.log('[BOOTSTRAP] Weekly tasks seeded');
    }

    if (existingChat.length === 0) {
      console.log('[BOOTSTRAP] Seeding chat...');
      await db.insert(chatMessages).values([
        { text: 'Welcome to FlowOps! Use this chat to communicate with your team.', sender: 'System', senderRole: 'manager', establishment: 'Bison Den', type: 'text' },
      ]);
      console.log('[BOOTSTRAP] Chat seeded');
    }

    if (existingMenu.length === 0) {
      console.log('[BOOTSTRAP] Seeding menu items...');
      const [burger] = await db.insert(menuItems).values({
        name: 'Honkytonk Burger',
        category: 'Burgers',
        establishment: 'Bison Den'
      }).returning();

      const [wings] = await db.insert(menuItems).values({
        name: 'Wings',
        category: 'Appetizers',
        establishment: 'Bison Den'
      }).returning();

      await db.insert(ingredients).values([
        { menuItemId: burger.id, name: 'Beef Patty', quantity: 120, unit: 'grams' },
        { menuItemId: burger.id, name: 'Bun', quantity: 1, unit: 'pieces' },
        { menuItemId: burger.id, name: 'Lettuce', quantity: 15, unit: 'grams' },
        { menuItemId: wings.id, name: 'Wings', quantity: 6, unit: 'pieces' },
        { menuItemId: wings.id, name: 'Sauce', quantity: 2, unit: 'oz' },
      ]);
      console.log('[BOOTSTRAP] Menu items seeded');
    }

    console.log('[BOOTSTRAP] Data seeding check completed!');
  } catch (error) {
    console.error('[BOOTSTRAP] Error seeding data:', error);
    throw error;
  }
}