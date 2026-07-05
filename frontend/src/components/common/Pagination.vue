<script setup lang="ts">
import { computed } from "vue";
import { ChevronLeft, ChevronRight } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    total: number;
    page: number;
    pageSize?: number;
  }>(),
  {
    pageSize: 10,
  },
);

const emit = defineEmits<{
  "update:page": [page: number];
}>();

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize)),
);

type PageItem = number | "...";

const items = computed<PageItem[]>(() => {
  const total = totalPages.value;
  const cur = props.page;
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const list: PageItem[] = [1];

  let start = cur - 1;
  let end = cur + 1;

  if (cur <= 3) {
    start = 2;
    end = 4;
  }
  if (cur >= total - 2) {
    start = total - 3;
    end = total - 1;
  }

  if (start > 2) list.push("...");
  for (let i = start; i <= end; i++) {
    if (i > 1 && i < total) list.push(i);
  }
  if (end < total - 1) list.push("...");

  list.push(total);
  return list;
});

function go(p: number) {
  if (p < 1 || p > totalPages.value || p === props.page) return;
  emit("update:page", p);
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-1 sm:gap-1.5 select-none"
    aria-label="pagination"
  >
    <button
      type="button"
      class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-cute-sm border border-border-soft text-[#e4e6eb] hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      :disabled="page <= 1"
      aria-label="上一页"
      @click="go(page - 1)"
    >
      <ChevronLeft :size="16" />
    </button>

    <template v-for="(item, idx) in items" :key="idx">
      <span
        v-if="item === '...'"
        class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-muted text-sm"
        >...</span
      >
      <button
        v-else
        type="button"
        :class="[
          'inline-flex items-center justify-center min-w-8 h-8 sm:min-w-9 sm:h-9 px-2 rounded-cute-sm text-sm border transition-colors',
          item === page
            ? 'bg-primary text-white border-primary'
            : 'border-border-soft text-[#e4e6eb] hover:bg-surface-hover',
        ]"
        @click="go(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-cute-sm border border-border-soft text-[#e4e6eb] hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      :disabled="page >= totalPages"
      aria-label="下一页"
      @click="go(page + 1)"
    >
      <ChevronRight :size="16" />
    </button>
  </nav>
</template>
