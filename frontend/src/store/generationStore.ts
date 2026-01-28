import { create } from 'zustand';
import { Post } from '@/types/types';

export interface GenerationRequest {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  templateId: string;
  error?: string;
  result?: Post[];
  createdAt: number;
  completedAt?: number;
}

interface GenerationState {
  queue: GenerationRequest[];
  addToQueue: (request: Omit<GenerationRequest, 'id' | 'status' | 'createdAt'>) => string;
  updateQueueItem: (id: string, updates: Partial<GenerationRequest>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  getQueueItem: (id: string) => GenerationRequest | undefined;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  queue: [],

  addToQueue: (request) => {
    const id = `gen_${Date.now()}_${Math.random()}`;
    const newRequest: GenerationRequest = {
      id,
      status: 'pending',
      createdAt: Date.now(),
      ...request,
    };
    set(state => ({
      queue: [...state.queue, newRequest],
    }));
    return id;
  },

  updateQueueItem: (id, updates) => {
    set(state => ({
      queue: state.queue.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  removeFromQueue: (id) => {
    set(state => ({
      queue: state.queue.filter(item => item.id !== id),
    }));
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  getQueueItem: (id) => {
    return get().queue.find(item => item.id === id);
  },
}));
