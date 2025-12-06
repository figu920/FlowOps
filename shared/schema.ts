import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============ USERS ============
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('employee'), // 'employee' | 'lead' | 'manager' | 'admin'
  status: text("status").notNull().default('pending'), // 'active' | 'pending' | 'removed'
  establishment: text("establishment").notNull(), // 'Bison Den' | 'Trailblazer Café' | 'Global'
  phoneNumber: text("phone_number"),
  isSystemAdmin: boolean("is_system_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============ INVENTORY ============
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emoji: text("emoji").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  status: text("status").notNull().default('OK'), // 'OK' | 'LOW' | 'OUT'
  establishment: text("establishment").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: text("updated_by").notNull(),
  lowComment: text("low_comment"),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// ============ EQUIPMENT ============
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category"),
  status: text("status").notNull().default('Working'), // 'Working' | 'Attention' | 'Broken'
  establishment: text("establishment").notNull(),
  lastIssue: text("last_issue"),
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
});

export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;

// ============ CHECKLIST ITEMS ============
export const checklistItems = pgTable("checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  listType: text("list_type").notNull(), // 'opening' | 'shift' | 'closing'
  establishment: text("establishment").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by"),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({
  id: true,
});

export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;

// ============ WEEKLY TASKS ============
export const weeklyTasks = pgTable("weekly_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  establishment: text("establishment").notNull(),
  assignedTo: text("assigned_to").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const insertWeeklyTaskSchema = createInsertSchema(weeklyTasks).omit({
  id: true,
});

export type InsertWeeklyTask = z.infer<typeof insertWeeklyTaskSchema>;
export type WeeklyTask = typeof weeklyTasks.$inferSelect;

// ============ TASK COMPLETIONS (History) ============
export const taskCompletions = pgTable("task_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => weeklyTasks.id, { onDelete: 'cascade' }),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  completedBy: text("completed_by").notNull(),
  photo: text("photo").notNull(),
});

export const insertTaskCompletionSchema = createInsertSchema(taskCompletions).omit({
  id: true,
  completedAt: true,
});

export type InsertTaskCompletion = z.infer<typeof insertTaskCompletionSchema>;
export type TaskCompletion = typeof taskCompletions.$inferSelect;

// ============ CHAT MESSAGES ============
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  establishment: text("establishment").notNull(),
  sender: text("sender").notNull(),
  senderRole: text("sender_role").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull().default('text'), // 'text' | 'action'
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// ============ TIMELINE EVENTS ============
export const timelineEvents = pgTable("timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  establishment: text("establishment").notNull(),
  author: text("author").notNull(),
  authorRole: text("author_role").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // 'alert' | 'info' | 'success' | 'warning'
  comment: text("comment"),
  photo: text("photo"),
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;

// ============ MENU ITEMS ============
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  establishment: text("establishment").notNull(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// ============ INGREDIENTS ============
export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(), // 'grams' | 'oz' | 'cups' | 'bowls' | 'tablespoons' | 'pieces'
  notes: text("notes"),
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

// ============ NOTIFICATIONS ============
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'user_registration' | 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedUserId: varchar("related_user_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
