import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

export type Status = 'OK' | 'LOW' | 'OUT';
export type EquipmentStatus = 'Working' | 'Attention' | 'Broken';
export type UserRole = 'manager' | 'lead' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // In a real app this would be hashed on backend
  avatar?: string;
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

export interface TaskItem {
  id: string;
  text: string;
  assignedTo: string; // User Name
  completed: boolean;
  notes?: string;
  completedAt?: string;
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

  // Auth Actions
  login: (email: string, password: string) => boolean;
  logout: () => void;
  
  // User Management (Manager Only)
  addUser: (name: string, email: string, role: UserRole, password: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

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
  toggleTask: (taskId: string) => void;
  addWeeklyTask: (text: string, assignedTo: string, notes?: string) => void;
  deleteWeeklyTask: (taskId: string) => void;

  // Other Actions
  sendMessage: (text: string, isAction?: boolean) => void;
  addTimelineEntry: (text: string, type: TimelineEvent['type'], comment?: string) => void;
}

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Angel', email: 'manager', role: 'manager', password: '123' },
  { id: 'u2', name: 'Hunter', email: 'lead', role: 'lead', password: '123' },
  { id: 'u3', name: 'Bella', email: 'employee', role: 'employee', password: '123' },
  { id: 'u4', name: 'Sam', email: 'sam', role: 'employee', password: '123' },
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
  { id: 't1', text: 'Deep clean fridge', assignedTo: 'Angel', completed: false, notes: 'Use the heavy duty cleaner' },
  { id: 't2', text: 'Clean vents', assignedTo: 'Hunter', completed: false },
  { id: 't3', text: 'Wipe counters', assignedTo: 'Bella', completed: true, completedAt: new Date().toISOString() },
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

      login: (email, password) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
          set({ currentUser: user });
          get().addTimelineEntry(`User logged in: ${user.name}`, 'info');
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      addUser: (name, email, role, password) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager' && currentUser?.role !== 'lead') return;

        // Leads can only add employees
        if (currentUser.role === 'lead' && role !== 'employee') return;

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          role,
          password
        };
        set(state => ({ users: [...state.users, newUser] }));
        get().addTimelineEntry(`New user added: ${name} (${role})`, 'info');
      },

      updateUser: (id, updates) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'manager' && currentUser?.role !== 'lead') return;
        
        // Leads cannot promote/demote or edit roles
        if (currentUser.role === 'lead' && updates.role) delete updates.role;

        set(state => ({
          users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
        }));
        get().addTimelineEntry(`User updated: ${updates.name || 'User'}`, 'info');
      },

      deleteUser: (id) => {
         const { currentUser } = get();
         if (currentUser?.role !== 'manager') return;

         const userToDelete = get().users.find(u => u.id === id);
         set(state => ({ users: state.users.filter(u => u.id !== id) }));
         
         if (userToDelete) {
           get().addTimelineEntry(`User deleted: ${userToDelete.name}`, 'warning');
         }
      },

      addTimelineEntry: (text, type, comment) => {
        const { currentUser } = get();
        const newEvent: TimelineEvent = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          author: currentUser?.name || 'System',
          role: currentUser?.role || 'employee',
          timestamp: new Date().toISOString(),
          type,
          comment
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
      toggleTask: (taskId) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set((state) => ({
          weeklyTasks: state.weeklyTasks.map((task) =>
            task.id === taskId
              ? { 
                  ...task, 
                  completed: !task.completed,
                  completedAt: !task.completed ? new Date().toISOString() : undefined
                }
              : task
          ),
        }));
        
        const task = get().weeklyTasks.find(t => t.id === taskId);
        if (task && !task.completed) {
           get().addTimelineEntry(`Weekly task completed: ${task.text} by ${currentUser.name}`, 'success');
        }
      },

      addWeeklyTask: (text, assignedTo, notes) => {
        const newTask: TaskItem = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          assignedTo,
          completed: false,
          notes
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
      name: 'flowops-storage', // unique name
      partialize: (state) => ({ 
        inventory: state.inventory,
        equipment: state.equipment,
        checklists: state.checklists,
        weeklyTasks: state.weeklyTasks,
        chat: state.chat,
        timeline: state.timeline,
        users: state.users, // Persist users so new ones are saved
        // Don't persist currentUser to force login
      }),
    }
  )
);
