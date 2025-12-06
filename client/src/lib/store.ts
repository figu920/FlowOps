import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

export type Status = 'OK' | 'LOW' | 'OUT';
export type EquipmentStatus = 'Working' | 'Attention' | 'Broken';
export type UserRole = 'manager' | 'lead' | 'employee';
export type UserStatus = 'active' | 'pending' | 'removed';
export type Establishment = 'Bison Den' | 'Trailblazer Café';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  establishment: Establishment;
  password?: string;
  phoneNumber?: string;
}

export interface InventoryItem {
  id: string;
  emoji: string;
  name: string;
  category?: string;
  status: Status;
  lastUpdated: string;
  updatedBy: string;
  lowComment?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category?: string;
  status: EquipmentStatus;
  lastIssue?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  assignedTo?: string; // User Name
  notes?: string;
}

export interface TaskCompletion {
  id: string;
  completedAt: string;
  completedBy: string;
  photo: string;
}

export interface TaskItem {
  id: string;
  text: string;
  assignedTo: string; // User Name
  completed: boolean;
  notes?: string;
  completedAt?: string;
  history: TaskCompletion[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  role: UserRole;
  isMe: boolean;
  timestamp: string;
  type: 'text' | 'action';
}

export interface TimelineEvent {
  id: string;
  text: string;
  author: string;
  role: UserRole;
  timestamp: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  comment?: string;
  photo?: string;
}

export type MeasurementUnit = 'grams' | 'oz' | 'cups' | 'bowls' | 'tablespoons' | 'pieces';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  ingredients: Ingredient[];
}

interface FlowState {
  currentUser: User | null;
  users: User[];
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  checklists: {
    opening: ChecklistItem[];
    shift: ChecklistItem[];
    closing: ChecklistItem[];
  };
  weeklyTasks: TaskItem[];
  chat: ChatMessage[];
  timeline: TimelineEvent[];
  menu: MenuItem[]; 

  // Auth Actions
  login: (usernameOrEmail: string, password: string) => { success: boolean; message?: string };
  register: (user: Omit<User, 'id' | 'role' | 'status'>) => void;
  logout: () => void;
  
  // User Management (Manager Only)
  approveUser: (userId: string, role: UserRole) => void;
  rejectUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  removeUser: (userId: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void; // General update

  // Inventory Actions
  updateInventory: (id: string, status: Status, comment?: string) => void;
  addInventoryItem: (name: string, emoji: string, category?: string) => void;
  deleteInventoryItem: (id: string) => void;

  // Equipment Actions
  updateEquipment: (id: string, status: EquipmentStatus, issueDescription?: string) => void;
  addEquipmentItem: (name: string, category?: string) => void;
  deleteEquipmentItem: (id: string) => void;

  // Checklist Actions
  toggleChecklist: (listType: 'opening' | 'shift' | 'closing', taskId: string) => void;
  addChecklistItem: (listType: 'opening' | 'shift' | 'closing', text: string, assignedTo: string, notes?: string) => void;
  deleteChecklistItem: (listType: 'opening' | 'shift' | 'closing', taskId: string) => void;

  // Task Actions
  completeTask: (taskId: string, photo: string) => void;
  undoTaskCompletion: (taskId: string) => void;
  addWeeklyTask: (text: string, assignedTo: string, notes?: string) => void;
  deleteWeeklyTask: (taskId: string) => void;

  // Menu Actions
  addMenuItem: (name: string, category: string) => void;
  deleteMenuItem: (id: string) => void;
  addIngredient: (menuItemId: string, name: string, quantity: number, unit: MeasurementUnit, notes?: string) => void;
  updateIngredient: (menuItemId: string, ingredientId: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (menuItemId: string, ingredientId: string) => void;

  // Other Actions
  sendMessage: (text: string, isAction?: boolean) => void;
  addTimelineEntry: (text: string, type: TimelineEvent['type'], comment?: string, photo?: string) => void;
}

// Initial Admin User (The Manager)
const INITIAL_USERS: User[] = [
  { 
    id: 'admin1', 
    name: 'Admin Manager', 
    email: 'admin@flowops.com', 
    username: 'admin', 
    role: 'manager', 
    status: 'active', 
    establishment: 'Bison Den', 
    password: 'password123' 
  }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', emoji: '🍔', name: 'Beef Patties', category: 'Food', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '2', emoji: '🥬', name: 'Lettuce', category: 'Food', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '3', emoji: '🍅', name: 'Tomatoes', category: 'Food', status: 'LOW', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '4', emoji: '🧀', name: 'Cheese Slices', category: 'Food', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '5', emoji: '🍟', name: 'French Fries', category: 'Food', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '6', emoji: '🥤', name: 'Cola Syrup', category: 'Drink', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
];

const INITIAL_EQUIPMENT: EquipmentItem[] = [
  { id: '1', name: 'Fryer', category: 'Kitchen', status: 'Working' },
  { id: '2', name: 'Grill', category: 'Kitchen', status: 'Working' },
  { id: '3', name: 'Fridge', category: 'Kitchen', status: 'Attention' },
  { id: '4', name: 'Ice Machine', category: 'Bar', status: 'Working' },
  { id: '5', name: 'Dishwasher', category: 'Kitchen', status: 'Working' },
];

const INITIAL_CHECKLISTS = {
  opening: [
    { id: 'o1', text: 'Turn on grill', completed: false, assignedTo: 'Hunter' },
    { id: 'o2', text: 'Prep lettuce & tomato', completed: true, completedAt: new Date().toISOString(), completedBy: 'Bella', assignedTo: 'Bella' },
    { id: 'o3', text: 'Refill sauces', completed: false, assignedTo: 'Sam' },
    { id: 'o4', text: 'Unlock fridge', completed: false, assignedTo: 'Angel' },
  ],
  shift: [
    { id: 's1', text: 'Wipe tables', completed: false, assignedTo: 'Bella' },
    { id: 's2', text: 'Check trash bins', completed: false, assignedTo: 'Sam' },
    { id: 's3', text: 'Restock napkins', completed: false, assignedTo: 'Hunter' },
  ],
  closing: [
    { id: 'c1', text: 'Clean fryer knob', completed: false, assignedTo: 'Angel' },
    { id: 'c2', text: 'Sweep floors', completed: false, assignedTo: 'Sam' },
    { id: 'c3', text: 'Lock fridge', completed: false, assignedTo: 'Hunter' },
  ],
};

const INITIAL_TASKS: TaskItem[] = [
  { id: 't1', text: 'Deep clean fridge', assignedTo: 'Angel', completed: false, notes: 'Use the heavy duty cleaner', history: [] },
  { id: 't2', text: 'Clean vents', assignedTo: 'Hunter', completed: false, history: [] },
  { id: 't3', text: 'Wipe counters', assignedTo: 'Bella', completed: true, completedAt: new Date().toISOString(), history: [] },
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 'm1', text: 'Inventory arrived', sender: 'Angel', role: 'manager', isMe: false, timestamp: '10:00 AM', type: 'action' },
  { id: 'm2', text: 'Can someone cover my shift tomorrow?', sender: 'Hunter', role: 'lead', isMe: false, timestamp: '10:15 AM', type: 'text' },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { id: 'e1', text: 'Fryer reported BROKEN', author: 'Angel', role: 'manager', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'alert' },
  { id: 'e2', text: 'Lettuce LOW', author: 'Hunter', role: 'lead', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: 'warning' },
  { id: 'e3', text: 'Beef Patties OUT', author: 'Angel', role: 'manager', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), type: 'alert' },
  { id: 'e4', text: 'Opening checklist completed', author: 'Bella', role: 'employee', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'success' },
];

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Honkytonk Burger',
    category: 'Burgers',
    ingredients: [
      { id: 'i1', name: 'Beef Patty', quantity: 120, unit: 'grams' },
      { id: 'i2', name: 'Bun', quantity: 1, unit: 'pieces' },
      { id: 'i3', name: 'Lettuce', quantity: 15, unit: 'grams' },
      { id: 'i4', name: 'Tomato', quantity: 10, unit: 'grams' },
      { id: 'i5', name: 'Sauce', quantity: 1, unit: 'tablespoons' },
    ]
  },
  {
    id: 'm2',
    name: 'Bites on Bites',
    category: 'Appetizers',
    ingredients: [
      { id: 'i6', name: 'Bites', quantity: 1, unit: 'bowls', notes: 'Fill to the top' },
      { id: 'i7', name: 'Sauce', quantity: 0.5, unit: 'cups' },
    ]
  },
  {
    id: 'm3',
    name: 'Wings',
    category: 'Appetizers',
    ingredients: [
      { id: 'i8', name: 'Wings', quantity: 6, unit: 'pieces', notes: 'Standard portion' },
      { id: 'i9', name: 'Sauce', quantity: 2, unit: 'oz' },
    ]
  }
];

export const useStore = create<FlowState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: INITIAL_USERS,
      inventory: INITIAL_INVENTORY,
      equipment: INITIAL_EQUIPMENT,
      checklists: INITIAL_CHECKLISTS,
      weeklyTasks: INITIAL_TASKS,
      chat: INITIAL_CHAT,
      timeline: INITIAL_TIMELINE,
      menu: INITIAL_MENU,

      login: (usernameOrEmail, password) => {
        const user = get().users.find(u => 
          (u.email.toLowerCase() === usernameOrEmail.toLowerCase() || u.username.toLowerCase() === usernameOrEmail.toLowerCase()) && 
          u.password === password
        );

        if (!user) {
          return { success: false, message: 'Invalid credentials' };
        }

        if (user.status === 'pending') {
          return { success: false, message: 'Your account is pending approval from your Manager.' };
        }

        if (user.status === 'removed') {
          return { success: false, message: 'This account has been deactivated.' };
        }

        set({ currentUser: user });
        get().addTimelineEntry(`User logged in: ${user.name}`, 'info');
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null });
      },

      register: (userData) => {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          ...userData,
          role: 'employee', // Default role, pending approval
          status: 'pending'
        };
        set(state => ({ users: [...state.users, newUser] }));
        // Note: No timeline entry yet as they aren't approved
      },

      approveUser: (userId, role) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;

        set(state => ({
          users: state.users.map(u => 
            u.id === userId 
              ? { ...u, status: 'active', role } 
              : u
          )
        }));
        
        const approvedUser = get().users.find(u => u.id === userId);
        if (approvedUser) {
           get().addTimelineEntry(`User approved: ${approvedUser.name} as ${role}`, 'success');
        }
      },

      rejectUser: (userId) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;
        set(state => ({ users: state.users.filter(u => u.id !== userId) }));
      },

      updateUserRole: (userId, role) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;

        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, role } : u)
        }));
        
        const updatedUser = get().users.find(u => u.id === userId);
        if (updatedUser) {
           get().addTimelineEntry(`Role updated for ${updatedUser.name} to ${role}`, 'info');
        }
      },

      removeUser: (userId) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;

        const user = get().users.find(u => u.id === userId);
        if (user) {
          set(state => ({ 
             users: state.users.map(u => u.id === userId ? { ...u, status: 'removed' } : u)
          }));
          get().addTimelineEntry(`User deactivated: ${user.name}`, 'warning');
        }
      },

      updateUser: (id, updates) => {
         const { currentUser } = get();
         // Only managers can update other users. Users can't update themselves in this mockup yet.
         if (currentUser?.role !== 'manager') return;

         set(state => ({
           users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
         }));
      },

      addTimelineEntry: (text, type, comment, photo) => {
        const { currentUser } = get();
        const newEvent: TimelineEvent = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          author: currentUser?.name || 'System',
          role: currentUser?.role || 'employee',
          timestamp: new Date().toISOString(),
          type,
          comment,
          photo
        };
        set((state) => ({ timeline: [newEvent, ...state.timeline] }));
      },

      updateInventory: (id, status, comment) => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === id ? { 
              ...item, 
              status, 
              lastUpdated: new Date().toISOString(), 
              updatedBy: currentUser.name,
              lowComment: comment 
            } : item
          ),
        }));

        const item = get().inventory.find((i) => i.id === id);
        if (item && (status === 'LOW' || status === 'OUT')) {
          const text = `${item.name} marked ${status}`;
          get().addTimelineEntry(text, status === 'OUT' ? 'alert' : 'warning', comment);
        }
      },

      addInventoryItem: (name, emoji, category) => {
        const newItem: InventoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          emoji,
          category,
          status: 'OK',
          lastUpdated: new Date().toISOString(),
          updatedBy: get().currentUser?.name || 'Unknown'
        };
        set(state => ({ inventory: [...state.inventory, newItem] }));
        get().addTimelineEntry(`Added new item: ${name}`, 'info');
      },

      deleteInventoryItem: (id) => {
        const item = get().inventory.find(i => i.id === id);
        if (item) {
          set(state => ({ inventory: state.inventory.filter(i => i.id !== id) }));
          get().addTimelineEntry(`Deleted item: ${item.name}`, 'warning');
        }
      },

      updateEquipment: (id, status, issueDescription) => {
        set((state) => ({
          equipment: state.equipment.map((item) =>
            item.id === id ? { ...item, status, lastIssue: issueDescription } : item
          ),
        }));

        const item = get().equipment.find((i) => i.id === id);
        if (item) {
          if (status === 'Broken') {
            get().addTimelineEntry(`${item.name} reported BROKEN`, 'alert', issueDescription);
          } else if (status === 'Attention') {
            get().addTimelineEntry(`${item.name} needs attention`, 'warning');
          } else if (status === 'Working' && item.status !== 'Working') {
            get().addTimelineEntry(`${item.name} fixed/working`, 'success');
          }
        }
      },

      addEquipmentItem: (name, category) => {
        const newItem: EquipmentItem = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          category,
          status: 'Working'
        };
        set(state => ({ equipment: [...state.equipment, newItem] }));
        get().addTimelineEntry(`Added new equipment: ${name}`, 'info');
      },

      deleteEquipmentItem: (id) => {
        const item = get().equipment.find(i => i.id === id);
        if (item) {
          set(state => ({ equipment: state.equipment.filter(i => i.id !== id) }));
          get().addTimelineEntry(`Deleted equipment: ${item.name}`, 'warning');
        }
      },

      // CHECKLIST ACTIONS
      toggleChecklist: (listType, taskId) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set((state) => ({
          checklists: {
            ...state.checklists,
            [listType]: state.checklists[listType].map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    completed: !task.completed,
                    completedAt: !task.completed ? new Date().toISOString() : undefined,
                    completedBy: !task.completed ? currentUser.name : undefined,
                  }
                : task
            ),
          },
        }));
        
        const task = get().checklists[listType].find(t => t.id === taskId);
        if (task && !task.completed) {
           get().addTimelineEntry(`${listType} Checklist: ${task.text} completed`, 'success');
        }
      },

      addChecklistItem: (listType, text, assignedTo, notes) => {
        const newItem: ChecklistItem = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          completed: false,
          assignedTo,
          notes
        };
        
        set(state => ({
          checklists: {
            ...state.checklists,
            [listType]: [...state.checklists[listType], newItem]
          }
        }));
        
        get().addTimelineEntry(`New ${listType} item: ${text} (Assigned to ${assignedTo})`, 'info');
      },

      deleteChecklistItem: (listType, taskId) => {
        const task = get().checklists[listType].find(t => t.id === taskId);
        if (task) {
          set(state => ({
            checklists: {
              ...state.checklists,
              [listType]: state.checklists[listType].filter(t => t.id !== taskId)
            }
          }));
          get().addTimelineEntry(`Deleted ${listType} item: ${task.text}`, 'warning');
        }
      },

      // TASK ACTIONS
      completeTask: (taskId, photo) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const completion: TaskCompletion = {
          id: Math.random().toString(36).substr(2, 9),
          completedAt: new Date().toISOString(),
          completedBy: currentUser.name,
          photo
        };

        set((state) => ({
          weeklyTasks: state.weeklyTasks.map((task) =>
            task.id === taskId
              ? { 
                  ...task, 
                  completed: true,
                  completedAt: completion.completedAt,
                  history: [completion, ...(task.history || [])] // Prepend new completion
                }
              : task
          ),
        }));
        
        const task = get().weeklyTasks.find(t => t.id === taskId);
        if (task) {
           get().addTimelineEntry(`Weekly task completed: ${task.text} by ${currentUser.name}`, 'success', 'Photo proof attached', photo);
        }
      },

      undoTaskCompletion: (taskId) => {
        const { currentUser } = get();
        if (!currentUser || currentUser.role === 'employee') return; // Only managers/leads

        set((state) => ({
          weeklyTasks: state.weeklyTasks.map((task) =>
            task.id === taskId
              ? { 
                  ...task, 
                  completed: false,
                  completedAt: undefined
                }
              : task
          ),
        }));
      },

      addWeeklyTask: (text, assignedTo, notes) => {
        const newTask: TaskItem = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          assignedTo,
          completed: false,
          notes,
          history: []
        };
        
        set(state => ({ weeklyTasks: [...state.weeklyTasks, newTask] }));
        get().addTimelineEntry(`New Weekly Task: ${text} (Assigned to ${assignedTo})`, 'info');
      },

      deleteWeeklyTask: (taskId) => {
        const task = get().weeklyTasks.find(t => t.id === taskId);
        if (task) {
          set(state => ({ weeklyTasks: state.weeklyTasks.filter(t => t.id !== taskId) }));
          get().addTimelineEntry(`Deleted Weekly Task: ${task.text}`, 'warning');
        }
      },

      // MENU ACTIONS
      addMenuItem: (name, category) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;

        const newItem: MenuItem = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          category,
          ingredients: []
        };
        set(state => ({ menu: [...state.menu, newItem] }));
        get().addTimelineEntry(`Menu Item Added: ${name}`, 'info');
      },

      deleteMenuItem: (id) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;
        
        const item = get().menu.find(i => i.id === id);
        if (item) {
          set(state => ({ menu: state.menu.filter(i => i.id !== id) }));
          get().addTimelineEntry(`Menu Item Deleted: ${item.name}`, 'warning');
        }
      },

      addIngredient: (menuItemId, name, quantity, unit, notes) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;

        const newIngredient: Ingredient = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          quantity,
          unit,
          notes
        };

        set(state => ({
          menu: state.menu.map(item => 
            item.id === menuItemId 
              ? { ...item, ingredients: [...item.ingredients, newIngredient] }
              : item
          )
        }));
      },

      updateIngredient: (menuItemId, ingredientId, updates) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;
        
        const menuItem = get().menu.find(m => m.id === menuItemId);
        const ingredient = menuItem?.ingredients.find(i => i.id === ingredientId);

        if (menuItem && ingredient) {
          set(state => ({
            menu: state.menu.map(item => 
              item.id === menuItemId
                ? {
                    ...item,
                    ingredients: item.ingredients.map(ing => 
                      ing.id === ingredientId ? { ...ing, ...updates } : ing
                    )
                  }
                : item
            )
          }));

          // Log change if quantity or unit changed
          if (updates.quantity !== undefined || updates.unit !== undefined) {
             const changeText = `${ingredient.name} (${ingredient.quantity}${ingredient.unit} → ${updates.quantity ?? ingredient.quantity}${updates.unit ?? ingredient.unit})`;
             get().addTimelineEntry(`Portion size updated: ${menuItem.name}`, 'info', changeText);
          }
        }
      },

      deleteIngredient: (menuItemId, ingredientId) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager') return;

        set(state => ({
          menu: state.menu.map(item => 
            item.id === menuItemId
              ? { ...item, ingredients: item.ingredients.filter(ing => ing.id !== ingredientId) }
              : item
          )
        }));
      },

      sendMessage: (text, isAction = false) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          sender: currentUser.name,
          role: currentUser.role,
          isMe: true,
          timestamp: format(new Date(), 'h:mm a'),
          type: isAction ? 'action' : 'text',
        };
        set((state) => ({ chat: [...state.chat, newMsg] }));
      },
    }),
    {
      name: 'flowops-storage-v2', // Updated to clear old demo data
      partialize: (state) => ({ 
        inventory: state.inventory,
        equipment: state.equipment,
        checklists: state.checklists,
        weeklyTasks: state.weeklyTasks,
        chat: state.chat,
        timeline: state.timeline,
        users: state.users, 
        menu: state.menu, 
      }),
    }
  )
);
