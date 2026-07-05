<script setup lang="ts">
import { ref, watch } from "vue";
import { useUserStore } from "@/stores/user";
import { updateMe } from "@/api/users";
import { useToast } from "@/composables/useToast";
import UserAvatar from "@/components/common/UserAvatar.vue";

const userStore = useUserStore();
const toast = useToast();

const displayName = ref("");
const bio = ref("");
const saving = ref(false);

function syncFromUser() {
  const u = userStore.user;
  if (!u) return;
  displayName.value = u.display_name ?? "";
  bio.value = u.bio ?? "";
}

watch(
  () => userStore.user,
  () => syncFromUser(),
  { immediate: true },
);

async function saveProfile() {
  saving.value = true;
  try {
    const res = await updateMe({
      display_name: displayName.value,
      bio: bio.value,
    });
    userStore.setUser(res.user);
    toast.success("资料已保存");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-[#e4e6eb] mb-3 sm:mb-4">个人资料</h2>

    <div class="flex items-center gap-4 mb-4 sm:mb-6">
      <UserAvatar
        :src="userStore.user?.avatar_url || null"
        :name="userStore.user?.display_name || userStore.user?.github_login"
        :size="64"
      />
      <div>
        <p class="text-sm text-[#e4e6eb]">
          同步于 GitHub 账号
        </p>
        <a
          :href="`https://github.com/${userStore.user?.github_login}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-muted hover:text-primary transition-colors"
        >
          github.com/{{ userStore.user?.github_login }}
        </a>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="saveProfile">
      <div>
        <label class="block text-xs text-muted mb-1">显示名称</label>
        <input
          v-model="displayName"
          type="text"
          class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs text-muted mb-1">个人简介</label>
        <textarea
          v-model="bio"
          rows="4"
          placeholder="介绍一下自己..."
          class="w-full bg-[#0f1419] rounded-cute-sm px-3 py-2 border border-border-soft text-sm text-[#e4e6eb] focus:outline-none focus:border-primary transition-colors resize-y min-h-[120px]"
        ></textarea>
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center px-4 py-2 rounded-cute-sm bg-primary text-white text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? "保存中..." : "保存" }}
        </button>
      </div>
    </form>
  </div>
</template>
