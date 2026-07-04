<script setup lang="ts">
import { ref, computed } from "vue";
import { Lock } from "@lucide/vue";
import { useUserStore } from "@/stores/user";
import { setPassword } from "@/api/auth";
import { useToast } from "@/composables/useToast";

const userStore = useUserStore();
const toast = useToast();

const newPassword = ref("");
const confirmPassword = ref("");
const saving = ref(false);

const hasPassword = computed(() => !!userStore.user?.password_hash);

async function updatePassword() {
  if (newPassword.value.length < 6) {
    toast.error("密码至少需要 6 个字符");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error("两次输入的密码不一致");
    return;
  }
  saving.value = true;
  try {
    await setPassword(newPassword.value);
    toast.success("密码已更新");
    newPassword.value = "";
    confirmPassword.value = "";
    await userStore.fetchUser().catch(() => {});
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "更新密码失败");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <h2 class="flex items-center gap-2 text-lg font-semibold text-[#e4e6eb] mb-4">
      <Lock :size="18" class="text-muted" />
      {{ hasPassword ? "修改密码" : "设置密码" }}
    </h2>

    <form class="space-y-4 max-w-md" @submit.prevent="updatePassword">
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
          placeholder="再次输入新密码"
          class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
        />
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center px-4 py-2 rounded-cute-sm bg-primary text-white text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? "更新中..." : "更新密码" }}
        </button>
      </div>
    </form>
  </div>
</template>
