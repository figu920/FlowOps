import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

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
  setCurrentUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useStore = create<FlowState>()(
  persist(
    (set) => ({
      currentUser: null,
      
      setCurrentUser: (user) => set({ currentUser: user }),
      
      logout: async () => {
        try {
          await api.auth.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ currentUser: null });
        }
      },
    }),
    {
      name: 'flowops-storage',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
