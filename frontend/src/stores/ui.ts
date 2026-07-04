import { defineStore } from "pinia";
import { ref } from "vue";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let nextId = 1;

export const useUiStore = defineStore("ui", () => {
  const toasts = ref<Toast[]>([]);

  function addToast(type: ToastType, message: string) {
    const id = nextId++;
    toasts.value.push({ id, type, message });
    setTimeout(() => removeToast(id), 3000);
  }

  function removeToast(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  }

  return { toasts, addToast, removeToast };
});
