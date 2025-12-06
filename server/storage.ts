import { 
  type User, type InsertUser,
  type Inventory, type InsertInventory,
  type Equipment, type InsertEquipment,
  type ChecklistItem, type InsertChecklistItem,
  type WeeklyTask, type InsertWeeklyTask,
  type TaskCompletion, type InsertTaskCompletion,
  type ChatMessage, type InsertChatMessage,
  type TimelineEvent, type InsertTimelineEvent,
  type MenuItem, type InsertMenuItem,
  type Ingredient, type InsertIngredient,
  users, inventory, equipment, checklistItems, weeklyTasks, taskCompletions,
  chatMessages, timelineEvents, menuItems, ingredients
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User Management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByEstablishment(establishment: string): Promise<User[]>;
  getAllPendingUsers(establishment: string): Promise<User[]>;
  
  // Inventory
  getInventoryByEstablishment(establishment: string): Promise<Inventory[]>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string): Promise<void>;
  
  // Equipment
  getEquipmentByEstablishment(establishment: string): Promise<Equipment[]>;
  createEquipmentItem(item: InsertEquipment): Promise<Equipment>;
  updateEquipmentItem(id: string, updates: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipmentItem(id: string): Promise<void>;
  
  // Checklists
  getChecklistItemsByEstablishment(establishment: string, listType?: string): Promise<ChecklistItem[]>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: string, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined>;
  deleteChecklistItem(id: string): Promise<void>;
  
  // Weekly Tasks
  getWeeklyTasksByEstablishment(establishment: string): Promise<WeeklyTask[]>;
  createWeeklyTask(task: InsertWeeklyTask): Promise<WeeklyTask>;
  updateWeeklyTask(id: string, updates: Partial<InsertWeeklyTask>): Promise<WeeklyTask | undefined>;
  deleteWeeklyTask(id: string): Promise<void>;
  
  // Task Completions
  getTaskCompletions(taskId: string): Promise<TaskCompletion[]>;
  createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion>;
  
  // Chat
  getChatMessagesByEstablishment(establishment: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Timeline
  getTimelineEventsByEstablishment(establishment: string): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  
  // Menu
  getMenuItemsByEstablishment(establishment: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;
  
  // Ingredients
  getIngredientsByMenuItem(menuItemId: string): Promise<Ingredient[]>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: string, updates: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ===== USER MANAGEMENT =====
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getUsersByEstablishment(establishment: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.establishment, establishment));
  }

  async getAllPendingUsers(establishment: string): Promise<User[]> {
    return await db.select().from(users).where(
      and(eq(users.establishment, establishment), eq(users.status, 'pending'))
    );
  }

  // ===== INVENTORY =====
  async getInventoryByEstablishment(establishment: string): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.establishment, establishment));
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [created] = await db.insert(inventory).values(item).returning();
    return created;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [updated] = await db.update(inventory).set(updates).where(eq(inventory.id, id)).returning();
    return updated || undefined;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // ===== EQUIPMENT =====
  async getEquipmentByEstablishment(establishment: string): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.establishment, establishment));
  }

  async createEquipmentItem(item: InsertEquipment): Promise<Equipment> {
    const [created] = await db.insert(equipment).values(item).returning();
    return created;
  }

  async updateEquipmentItem(id: string, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const [updated] = await db.update(equipment).set(updates).where(eq(equipment.id, id)).returning();
    return updated || undefined;
  }

  async deleteEquipmentItem(id: string): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  // ===== CHECKLISTS =====
  async getChecklistItemsByEstablishment(establishment: string, listType?: string): Promise<ChecklistItem[]> {
    if (listType) {
      return await db.select().from(checklistItems).where(
        and(eq(checklistItems.establishment, establishment), eq(checklistItems.listType, listType))
      );
    }
    return await db.select().from(checklistItems).where(eq(checklistItems.establishment, establishment));
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const [created] = await db.insert(checklistItems).values(item).returning();
    return created;
  }

  async updateChecklistItem(id: string, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const [updated] = await db.update(checklistItems).set(updates).where(eq(checklistItems.id, id)).returning();
    return updated || undefined;
  }

  async deleteChecklistItem(id: string): Promise<void> {
    await db.delete(checklistItems).where(eq(checklistItems.id, id));
  }

  // ===== WEEKLY TASKS =====
  async getWeeklyTasksByEstablishment(establishment: string): Promise<WeeklyTask[]> {
    return await db.select().from(weeklyTasks).where(eq(weeklyTasks.establishment, establishment));
  }

  async createWeeklyTask(task: InsertWeeklyTask): Promise<WeeklyTask> {
    const [created] = await db.insert(weeklyTasks).values(task).returning();
    return created;
  }

  async updateWeeklyTask(id: string, updates: Partial<InsertWeeklyTask>): Promise<WeeklyTask | undefined> {
    const [updated] = await db.update(weeklyTasks).set(updates).where(eq(weeklyTasks.id, id)).returning();
    return updated || undefined;
  }

  async deleteWeeklyTask(id: string): Promise<void> {
    await db.delete(weeklyTasks).where(eq(weeklyTasks.id, id));
  }

  // ===== TASK COMPLETIONS =====
  async getTaskCompletions(taskId: string): Promise<TaskCompletion[]> {
    return await db.select().from(taskCompletions)
      .where(eq(taskCompletions.taskId, taskId))
      .orderBy(desc(taskCompletions.completedAt));
  }

  async createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion> {
    const [created] = await db.insert(taskCompletions).values(completion).returning();
    return created;
  }

  // ===== CHAT =====
  async getChatMessagesByEstablishment(establishment: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.establishment, establishment))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  // ===== TIMELINE =====
  async getTimelineEventsByEstablishment(establishment: string): Promise<TimelineEvent[]> {
    return await db.select().from(timelineEvents)
      .where(eq(timelineEvents.establishment, establishment))
      .orderBy(desc(timelineEvents.timestamp));
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [created] = await db.insert(timelineEvents).values(event).returning();
    return created;
  }

  // ===== MENU =====
  async getMenuItemsByEstablishment(establishment: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.establishment, establishment));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  // ===== INGREDIENTS =====
  async getIngredientsByMenuItem(menuItemId: string): Promise<Ingredient[]> {
    return await db.select().from(ingredients).where(eq(ingredients.menuItemId, menuItemId));
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [created] = await db.insert(ingredients).values(ingredient).returning();
    return created;
  }

  async updateIngredient(id: string, updates: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const [updated] = await db.update(ingredients).set(updates).where(eq(ingredients.id, id)).returning();
    return updated || undefined;
  }

  async deleteIngredient(id: string): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }
}

export const storage = new DatabaseStorage();
