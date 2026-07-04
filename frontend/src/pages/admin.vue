<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  LayoutDashboard,
  Database,
  Terminal,
  LogOut,
  Lock,
} from "@lucide/vue";
import { adminRequest, type BasicAuth } from "@/api/client";
import { useToast } from "@/composables/useToast";
import DashboardTab from "@/components/admin/DashboardTab.vue";
import KvTab from "@/components/admin/KvTab.vue";
import SqlTab from "@/components/admin/SqlTab.vue";

const toast = useToast();

const STORAGE_KEY = "coffli-admin-auth";
const auth = ref<BasicAuth | null>(null);
const loginUsername = ref("");
const loginPassword = ref("");
const loggingIn = ref(false);
const activeTab = ref<"dashboard" | "kv" | "sql">("dashboard");

const tabs = [
  { id: "dashboard" as const, label: "仪表盘", icon: LayoutDashboard },
  { id: "kv" as const, label: "KV 管理", icon: Database },
  { id: "sql" as const, label: "SQL 执行", icon: Terminal },
];

function loadAuth() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      auth.value = JSON.parse(raw) as BasicAuth;
    }
  } catch {
    // ignore invalid stored auth
  }
}

function persistAuth() {
  if (auth.value) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth.value));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

async function onLogin() {
  if (!loginUsername.value || !loginPassword.value) {
    toast.error("请输入用户名和密码");
    return;
  }
  loggingIn.value = true;
  const candidate: BasicAuth = {
    username: loginUsername.value,
    password: loginPassword.value,
  };
  try {
    await adminRequest<{ message?: string }>("/admin/ok", {}, candidate);
    auth.value = candidate;
    persistAuth();
    toast.success("登录成功");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "登录失败");
  } finally {
    loggingIn.value = false;
  }
}

function onLogout() {
  auth.value = null;
  persistAuth();
  loginUsername.value = "";
  loginPassword.value = "";
  activeTab.value = "dashboard";
}

onMounted(() => {
  loadAuth();
});
</script>

<template>
  <div class="min-h-screen bg-[#0f1419] p-6">
    <!-- Login form -->
    <div v-if="!auth" class="flex items-center justify-center min-h-[80vh]">
      <div
        class="w-full max-w-md bg-surface rounded-cute-lg p-6 border border-border-soft shadow-soft"
      >
        <div class="flex items-center gap-2 mb-6">
          <Lock :size="20" class="text-primary" />
          <h1 class="font-display text-xl font-semibold text-[#e4e6eb]">
            Coffli 管理后台
          </h1>
        </div>
        <form class="space-y-4" @submit.prevent="onLogin">
          <div>
            <label class="block text-xs text-muted mb-1">用户名</label>
            <input
              v-model="loginUsername"
              type="text"
              autocomplete="username"
              class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs text-muted mb-1">密码</label>
            <input
              v-model="loginPassword"
              type="password"
              autocomplete="current-password"
              class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            :disabled="loggingIn"
            class="w-full bg-primary text-white rounded-cute-sm py-2 text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loggingIn ? "登录中..." : "登录" }}
          </button>
        </form>
      </div>
    </div>

    <!-- Admin panel -->
    <div v-if="auth" class="max-w-6xl mx-auto">
      <header class="flex items-center justify-between mb-6">
        <h1 class="font-display text-xl font-semibold text-[#e4e6eb]">
          Coffli 管理后台
        </h1>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cute-sm text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
          @click="onLogout"
        >
          <LogOut :size="16" />
          登出
        </button>
      </header>

      <nav class="flex gap-2 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm text-sm transition-colors',
            activeTab === tab.id
              ? 'bg-primary text-white'
              : 'bg-surface text-[#e4e6eb] hover:bg-surface-hover border border-border-soft',
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </nav>

      <div class="bg-surface rounded-cute-lg p-6 border border-border-soft">
        <DashboardTab v-if="activeTab === 'dashboard'" :auth="auth" />
        <KvTab v-else-if="activeTab === 'kv'" :auth="auth" />
        <SqlTab v-else :auth="auth" />
      </div>
    </div>
  </div>
</template>
