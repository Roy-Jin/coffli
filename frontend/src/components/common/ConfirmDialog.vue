<script setup lang="ts">
import { watch, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    title: "确认操作",
    message: "",
    confirmText: "确认",
    cancelText: "取消",
    danger: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

function close() {
  emit("update:modelValue", false);
}

function onConfirm() {
  emit("confirm");
  close();
}

function onCancel() {
  emit("cancel");
  close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.modelValue) {
    onCancel();
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.addEventListener("keydown", onKeydown);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    }
  },
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        @click.self="onCancel"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          class="relative w-full max-w-md rounded-cute-lg border border-border-soft bg-surface/90 backdrop-blur-md shadow-soft-lg p-4 sm:p-6"
        >
          <h3 class="text-lg font-display font-semibold text-[#e4e6eb]">
            {{ title }}
          </h3>
          <p v-if="message" class="mt-2 text-sm text-muted leading-relaxed">
            {{ message }}
          </p>
          <div class="mt-4 sm:mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-cute-sm border border-border-soft text-[#e4e6eb] hover:bg-surface-hover transition-colors"
              @click="onCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              :class="[
                'px-4 py-2 rounded-cute-sm text-white transition-colors',
                danger
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-primary hover:bg-primary-hover',
              ]"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
