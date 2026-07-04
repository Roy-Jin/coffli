<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import { User, Lock } from "@lucide/vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import GithubIcon from "@/components/common/GithubIcon.vue";

const route = useRoute();

const nav = [
  { path: "/settings", label: "个人资料", icon: User },
  { path: "/settings/password", label: "修改密码", icon: Lock },
  { path: "/settings/account", label: "账号管理", icon: GithubIcon },
];
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <div class="mx-auto max-w-5xl px-4 py-8">
        <h1 class="font-display text-2xl font-semibold text-[#e4e6eb] mb-6">
          设置
        </h1>

        <div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <!-- Settings sidebar -->
          <nav class="space-y-1">
            <RouterLink
              v-for="item in nav"
              :key="item.path"
              :to="item.path"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-cute-sm text-sm transition-colors',
                route.path === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-[#e4e6eb] hover:bg-surface-hover',
              ]"
            >
              <component :is="item.icon" :size="16" />
              {{ item.label }}
            </RouterLink>
          </nav>

          <!-- Settings content -->
          <div class="bg-surface rounded-cute-lg p-6 border border-border-soft">
            <RouterView />
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<route>
{
  "meta": { "requireAuth": true }
}
</route>
