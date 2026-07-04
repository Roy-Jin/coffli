<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { List } from "@lucide/vue";
import type { Heading } from "@/composables/useMarkdown";

defineProps<{ headings: Heading[] }>();

const activeId = ref<string>("");
let observer: IntersectionObserver | null = null;

function handleIntersect(entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      activeId.value = entry.target.id;
    }
  }
}

function scrollToHeading(event: MouseEvent, id: string) {
  event.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: "smooth" });
  activeId.value = id;
}

onMounted(() => {
  observer = new IntersectionObserver(handleIntersect, {
    rootMargin: "-80px 0px -70% 0px",
    threshold: 0,
  });
  document.querySelectorAll("h2[id], h3[id]").forEach((el) => observer!.observe(el));
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <nav
    v-if="headings.length"
    class="sticky top-20 bg-surface rounded-cute p-4 border border-border-soft"
  >
    <div class="flex items-center gap-2 mb-3 text-sm font-medium text-[#e4e6eb]">
      <List :size="16" />
      目录
    </div>
    <ul class="space-y-1.5 text-sm">
      <li v-for="h in headings" :key="h.id" :class="h.level === 3 ? 'ml-4' : ''">
        <a
          :href="`#${h.id}`"
          @click="scrollToHeading($event, h.id)"
          :class="
            activeId === h.id ? 'text-primary font-medium' : 'text-muted hover:text-primary'
          "
          class="block transition-colors"
        >
          {{ h.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>
