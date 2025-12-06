import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
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
  insertIngredientSchema
} from "@shared/schema";
import { z } from "zod";

const SALT_ROUNDS = 10;

// Helper to get current user from session
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

// Helper to check if user is system admin (has global access)
// Only the isSystemAdmin flag grants system admin privileges - NOT the role
function isSystemAdminUser(user: SessionUser | undefined): boolean {
  return user?.isSystemAdmin === true;
}

// Helper to check if user can manage (manager or system admin)
function canManageUsers(user: SessionUser | undefined): boolean {
  return user?.role === 'manager' || isSystemAdminUser(user);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== AUTH ROUTES ====================
  
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
      
      // Create user with pending status
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        status: 'pending',
        role: 'employee'
      });
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { usernameOrEmail, password } = req.body;
      
      if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: "Username/email and password are required" });
      }
      
      // Check username or email
      let user = await storage.getUserByUsername(usernameOrEmail);
      if (!user) {
        user = await storage.getUserByEmail(usernameOrEmail);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if user is approved
      if (user.status === 'pending') {
        return res.status(403).json({ message: "Your account is pending approval from your Manager." });
      }
      
      if (user.status === 'removed') {
        return res.status(403).json({ message: "This account has been deactivated." });
      }
      
      // Set session
      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
        establishment: user.establishment,
        isSystemAdmin: user.isSystemAdmin
      };
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // ==================== USER MANAGEMENT ====================
  
  // Get all users for an establishment (filtered by role)
  // System admin is NEVER exposed in this list
  app.get("/api/users", async (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    let users;
    if (isSystemAdminUser(req.session.user)) {
      // System admin sees all users from all establishments
      users = await storage.getAllUsers();
    } else {
      users = await storage.getUsersByEstablishment(req.session.user.establishment);
    }
    
    // Filter out system admin accounts from the response - they should never appear in UI
    const filteredUsers = users.filter(u => !u.isSystemAdmin);
    const usersWithoutPasswords = filteredUsers.map(({ password, ...user }) => user);
    
    res.json(usersWithoutPasswords);
  });
  
  // Get pending users (managers or system admin)
  app.get("/api/users/pending", async (req: Request, res: Response) => {
    if (!req.session.user || !canManageUsers(req.session.user)) {
      return res.status(403).json({ message: "Only managers can view pending users" });
    }
    
    let pendingUsers;
    if (isSystemAdminUser(req.session.user)) {
      // System admin sees pending users from all establishments
      pendingUsers = await storage.getAllPendingUsersGlobal();
    } else {
      pendingUsers = await storage.getAllPendingUsers(req.session.user.establishment);
    }
    
    // Filter out system admin accounts
    const filteredUsers = pendingUsers.filter(u => !u.isSystemAdmin);
    const usersWithoutPasswords = filteredUsers.map(({ password, ...user }) => user);
    
    res.json(usersWithoutPasswords);
  });
  
  // Approve user (managers or system admin)
  app.post("/api/users/:id/approve", async (req: Request, res: Response) => {
    if (!req.session.user || !canManageUsers(req.session.user)) {
      return res.status(403).json({ message: "Only managers can approve users" });
    }
    
    const { role } = req.body;
    // Only allow standard roles - admin role cannot be assigned through approval
    // The isSystemAdmin flag is the only way to grant system admin privileges
    const allowedRoles = ['employee', 'lead', 'manager'];
    
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Valid role is required" });
    }
    
    const user = await storage.updateUser(req.params.id, { status: 'active', role });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Log to timeline
    await storage.createTimelineEvent({
      text: `User approved: ${user.name} as ${role}`,
      establishment: user.establishment,
      author: req.session.user.name,
      authorRole: req.session.user.role,
      type: 'success'
    });
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Reject user (managers or system admin)
  app.delete("/api/users/:id/reject", async (req: Request, res: Response) => {
    if (!req.session.user || !canManageUsers(req.session.user)) {
      return res.status(403).json({ message: "Only managers can reject users" });
    }
    
    const targetUser = await storage.getUser(req.params.id);
    if (targetUser?.isSystemAdmin) {
      return res.status(403).json({ message: "This account cannot be modified" });
    }
    
    await storage.updateUser(req.params.id, { status: 'removed' });
    res.json({ message: "User rejected" });
  });
  
  // Update user (managers, leads for employees, or system admin for anyone)
  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const targetUser = await storage.getUser(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // System admin accounts cannot be modified by anyone (including other system admins)
    if (targetUser.isSystemAdmin && !req.session.user.isSystemAdmin) {
      return res.status(403).json({ message: "This account cannot be modified" });
    }
    
    // Only system admin can modify their own account
    if (targetUser.isSystemAdmin && req.session.user.id !== targetUser.id) {
      return res.status(403).json({ message: "This account cannot be modified" });
    }
    
    // Check permissions
    const isSysAdmin = isSystemAdminUser(req.session.user);
    const isManager = req.session.user.role === 'manager';
    const isLead = req.session.user.role === 'lead' && targetUser.role === 'employee';
    
    if (!isSysAdmin && !isManager && !isLead) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    // Only managers and system admin can change roles
    if (req.body.role && !isManager && !isSysAdmin) {
      return res.status(403).json({ message: "Only managers can change roles" });
    }
    
    // Prevent changing isSystemAdmin flag
    if ('isSystemAdmin' in req.body) {
      delete req.body.isSystemAdmin;
    }
    
    const updatedUser = await storage.updateUser(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Log role changes
    if (req.body.role && req.body.role !== targetUser.role) {
      await storage.createTimelineEvent({
        text: `Role updated for ${updatedUser.name} to ${req.body.role}`,
        establishment: updatedUser.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: 'info'
      });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  });
  
  // Remove user (managers or system admin, but never system admin accounts)
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    if (!req.session.user || !canManageUsers(req.session.user)) {
      return res.status(403).json({ message: "Only managers can remove users" });
    }
    
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // System admin accounts cannot be deleted
    if (user.isSystemAdmin) {
      return res.status(403).json({ message: "This account cannot be deleted" });
    }
    
    await storage.updateUser(req.params.id, { status: 'removed' });
    
    await storage.createTimelineEvent({
      text: `User deactivated: ${user.name}`,
      establishment: user.establishment,
      author: req.session.user.name,
      authorRole: req.session.user.role,
      type: 'warning'
    });
    
    res.json({ message: "User deactivated" });
  });
  
  // ==================== INVENTORY ====================
  
  app.get("/api/inventory", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    let items;
    if (isSystemAdminUser(req.session.user)) {
      items = await storage.getAllInventory();
    } else {
      items = await storage.getInventoryByEstablishment(req.session.user.establishment);
    }
    res.json(items);
  });
  
  app.post("/api/inventory", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      // System admin can specify any establishment, regular users use their own
      const establishment = isSystemAdminUser(req.session.user) && req.body.establishment 
        ? req.body.establishment 
        : req.session.user.establishment;
      
      const data = insertInventorySchema.parse({
        ...req.body,
        establishment,
        updatedBy: req.session.user.name
      });
      const item = await storage.createInventoryItem(data);
      
      await storage.createTimelineEvent({
        text: `Added new item: ${item.name}`,
        establishment: item.establishment,
        author: req.session.user.name,
        authorRole: req.session.user.role,
        type: 'info'
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });
  
  app.patch("/api/inventory/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const item = await storage.updateInventoryItem(req.params.id, {
      ...req.body,
      lastUpdated: new Date(),
      updatedBy: req.session.user.name
    });
    
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    // Log status changes
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
  
  app.delete("/api/inventory/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
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
      // System admin can specify any establishment, regular users use their own
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
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
      // System admin can specify any establishment, regular users use their own
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });
  
  app.patch("/api/checklists/:id", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    const updates = { ...req.body };
    
    // If completing a task
    if (updates.completed === true && !updates.completedBy) {
      updates.completedBy = req.session.user.name;
      updates.completedAt = new Date();
    }
    
    const item = await storage.updateChecklistItem(req.params.id, updates);
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    // Log completions
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
    res.json(tasks);
  });
  
  app.post("/api/tasks", async (req: Request, res: Response) => {
    if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      // System admin can specify any establishment, regular users use their own
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
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
  
  // Task completions (for history/photo proof)
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
      
      // Mark task as completed
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
      // System admin can specify any establishment, regular users use their own
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
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
      // System admin can specify any establishment, regular users use their own
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
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
    
    // Include ingredients for each menu item
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
      // System admin can specify any establishment, regular users use their own
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create menu item" });
    }
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
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

  return httpServer;
}
