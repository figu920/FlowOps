import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { 
  insertUserSchema, 
  insertInventorySchema,
  insertEquipmentSchema,
  insertChecklistItemSchema,
  insertWeeklyTaskSchema,
  insertTaskCompletionSchema,
  insertChatMessageSchema,
  insertTimelineEventSchema,
  insertMenuItemSchema,
  insertIngredientSchema,
  sales,              
  insertSaleSchema
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, asc, sql } from "drizzle-orm";
import { users, inventory, equipment, checklistItems, weeklyTasks, taskCompletions, chatMessages, timelineEvents, menuItems, ingredients, notifications } from "@shared/schema";

const SALT_ROUNDS = 10;

interface SessionUser {
  id: string;
  name: string;
  role: string;
  establishment: string;
  isSystemAdmin: boolean;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}

function isSystemAdminUser(user: SessionUser | undefined): boolean {
  return user?.isSystemAdmin === true;
}

function canManageUsers(user: SessionUser | undefined): boolean {
  return user?.role === 'manager' || isSystemAdminUser(user);
}

export async function registerRoutes(app: Express): Promise<void> {

  // ==================== AUTH ROUTES ====================
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedData.username);
      const existingEmail = await storage.getUserByEmail(validatedData.email);

      if (existingUser) return res.status(400).json({ message: "Username already exists" });
      if (existingEmail) return res.status(400).json({ message: "Email already exists" });

      const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        status: 'pending',
        role: 'employee'
      });

      try {
        const systemAdmins = await storage.getSystemAdmins();
        for (const admin of systemAdmins) {
          await storage.createNotification({
            recipientId: admin.id,
            type: 'user_registration',
            title: 'New User Registration',
            message: `${user.name} (${user.username}) requested access`,
            relatedUserId: user.id,
            isRead: false
          });
        }
      } catch {}

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { usernameOrEmail, password } = req.body;
      if (!usernameOrEmail || !password) return res.status(400).json({ message: "Username/email and password required" });

      let user = await storage.getUserByUsername(usernameOrEmail.trim());
      if (!user) user = await storage.getUserByEmail(usernameOrEmail.trim());
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return res.status(401).json({ message: "Invalid credentials" });

      if (user.status === 'pending') return res.status(403).json({ message: "Account pending approval" });
      if (user.status === 'removed') return res.status(403).json({ message: "Account deactivated" });

      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
        establishment: user.establishment,
        isSystemAdmin: user.isSystemAdmin
      };

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ message: "Logged out successfully" }));
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // ==================== USERS MANAGEMENT ====================
  const APPROVAL_HIERARCHY: Record<string, string[]> = {
    admin: ['manager'],
    manager: ['supervisor'],
    supervisor: ['lead'],
    lead: ['employee'],
    employee: []
  };

  // List all users
  app.get("/api/users", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    let query = db.select().from(users);
    if (!req.session.user.isSystemAdmin && req.session.user.role !== 'admin') {
      query.where(eq(users.establishment, req.session.user.establishment));
    }
    const allUsers = await query;
    res.json(allUsers.map(({ password, ...u }) => u));
  });

  // List pending users
  app.get("/api/users/pending", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    const currentUserRole = req.session.user.role;
    const currentEst = req.session.user.establishment;

    const conditions = [eq(users.status, 'pending')];
    if (!req.session.user.isSystemAdmin && currentUserRole !== 'admin') {
      conditions.push(eq(users.establishment, currentEst));
    }

    const pendingUsers = await db.select().from(users).where(and(...conditions));
    const rolesICanApprove = APPROVAL_HIERARCHY[req.session.user.role] || [];
    const filteredUsers = pendingUsers.filter(u => rolesICanApprove.includes(u.role));
    res.json(filteredUsers);
  });

  // Approve user
  app.post("/api/users/:id/approve", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    const [targetUser] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (!targetUser) return res.status(404).send("User not found");

    const rolesICanApprove = APPROVAL_HIERARCHY[req.session.user.role] || [];
    if (!rolesICanApprove.includes(targetUser.role)) return res.status(403).json({ message: "Cannot approve this user" });

    if (!req.session.user.isSystemAdmin && req.session.user.role !== 'admin') {
      if (targetUser.establishment !== req.session.user.establishment) return res.status(403).json({ message: "Cannot approve users from another establishment" });
    }

    await db.update(users).set({ status: 'active' }).where(eq(users.id, targetUser.id));
    await storage.createTimelineEvent({
      text: `Approved ${targetUser.name} as ${targetUser.role}`,
      establishment: targetUser.establishment,
      author: req.session.user.name,
      authorRole: req.session.user.role,
      type: 'success'
    });

    res.json({ message: "User approved" });
  });

  // Reject user
  app.delete("/api/users/:id/reject", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    const [targetUser] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (!targetUser) return res.status(404).send("User not found");

    const rolesICanApprove = APPROVAL_HIERARCHY[req.session.user.role] || [];
    if (!rolesICanApprove.includes(targetUser.role)) return res.status(403).json({ message: "Cannot reject this user" });

    await db.update(users).set({ status: 'removed' }).where(eq(users.id, targetUser.id));
    res.json({ message: "User rejected" });
  });

  // ==================== INVENTORY ====================
  app.get("/api/inventory", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    let query = db.select().from(inventory);
    if (!req.session.user.isSystemAdmin && req.session.user.role !== 'admin') {
      query.where(eq(inventory.establishment, req.session.user.establishment));
    }
    query.orderBy(asc(inventory.name));
    const items = await query;
    res.json(items);
  });

  app.post("/api/inventory", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    try {
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment
        ? req.body.establishment
        : req.session.user.establishment;

      const data = insertInventorySchema.parse({ ...req.body, establishment, updatedBy: req.session.user.name });
      const item = await storage.createInventoryItem(data);
      await storage.createTimelineEvent({ text: `Added new item: ${item.name}`, establishment: item.establishment, author: req.session.user.name, authorRole: req.session.user.role, type: 'info' });

      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    const item = await storage.updateInventoryItem(req.params.id, { ...req.body, lastUpdated: new Date(), updatedBy: req.session.user.name });
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    // Log status changes logic restored
    if (req.body.status && (req.body.status === 'LOW' || req.body.status === 'OUT')) {
      await storage.createTimelineEvent({
        text: `${item.name} marked ${req.body.status}`,
        establishment: req.session.user.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: req.body.status === 'OUT' ? 'alert' : 'warning',
        comment: req.body.lowComment
      });
    }

    res.json(item);
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    await storage.deleteInventoryItem(req.params.id);
    res.json({ message: "Inventory item deleted" });
  });

  // ==================== EQUIPMENT ====================
  app.get("/api/equipment", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    let items;
    if (isSystemAdminUser(req.session.user)) {
      items = await storage.getAllEquipment();
    } else {
      items = await storage.getEquipmentByEstablishment(req.session.user.establishment);
    }
    res.json(items);
  });
  
  app.post("/api/equipment", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment 
        ? req.body.establishment 
        : req.session.user.establishment;
      
      const data = insertEquipmentSchema.parse({
        ...req.body,
        establishment
      });
      const item = await storage.createEquipmentItem(data);
      
      await storage.createTimelineEvent({
        text: `Added new equipment: ${item.name}`,
        establishment: item.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: 'info'
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create equipment item" });
    }
  });
  
  app.patch("/api/equipment/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const item = await storage.updateEquipmentItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    // Log status changes
    if (req.body.status) {
      if (req.body.status === 'Broken') {
        await storage.createTimelineEvent({
          text: `${item.name} reported BROKEN`,
          establishment: req.session.user.establishment,
          author: req.session.user.name,
          authorRole: req.session.user.role,
          type: 'alert',
          comment: req.body.lastIssue
        });
      } else if (req.body.status === 'Attention') {
        await storage.createTimelineEvent({
          text: `${item.name} needs attention`,
          establishment: req.session.user.establishment,
          author: req.session.user.name,
          authorRole: req.session.user.role,
          type: 'warning'
        });
      } else if (req.body.status === 'Working') {
        await storage.createTimelineEvent({
          text: `${item.name} fixed/working`,
          establishment: req.session.user.establishment,
          author: req.session.user.name,
          authorRole: req.session.user.role,
          type: 'success'
        });
      }
    }
    
    res.json(item);
  });
  
  app.delete("/api/equipment/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    await storage.deleteEquipmentItem(req.params.id);
    res.json({ message: "Equipment item deleted" });
  });

  // ==================== CHECKLISTS ====================
  app.get("/api/checklists", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const listType = req.query.listType as string | undefined;
    let items;
    if (isSystemAdminUser(req.session.user)) {
      items = await storage.getAllChecklistItems(listType);
    } else {
      items = await storage.getChecklistItemsByEstablishment(req.session.user.establishment, listType);
    }
    res.json(items);
  });
  
  app.post("/api/checklists", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment 
        ? req.body.establishment 
        : req.session.user.establishment;
      
      const data = insertChecklistItemSchema.parse({
        ...req.body,
        establishment
      });
      const item = await storage.createChecklistItem(data);
      
      await storage.createTimelineEvent({
        text: `New ${data.listType} item: ${item.text} (Assigned to ${item.assignedTo})`,
        establishment: item.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: 'info'
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });
  
  app.patch("/api/checklists/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const updates = { ...req.body };
    
    if (updates.completed === true && !updates.completedBy) {
      updates.completedBy = req.session.user.name;
      updates.completedAt = new Date();
    }
    
    const item = await storage.updateChecklistItem(req.params.id, updates);
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    if (updates.completed === true) {
      await storage.createTimelineEvent({
        text: `${item.listType} Checklist: ${item.text} completed`,
        establishment: req.session.user.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: 'success'
      });
    }
    
    res.json(item);
  });
  
  app.delete("/api/checklists/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    await storage.deleteChecklistItem(req.params.id);
    res.json({ message: "Checklist item deleted" });
  });

  // ==================== WEEKLY TASKS ====================
  app.get("/api/tasks", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    
    let tasks;
    if (isSystemAdminUser(req.session.user)) {
      tasks = await storage.getAllWeeklyTasks();
    } else {
      tasks = await storage.getWeeklyTasksByEstablishment(req.session.user.establishment);
    }

    // --- NUEVO CÓDIGO: BUSCAMOS EL HISTORIAL PARA CADA TAREA ---
    const tasksWithHistory = await Promise.all(tasks.map(async (task) => {
      // Usamos la función que ya existe en tu storage para buscar completados
      const history = await storage.getTaskCompletions(task.id);
      return { ...task, history }; // Devolvemos la tarea + su historial
    }));

    res.json(tasksWithHistory);
  });
  
  app.post("/api/tasks", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment 
        ? req.body.establishment 
        : req.session.user.establishment;
      
      const data = insertWeeklyTaskSchema.parse({
        ...req.body,
        establishment
      });
      const task = await storage.createWeeklyTask(data);
      
      await storage.createTimelineEvent({
        text: `New Weekly Task: ${task.text} (Assigned to ${task.assignedTo})`,
        establishment: task.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: 'info'
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const updates = { ...req.body };
    
    if (updates.completed === true) {
      updates.completedAt = new Date();
    }
    
    const task = await storage.updateWeeklyTask(req.params.id, updates);
    if (!task) return res.status(404).json({ message: "Task not found" });
    
    res.json(task);
  });
  
  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    await storage.deleteWeeklyTask(req.params.id);
    res.json({ message: "Task deleted" });
  });

  // ==================== TASK COMPLETIONS ====================
  app.post("/api/tasks/:id/complete", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { photo } = req.body;
      if (!photo) {
        return res.status(400).json({ message: "Photo is required" });
      }
      
      const completion = await storage.createTaskCompletion({
        taskId: req.params.id,
        completedBy: req.session.user.name,
        photo
      });
      
      const task = await storage.updateWeeklyTask(req.params.id, { 
        completed: true,
        completedAt: new Date()
      });
      
      if (task) {
        await storage.createTimelineEvent({
          text: `Weekly task completed: ${task.text} by ${req.session.user.name}`,
          establishment: req.session.user.establishment,
          author: req.session.user.name,
          authorRole: req.session.user.role,
          type: 'success',
          comment: 'Photo proof attached',
          photo
        });
      }
      
      res.status(201).json(completion);
    } catch (error) {
      console.error("Task completion error:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });
  
  app.get("/api/tasks/:id/completions", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const completions = await storage.getTaskCompletions(req.params.id);
    res.json(completions);
  });

  // ==================== CHAT ====================
  app.get("/api/chat", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    let messages;
    if (isSystemAdminUser(req.session.user)) {
      messages = await storage.getAllChatMessages();
    } else {
      messages = await storage.getChatMessagesByEstablishment(req.session.user.establishment);
    }
    res.json(messages);
  });
  
  app.post("/api/chat", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment 
        ? req.body.establishment 
        : req.session.user.establishment;
      
      const data = insertChatMessageSchema.parse({
        ...req.body,
        establishment,
        sender: req.session.user.name,
        senderRole: req.session.user.role
      });
      const message = await storage.createChatMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ==================== TIMELINE ====================
  app.get("/api/timeline", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    let events;
    if (isSystemAdminUser(req.session.user)) {
      events = await storage.getAllTimelineEvents();
    } else {
      events = await storage.getTimelineEventsByEstablishment(req.session.user.establishment);
    }
    res.json(events);
  });
  
  app.post("/api/timeline", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment 
        ? req.body.establishment 
        : req.session.user.establishment;
      
      const data = insertTimelineEventSchema.parse({
        ...req.body,
        establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role
      });
      const event = await storage.createTimelineEvent(data);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create timeline event" });
    }
  });

  // ==================== MENU ====================
  app.get("/api/menu", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    let items;
    if (isSystemAdminUser(req.session.user)) {
      items = await storage.getAllMenuItems();
    } else {
      items = await storage.getMenuItemsByEstablishment(req.session.user.establishment);
    }
    
    const itemsWithIngredients = await Promise.all(
      items.map(async (item) => {
        const ingredients = await storage.getIngredientsByMenuItem(item.id);
        return { ...item, ingredients };
      })
    );
    
    res.json(itemsWithIngredients);
  });
  
  app.post("/api/menu", async (req: Request, res: Response) => {
    if (!req.session.user || (!isSystemAdminUser(req.session.user) && req.session.user.role !== 'manager')) {
      return res.status(403).json({ message: "Only managers can add menu items" });
    }
    try {
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment 
        ? req.body.establishment 
        : req.session.user.establishment;
      
      const data = insertMenuItemSchema.parse({
        ...req.body,
        establishment
      });
      const item = await storage.createMenuItem(data);
      
      await storage.createTimelineEvent({
        text: `Menu Item Added: ${item.name}`,
        establishment: item.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: 'info'
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });
  
  app.patch("/api/menu/:id", async (req: Request, res: Response) => {
    if (!req.session.user || (!isSystemAdminUser(req.session.user) && req.session.user.role !== 'manager')) {
      return res.status(403).json({ message: "Only managers can update menu items" });
    }
    const { name, category } = req.body;
    const updates: { name?: string; category?: string } = {};
    if (name) updates.name = name;
    if (category) updates.category = category;
    
    const item = await storage.updateMenuItem(req.params.id, updates);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  });
  
  app.delete("/api/menu/:id", async (req: Request, res: Response) => {
    if (!req.session.user || (!isSystemAdminUser(req.session.user) && req.session.user.role !== 'manager')) {
      return res.status(403).json({ message: "Only managers can delete menu items" });
    }
    await storage.deleteMenuItem(req.params.id);
    res.json({ message: "Menu item deleted" });
  });

  // ==================== INGREDIENTS ====================
  app.post("/api/menu/:menuItemId/ingredients", async (req: Request, res: Response) => {
    if (!req.session.user || (!isSystemAdminUser(req.session.user) && req.session.user.role !== 'manager')) {
      return res.status(403).json({ message: "Only managers can add ingredients" });
    }
    try {
      const data = insertIngredientSchema.parse({
        ...req.body,
        menuItemId: req.params.menuItemId
      });
      const ingredient = await storage.createIngredient(data);
      res.status(201).json(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create ingredient" });
    }
  });
  
  app.patch("/api/ingredients/:id", async (req: Request, res: Response) => {
    if (!req.session.user || (!isSystemAdminUser(req.session.user) && req.session.user.role !== 'manager')) {
      return res.status(403).json({ message: "Only managers can update ingredients" });
    }
    const ingredient = await storage.updateIngredient(req.params.id, req.body);
    if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });
    res.json(ingredient);
  });
  
  app.delete("/api/ingredients/:id", async (req: Request, res: Response) => {
    if (!req.session.user || (!isSystemAdminUser(req.session.user) && req.session.user.role !== 'manager')) {
      return res.status(403).json({ message: "Only managers can delete ingredients" });
    }
    await storage.deleteIngredient(req.params.id);
    res.json({ message: "Ingredient deleted" });
  });

  // ==================== NOTIFICATIONS ====================
  app.get("/api/notifications", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const notifications = await storage.getNotificationsByRecipient(req.session.user.id);
    res.json(notifications);
  });
  
  app.get("/api/notifications/count", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const count = await storage.getUnreadNotificationCount(req.session.user.id);
    res.json({ count });
  });
  
  app.post("/api/notifications/:id/read", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const notification = await storage.markNotificationAsRead(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  });
  
  app.post("/api/notifications/read-all", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    await storage.markAllNotificationsAsRead(req.session.user.id);
    res.json({ message: "All notifications marked as read" });
  });

  // ==================== ADMIN & DB STATUS ====================
  // Create user directly (Admin only)
  app.post("/api/users/create", async (req: Request, res: Response) => {
    if (!req.session.user || !isSystemAdminUser(req.session.user)) {
      return res.status(403).json({ message: "Only system admin can create users directly" });
    }
    
    try {
      const { username, email, name, password, role, establishment } = req.body;
      
      if (!username || !email || !name || !password || !role || !establishment) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      const existingEmail = await storage.getUserByEmail(email);
      
      if (existingUser) return res.status(400).json({ message: "Username already exists" });
      if (existingEmail) return res.status(400).json({ message: "Email already exists" });
      
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      const user = await storage.createUser({
        username,
        email,
        name,
        password: hashedPassword,
        role,
        establishment,
        status: 'active',
        isSystemAdmin: false
      });
      
      await storage.createTimelineEvent({
        text: `User created by Admin: ${user.name} as ${role}`,
        establishment: user.establishment,
        author: req.session.user.name,
        authorRole: 'admin',
        type: 'success'
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin Seed
  app.post("/api/admin/seed", async (req: Request, res: Response) => {
    const user = req.session.user;
    if (!user || !isSystemAdminUser(user)) {
      return res.status(403).json({ message: "Only system admins can trigger seeding" });
    }
    
    try {
      const { bootstrapSystemAdmin } = await import('./bootstrap');
      await bootstrapSystemAdmin();
      res.json({ message: "Seeding completed successfully" });
    } catch (error) {
      console.error("Seeding error:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // DB Status
  app.get("/api/admin/db-status", async (req: Request, res: Response) => {
    const user = req.session.user;
    if (!user || !isSystemAdminUser(user)) {
      return res.status(403).json({ message: "Only system admins can check database status" });
    }
    
    try {
      const inventoryCount = (await storage.getAllInventory()).length;
      const equipmentCount = (await storage.getAllEquipment()).length;
      const usersCount = (await storage.getAllUsers()).length;
      const checklistsCount = (await storage.getAllChecklistItems()).length;
      const tasksCount = (await storage.getAllWeeklyTasks()).length;
      const menuCount = (await storage.getAllMenuItems()).length;
      
      res.json({
        inventory: inventoryCount,
        equipment: equipmentCount,
        users: usersCount,
        checklists: checklistsCount,
        tasks: tasksCount,
        menu: menuCount,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      console.error("DB status error:", error);
      res.status(500).json({ message: "Failed to get database status" });
    }
  });
 
 
  // ==================== SALES & STOCK DEDUCTION ====================
  app.get("/api/sales", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    // Historial de ventas (últimas 50)
    const salesHistory = await db.select().from(sales).orderBy(sql`${sales.date} DESC`).limit(50);
    res.json(salesHistory);
  });

  app.post("/api/sales", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // 1. Guardar la venta
      const saleData = insertSaleSchema.parse({
        ...req.body,
        establishment: req.session.user.establishment
      });
      
      const [newSale] = await db.insert(sales).values(saleData).returning();

      // 2. 🧙‍♂️ MAGIA: Descontar ingredientes del Inventario
      if (saleData.menuItemId) {
        // Buscamos la receta del plato vendido
        const recipe = await db.select()
          .from(ingredients)
          .where(eq(ingredients.menuItemId, saleData.menuItemId));

        // Recorremos cada ingrediente y restamos
        for (const ing of recipe) {
          if (ing.inventoryItemId) {
            // Cantidad a restar = (Lo que lleva el plato * Platos vendidos)
            const amountUsed = ing.quantity * saleData.quantitySold;

            // Ejecutamos la resta directa en base de datos
            await db.execute(
              sql`UPDATE inventory 
                  SET quantity = quantity - ${amountUsed}, 
                      last_updated = NOW() 
                  WHERE id = ${ing.inventoryItemId}`
            );
          }
        }
      }

      res.status(201).json(newSale);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to record sale" });
    }
  });
}