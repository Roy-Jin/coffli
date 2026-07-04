<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Compass, ArrowLeft } from "@lucide/vue";
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center px-4 text-center"
  >
    <Compass
      :size="72"
      :stroke-width="1.5"
      class="text-primary mb-6 animate-pulse"
    />
    <h1 class="font-display text-7xl md:text-8xl font-bold text-primary">404</h1>
    <p class="mt-4 text-lg text-[#e4e6eb]">页面未找到</p>
    <p class="mt-2 text-sm text-muted">你访问的页面不存在或已被移除</p>
    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-cute bg-primary hover:bg-primary-hover text-white transition-colors"
    >
      <ArrowLeft :size="18" />
      返回首页
    </RouterLink>
  </div>
</template>
