<script setup lang="ts">
import { computed } from "vue";
import * as icons from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    icon?: string;
  }>(),
  {
    title: "暂无内容",
    description: "",
    icon: "Inbox",
  },
);

const IconComp = computed(
  () => (icons as Record<string, unknown>)[props.icon] || icons.Inbox,
);
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center py-12 px-4">
    <component
      :is="IconComp"
      :size="48"
      :stroke-width="1.5"
      class="text-muted mb-4"
    />
    <p class="text-base font-medium text-[#e4e6eb]">{{ title }}</p>
    <p v-if="description" class="mt-1.5 text-sm text-muted max-w-sm">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
