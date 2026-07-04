<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Lock, Trash2, AlertTriangle } from "@lucide/vue";
import { useUserStore } from "@/stores/user";
import { updateMe, deleteMe } from "@/api/users";
import { setPassword, getGithubLoginUrl } from "@/api/auth";
import { useToast } from "@/composables/useToast";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import GithubIcon from "@/components/common/GithubIcon.vue";

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

// Profile form
const displayName = ref("");
const email = ref("");
const avatarUrl = ref("");
const bio = ref("");
const savingProfile = ref(false);

// Password form
const newPassword = ref("");
const confirmPassword = ref("");
const savingPassword = ref(false);

// Delete account
const showDeleteDialog = ref(false);
const deleting = ref(false);

const hasPassword = computed(() => !!userStore.user?.password_hash);

function syncFromUser() {
  const u = userStore.user;
  if (!u) return;
  displayName.value = u.display_name ?? "";
  email.value = u.email ?? "";
  avatarUrl.value = u.avatar_url ?? "";
  bio.value = u.bio ?? "";
}

watch(
  () => userStore.user,
  () => syncFromUser(),
  { immediate: true },
);

async function saveProfile() {
  savingProfile.value = true;
  try {
    const res = await updateMe({
      display_name: displayName.value,
      email: email.value,
      avatar_url: avatarUrl.value,
      bio: bio.value,
    });
    userStore.setUser(res.user);
    toast.success("资料已保存");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
  } finally {
    savingProfile.value = false;
  }
}

async function updatePassword() {
  if (newPassword.value.length < 6) {
    toast.error("密码至少需要 6 个字符");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error("两次输入的密码不一致");
    return;
  }
  savingPassword.value = true;
  try {
    await setPassword(newPassword.value);
    toast.success("密码已更新");
    newPassword.value = "";
    confirmPassword.value = "";
    await userStore.fetchUser().catch(() => {});
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "更新密码失败");
  } finally {
    savingPassword.value = false;
  }
}

function relinkGithub() {
  window.location.href = getGithubLoginUrl();
}

async function confirmDelete() {
  deleting.value = true;
  try {
    await deleteMe();
    userStore.clearUser();
    toast.success("账号已删除");
    router.push("/");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "删除账号失败");
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <div class="mx-auto max-w-3xl px-4 py-8">
        <h1 class="font-display text-2xl font-semibold text-[#e4e6eb] mb-6">
          设置
        </h1>

        <div v-if="userStore.user" class="space-y-6">
          <!-- Profile section -->
          <section
            class="bg-surface rounded-cute-lg p-6 border border-border-soft"
          >
            <h2 class="text-lg font-semibold text-[#e4e6eb] mb-4">个人资料</h2>
            <form class="space-y-4" @submit.prevent="saveProfile">
              <div class="flex items-center gap-4">
                <UserAvatar
                  :src="avatarUrl || null"
                  :name="displayName || userStore.user.github_login"
                  :size="64"
                />
                <div class="flex-1">
                  <label class="block text-xs text-muted mb-1">头像 URL</label>
                  <input
                    v-model="avatarUrl"
                    type="url"
                    placeholder="https://..."
                    class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">显示名称</label>
                <input
                  v-model="displayName"
                  type="text"
                  class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">邮箱</label>
                <input
                  v-model="email"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">个人简介</label>
                <textarea
                  v-model="bio"
                  rows="3"
                  placeholder="介绍一下自己..."
                  class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors resize-none"
                ></textarea>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="savingProfile"
                  class="inline-flex items-center px-4 py-2 rounded-cute-sm bg-primary text-white text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ savingProfile ? "保存中..." : "保存" }}
                </button>
              </div>
            </form>
          </section>

          <!-- Password section -->
          <section
            class="bg-surface rounded-cute-lg p-6 border border-border-soft"
          >
            <h2
              class="flex items-center gap-2 text-lg font-semibold text-[#e4e6eb] mb-4"
            >
              <Lock :size="18" class="text-muted" />
              {{ hasPassword ? "修改密码" : "设置密码" }}
            </h2>
            <form class="space-y-4" @submit.prevent="updatePassword">
              <div>
                <label class="block text-xs text-muted mb-1">新密码</label>
                <input
                  v-model="newPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="至少 6 个字符"
                  class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">确认密码</label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="savingPassword"
                  class="inline-flex items-center px-4 py-2 rounded-cute-sm bg-primary text-white text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ savingPassword ? "更新中..." : "更新密码" }}
                </button>
              </div>
            </form>
          </section>

          <!-- GitHub section -->
          <section
            class="bg-surface rounded-cute-lg p-6 border border-border-soft"
          >
            <h2
              class="flex items-center gap-2 text-lg font-semibold text-[#e4e6eb] mb-4"
            >
              <GithubIcon :size="18" class="text-muted" />
              GitHub 账号
            </h2>
            <div class="flex items-center gap-3 mb-4">
              <UserAvatar
                :src="userStore.user.avatar_url"
                :name="userStore.user.github_login"
                :size="48"
              />
              <div>
                <p class="text-sm text-[#e4e6eb]">
                  {{ userStore.user.github_login }}
                </p>
                <a
                  :href="`https://github.com/${userStore.user.github_login}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-muted hover:text-primary transition-colors"
                >
                  github.com/{{ userStore.user.github_login }}
                </a>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-surface-hover text-[#e4e6eb] text-sm hover:bg-border-soft transition-colors"
              @click="relinkGithub"
            >
              <GithubIcon :size="14" />
              使用 GitHub 重新登录
            </button>
          </section>

          <!-- Danger zone -->
          <section
            class="bg-surface rounded-cute-lg p-6 border border-red-500/30"
          >
            <h2
              class="flex items-center gap-2 text-lg font-semibold text-red-400 mb-4"
            >
              <AlertTriangle :size="18" />
              危险区域
            </h2>
            <p class="text-sm text-muted mb-4">
              删除账号后，所有数据将永久丢失且无法恢复。
            </p>
            <button
              type="button"
              :disabled="deleting"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="showDeleteDialog = true"
            >
              <Trash2 :size="14" />
              删除账号
            </button>
          </section>
        </div>
      </div>
    </main>
    <AppFooter />

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除账号"
      message="此操作不可撤销。删除后，你的所有文章、留言和数据将永久丢失。"
      confirm-text="确认删除"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>
