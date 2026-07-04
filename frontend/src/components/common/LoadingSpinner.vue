<script setup lang="ts">
import { Loader2 } from "@lucide/vue";

withDefaults(
  defineProps<{
    size?: number;
    color?: string;
  }>(),
  {
    size: 24,
    color: "text-primary",
  },
);
</script>

<template>
  <div class="flex items-center justify-center" role="status" aria-live="polite">
    <Loader2
      :size="size"
      :class="['animate-spin', color]"
      aria-label="加载中"
    />
  </div>
</template>
