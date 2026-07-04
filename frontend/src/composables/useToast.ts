import { useUiStore, type ToastType } from "@/stores/ui";

export function useToast() {
  const ui = useUiStore();

  function success(message: string) {
    ui.addToast("success", message);
  }

  function error(message: string) {
    ui.addToast("error", message);
  }

  function info(message: string) {
    ui.addToast("info", message);
  }

  function show(type: ToastType, message: string) {
    ui.addToast(type, message);
  }

  return { success, error, info, show };
}
