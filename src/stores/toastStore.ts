import { create } from 'zustand';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration: number; // ms
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => string;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: ({ type, message, action, duration }) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const resolvedDuration = duration ?? (type === 'error' ? 5000 : 3000);

    const newToast: ToastItem = {
      id,
      type,
      message,
      action,
      duration: resolvedDuration,
    };

    // Max 3 toasts
    const current = get().toasts.slice(-2);
    set({ toasts: [...current, newToast] });

    if (resolvedDuration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, resolvedDuration);
    }

    return id;
  },

  dismissToast: (id: string) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
