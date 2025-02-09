import { v4 as uuid } from 'uuid';
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware"

interface Notification {
  id: string;
  message: string;
}

interface NotificationStore {
  notificationList: Notification[];
  addNotification: (message: string) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set) => ({
    notificationList: [],
    addNotification: (message) => {
      const id = uuid();
      set((state) => ({
        notificationList: [{ id, message }, ...state.notificationList],
      }));
    },
    removeNotification: (id) =>
      set((state) => ({
        notificationList: state.notificationList.filter(
          (n) => n.id !== id
        ),
      })),
  }))
);
