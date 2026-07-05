<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { Eye, EyeOff, ArrowLeft, Coffee } from "@lucide/vue";
import { loginWithPassword, getGithubLoginUrl } from "@/api/auth";
import { useUserStore } from "@/stores/user";
import { useToast } from "@/composables/useToast";
import { ApiError } from "@/api/client";
import GithubIcon from "@/components/common/GithubIcon.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);

function onGithubLogin() {
  window.location.href = getGithubLoginUrl();
}

async function onPasswordLogin() {
  if (!username.value.trim() || !password.value) {
    toast.error("请输入用户名和密码");
    return;
  }
  submitting.value = true;
  try {
    const res = await loginWithPassword(username.value.trim(), password.value);
    userStore.setUser(res.user);
    toast.success("登录成功");
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.replace(redirect);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "登录失败，请重试";
    toast.error(message);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    router.replace("/");
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
    <div
      class="bg-surface rounded-cute-lg p-6 sm:p-8 shadow-soft-lg border border-border-soft max-w-md w-full"
    >
      <!-- Logo + Title -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-14 h-14 rounded-cute bg-primary/15 mb-4"
        >
          <Coffee :size="28" class="text-primary" />
        </div>
        <h1 class="font-display text-2xl font-bold text-[#e4e6eb]">
          登录到 Coffli
        </h1>
      </div>

      <!-- GitHub login -->
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-cute bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
        @click="onGithubLogin"
      >
        <GithubIcon :size="20" />
        使用 GitHub 登录
      </button>
      <p class="mt-2 text-center text-xs text-muted">
        首次使用 GitHub 登录将自动注册账号
      </p>

      <!-- Divider -->
      <div class="flex items-center gap-3 my-6">
        <div class="flex-1 h-px bg-border-soft"></div>
        <span class="text-sm text-muted">或</span>
        <div class="flex-1 h-px bg-border-soft"></div>
      </div>

      <!-- Password form -->
      <form class="space-y-4" @submit.prevent="onPasswordLogin">
        <div>
          <label class="block text-sm text-[#e4e6eb] mb-1.5" for="username">
            用户名
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="输入用户名"
            class="w-full px-3 py-2.5 rounded-cute bg-[#0f1419] border border-border-soft text-sm text-[#e4e6eb] placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label class="block text-sm text-[#e4e6eb] mb-1.5" for="password">
            密码
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="输入密码"
              class="w-full px-3 py-2.5 pr-10 rounded-cute bg-[#0f1419] border border-border-soft text-sm text-[#e4e6eb] placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-[#e4e6eb] transition-colors"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
        </div>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full px-4 py-2.5 rounded-cute bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {{ submitting ? "登录中..." : "登录" }}
        </button>
      </form>

      <!-- Back home -->
      <div class="mt-6 text-center">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft :size="14" />
          返回首页
        </RouterLink>
      </div>
    </div>
  </div>
</template>
