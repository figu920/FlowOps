import { create } from 'zustand';
import { format } from 'date-fns';

export type Status = 'OK' | 'LOW' | 'OUT';
export type EquipmentStatus = 'Working' | 'Attention' | 'Broken';

export interface InventoryItem {
  id: string;
  emoji: string;
  name: string;
  status: Status;
  lastUpdated: string;
  updatedBy: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  status: EquipmentStatus;
  lastIssue?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface TaskItem {
  id: string;
  text: string;
  assignedTo: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  isMe: boolean;
  timestamp: string;
  type: 'text' | 'action';
}

export interface TimelineEvent {
  id: string;
  text: string;
  author: string;
  timestamp: string; // ISO string
  type: 'alert' | 'info' | 'success' | 'warning';
}

interface FlowState {
  currentUser: string;
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

  updateInventory: (id: string, status: Status) => void;
  updateEquipment: (id: string, status: EquipmentStatus, issueDescription?: string) => void;
  toggleChecklist: (listType: 'opening' | 'shift' | 'closing', taskId: string) => void;
  toggleTask: (taskId: string) => void;
  sendMessage: (text: string, isAction?: boolean) => void;
  addTimelineEntry: (text: string, type: TimelineEvent['type']) => void;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', emoji: '🍔', name: 'Beef Patties', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '2', emoji: '🥬', name: 'Lettuce', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '3', emoji: '🍅', name: 'Tomatoes', status: 'LOW', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '4', emoji: '🧀', name: 'Cheese Slices', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '5', emoji: '🍟', name: 'French Fries', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
  { id: '6', emoji: '🥤', name: 'Cola Syrup', status: 'OK', lastUpdated: new Date().toISOString(), updatedBy: 'System' },
];

const INITIAL_EQUIPMENT: EquipmentItem[] = [
  { id: '1', name: 'Fryer', status: 'Working' },
  { id: '2', name: 'Grill', status: 'Working' },
  { id: '3', name: 'Fridge', status: 'Attention' },
  { id: '4', name: 'Ice Machine', status: 'Working' },
  { id: '5', name: 'Dishwasher', status: 'Working' },
];

const INITIAL_CHECKLISTS = {
  opening: [
    { id: 'o1', text: 'Turn on grill', completed: false },
    { id: 'o2', text: 'Prep lettuce & tomato', completed: true, completedAt: new Date().toISOString(), completedBy: 'Bella' },
    { id: 'o3', text: 'Refill sauces', completed: false },
    { id: 'o4', text: 'Unlock fridge', completed: false },
  ],
  shift: [
    { id: 's1', text: 'Wipe tables', completed: false },
    { id: 's2', text: 'Check trash bins', completed: false },
    { id: 's3', text: 'Restock napkins', completed: false },
  ],
  closing: [
    { id: 'c1', text: 'Clean fryer knob', completed: false },
    { id: 'c2', text: 'Sweep floors', completed: false },
    { id: 'c3', text: 'Lock fridge', completed: false },
  ],
};

const INITIAL_TASKS: TaskItem[] = [
  { id: 't1', text: 'Deep clean fridge', assignedTo: 'Angel', completed: false },
  { id: 't2', text: 'Clean vents', assignedTo: 'Hunter', completed: false },
  { id: 't3', text: 'Wipe counters', assignedTo: 'Bella', completed: true },
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 'm1', text: 'Inventory arrived', sender: 'Supervisor', isMe: false, timestamp: '10:00 AM', type: 'action' },
  { id: 'm2', text: 'Can someone cover my shift tomorrow?', sender: 'Hunter', isMe: false, timestamp: '10:15 AM', type: 'text' },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { id: 'e1', text: 'Fryer reported BROKEN', author: 'Angel', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'alert' }, // 15 mins ago
  { id: 'e2', text: 'Lettuce LOW', author: 'Hunter', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: 'warning' }, // 45 mins ago
  { id: 'e3', text: 'Beef Patties OUT', author: 'Angel', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), type: 'alert' }, // 1 hour ago
  { id: 'e4', text: 'Opening checklist completed', author: 'Bella', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'success' }, // 2 hours ago
];

export const useStore = create<FlowState>((set, get) => ({
  currentUser: 'Angel', // Hardcoded for demo
  inventory: INITIAL_INVENTORY,
  equipment: INITIAL_EQUIPMENT,
  checklists: INITIAL_CHECKLISTS,
  weeklyTasks: INITIAL_TASKS,
  chat: INITIAL_CHAT,
  timeline: INITIAL_TIMELINE,

  addTimelineEntry: (text, type) => {
    const newEvent: TimelineEvent = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      author: get().currentUser,
      timestamp: new Date().toISOString(),
      type,
    };
    set((state) => ({ timeline: [newEvent, ...state.timeline] }));
  },

  updateInventory: (id, status) => {
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.id === id ? { ...item, status, lastUpdated: new Date().toISOString(), updatedBy: state.currentUser } : item
      ),
    }));

    const item = get().inventory.find((i) => i.id === id);
    if (item && (status === 'LOW' || status === 'OUT')) {
      get().addTimelineEntry(`${item.name} marked ${status}`, status === 'OUT' ? 'alert' : 'warning');
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
        get().addTimelineEntry(`${item.name} reported BROKEN: ${issueDescription || 'No description'}`, 'alert');
      } else if (status === 'Attention') {
        get().addTimelineEntry(`${item.name} needs attention`, 'warning');
      } else if (status === 'Working' && item.status !== 'Working') {
        get().addTimelineEntry(`${item.name} fixed/working`, 'success');
      }
    }
  },

  toggleChecklist: (listType, taskId) => {
    set((state) => ({
      checklists: {
        ...state.checklists,
        [listType]: state.checklists[listType].map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: !task.completed,
                completedAt: !task.completed ? new Date().toISOString() : undefined,
                completedBy: !task.completed ? state.currentUser : undefined,
              }
            : task
        ),
      },
    }));
    
    const task = get().checklists[listType].find(t => t.id === taskId);
    if (task && !task.completed) { // It was just completed
       get().addTimelineEntry(`Completed task: ${task.text}`, 'success');
    }
  },

  toggleTask: (taskId) => {
    set((state) => ({
      weeklyTasks: state.weeklyTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      ),
    }));
    
    const task = get().weeklyTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
       get().addTimelineEntry(`Weekly task done: ${task.text}`, 'success');
    }
  },

  sendMessage: (text, isAction = false) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender: get().currentUser,
      isMe: true,
      timestamp: format(new Date(), 'h:mm a'),
      type: isAction ? 'action' : 'text',
    };
    set((state) => ({ chat: [...state.chat, newMsg] }));
  },
}));
