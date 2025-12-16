import { db } from './db';
import { 
  users, inventory, equipment, checklistItems, 
  weeklyTasks, taskCompletions, chatMessages, timelineEvents, menuItems, ingredients 
} from '@shared/schema';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    console.log('🗑️  Clearing existing data...');
    await db.delete(ingredients);
    await db.delete(menuItems);
    await db.delete(timelineEvents);
    await db.delete(chatMessages);
    await db.delete(taskCompletions);
    await db.delete(weeklyTasks);
    await db.delete(checklistItems);
    await db.delete(equipment);
    await db.delete(inventory);
    await db.delete(users);
    console.log('✅ Existing data cleared');

    const systemAdminPassword = await bcrypt.hash('Jordan2005diocesano', SALT_ROUNDS);
    await db.insert(users).values({
      name: 'Angel Gonzalez',
      email: 'system.admin@flowops.internal',
      username: 'angelglezz_',
      password: systemAdminPassword,
      role: 'admin',
      status: 'active',
      establishment: 'Global',
      isSystemAdmin: true
    });
    console.log('✅ System admin created (hidden)');

    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

    const [adminUser] = await db.insert(users).values({
      name: 'Admin Manager',
      email: 'admin@flowops.com',
      username: 'admin',
      password: hashedPassword,
      role: 'manager',
      status: 'active',
      establishment: 'Bison Den',
      phoneNumber: '555-0100',
      isSystemAdmin: false
    }).returning();

    console.log('✅ Admin user created:', adminUser.username);

    await db.insert(inventory).values([
      { emoji: '🍔', name: 'Beef Patties', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
      { emoji: '🥬', name: 'Lettuce', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
      { emoji: '🍅', name: 'Tomatoes', category: 'Food', status: 'LOW', establishment: 'Bison Den', updatedBy: 'System', lowComment: 'Need to restock soon' },
      { emoji: '🧀', name: 'Cheese Slices', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
      { emoji: '🍟', name: 'French Fries', category: 'Food', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
      { emoji: '🥤', name: 'Cola Syrup', category: 'Drink', status: 'OK', establishment: 'Bison Den', updatedBy: 'System' },
    ]);

    console.log('✅ Inventory items created');

    await db.insert(equipment).values([
      { name: 'Fryer', category: 'Kitchen', status: 'Working', establishment: 'Bison Den' },
      { name: 'Grill', category: 'Kitchen', status: 'Working', establishment: 'Bison Den' },
      { name: 'Fridge', category: 'Kitchen', status: 'Attention', establishment: 'Bison Den', lastIssue: 'Temperature fluctuating' },
      { name: 'Ice Machine', category: 'Bar', status: 'Working', establishment: 'Bison Den' },
      { name: 'Dishwasher', category: 'Kitchen', status: 'Working', establishment: 'Bison Den' },
    ]);

    console.log('✅ Equipment items created');

    await db.insert(checklistItems).values([
      { text: 'Turn on grill', listType: 'opening', establishment: 'Bison Den', completed: false, assignedTo: 'Hunter' },
      { text: 'Prep lettuce & tomato', listType: 'opening', establishment: 'Bison Den', completed: true, completedBy: 'Admin Manager', assignedTo: 'Admin Manager', completedAt: new Date() },
      { text: 'Refill sauces', listType: 'opening', establishment: 'Bison Den', completed: false, assignedTo: 'Sam' },
      { text: 'Unlock fridge', listType: 'opening', establishment: 'Bison Den', completed: false, assignedTo: 'Angel' },
      { text: 'Wipe tables', listType: 'shift', establishment: 'Bison Den', completed: false, assignedTo: 'Bella' },
      { text: 'Check trash bins', listType: 'shift', establishment: 'Bison Den', completed: false, assignedTo: 'Sam' },
      { text: 'Restock napkins', listType: 'shift', establishment: 'Bison Den', completed: false, assignedTo: 'Hunter' },
      { text: 'Clean fryer knob', listType: 'closing', establishment: 'Bison Den', completed: false, assignedTo: 'Angel' },
      { text: 'Sweep floors', listType: 'closing', establishment: 'Bison Den', completed: false, assignedTo: 'Sam' },
      { text: 'Lock fridge', listType: 'closing', establishment: 'Bison Den', completed: false, assignedTo: 'Hunter' },
    ]);

    console.log('✅ Checklist items created');

    await db.insert(weeklyTasks).values([
      { text: 'Deep clean fridge', assignedTo: 'Angel', establishment: 'Bison Den', completed: false, notes: 'Use the heavy duty cleaner' },
      { text: 'Clean vents', assignedTo: 'Hunter', establishment: 'Bison Den', completed: false },
      { text: 'Wipe counters', assignedTo: 'Admin Manager', establishment: 'Bison Den', completed: true, completedAt: new Date() },
    ]);

    console.log('✅ Weekly tasks created');

    await db.insert(chatMessages).values([
      { text: 'Inventory arrived', sender: 'Admin Manager', senderRole: 'manager', establishment: 'Bison Den', type: 'action' },
      { text: 'Welcome to FlowOps! Use this chat to communicate with your team.', sender: 'System', senderRole: 'manager', establishment: 'Bison Den', type: 'text' },
    ]);

    console.log('✅ Chat messages created');

    await db.insert(timelineEvents).values([
      { text: 'Fridge needs attention', author: 'Admin Manager', authorRole: 'manager', establishment: 'Bison Den', type: 'warning', comment: 'Temperature fluctuating' },
      { text: 'Tomatoes marked LOW', author: 'Admin Manager', authorRole: 'manager', establishment: 'Bison Den', type: 'warning', comment: 'Need to restock soon' },
      { text: 'Opening checklist: Prep lettuce & tomato completed', author: 'Admin Manager', authorRole: 'manager', establishment: 'Bison Den', type: 'success' },
    ]);

    console.log('✅ Timeline events created');

    const [burger] = await db.insert(menuItems).values({
      name: 'Honkytonk Burger',
      category: 'Burgers',
      establishment: 'Bison Den'
    }).returning();

    const [bites] = await db.insert(menuItems).values({
      name: 'Bites on Bites',
      category: 'Appetizers',
      establishment: 'Bison Den'
    }).returning();

    const [wings] = await db.insert(menuItems).values({
      name: 'Wings',
      category: 'Appetizers',
      establishment: 'Bison Den'
    }).returning();

    console.log('✅ Menu items created');

    await db.insert(ingredients).values([
      { menuItemId: burger.id, name: 'Beef Patty', quantity: 120, unit: 'grams' },
      { menuItemId: burger.id, name: 'Bun', quantity: 1, unit: 'pieces' },
      { menuItemId: burger.id, name: 'Lettuce', quantity: 15, unit: 'grams' },
      { menuItemId: burger.id, name: 'Tomato', quantity: 10, unit: 'grams' },
      { menuItemId: burger.id, name: 'Sauce', quantity: 1, unit: 'tablespoons' },
      { menuItemId: bites.id, name: 'Bites', quantity: 1, unit: 'bowls', notes: 'Fill to the top' },
      { menuItemId: bites.id, name: 'Sauce', quantity: 0.5, unit: 'cups' },
      { menuItemId: wings.id, name: 'Wings', quantity: 6, unit: 'pieces', notes: 'Standard portion' },
      { menuItemId: wings.id, name: 'Sauce', quantity: 2, unit: 'oz' },
    ]);

    console.log('✅ Ingredients created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: password123');
    console.log('   Establishment: Bison Den\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
