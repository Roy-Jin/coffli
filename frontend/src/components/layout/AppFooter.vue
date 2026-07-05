<script setup lang="ts">
import { Heart } from "@lucide/vue";

const year = new Date().getFullYear();
</script>

<template>
  <footer
    class="border-t border-border-soft bg-surface/40 backdrop-blur-sm mt-auto"
  >
    <div
      class="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted"
    >
      <p class="flex items-center gap-1.5">
        <span>© {{ year }} Coffli</span>
      </p>
      <span class="hidden sm:inline text-border-soft">·</span>
      <p class="flex items-center gap-1.5">
        <span>Made with</span>
        <Heart :size="14" fill="currentColor" class="text-primary" />
        <span>by the Roy-Jin</span>
      </p>
      <span class="hidden sm:inline text-border-soft">·</span>
      <a
        href="https://github.com/Roy-Jin/Coffli"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-primary transition-colors"
      >
        GitHub
      </a>
    </div>
  </footer>
</template>
