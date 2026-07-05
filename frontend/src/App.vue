<script setup lang="ts">
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <div
      class="fixed top-0 left-0 right-0 h-0.5 z-[100] bg-primary origin-left transition-transform duration-300 ease-out"
      :class="uiStore.isRouting ? 'scale-x-100' : 'scale-x-0'"
    ></div>

    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

    <div class="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="slide-up">
        <div
          v-for="toast in uiStore.toasts"
          :key="toast.id"
          class="px-4 py-3 rounded-cute shadow-soft-lg min-w-[200px] max-w-[300px] sm:max-w-[360px] text-sm cursor-pointer pointer-events-auto"
          :class="{
            'bg-primary text-white': toast.type === 'success',
            'bg-red-500 text-white': toast.type === 'error',
            'bg-surface text-[#e4e6eb] border border-[#2a323c]': toast.type === 'info',
          }"
          @click="uiStore.removeToast(toast.id)"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
