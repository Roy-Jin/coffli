<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Trash2, AlertTriangle } from "@lucide/vue";
import { useUserStore } from "@/stores/user";
import { deleteMe } from "@/api/users";
import { getGithubLoginUrl } from "@/api/auth";
import { useToast } from "@/composables/useToast";
import UserAvatar from "@/components/common/UserAvatar.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import GithubIcon from "@/components/common/GithubIcon.vue";

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const showDeleteDialog = ref(false);
const deleting = ref(false);

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
  <div class="space-y-8">
    <section>
      <h2 class="text-lg font-semibold text-[#e4e6eb] mb-4">GitHub 账号</h2>
      <div class="flex items-center gap-3 mb-4">
        <UserAvatar
          :src="userStore.user?.avatar_url || null"
          :name="userStore.user?.github_login"
          :size="48"
        />
        <div>
          <p class="text-sm text-[#e4e6eb]">
            {{ userStore.user?.github_login }}
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
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-surface-hover text-[#e4e6eb] text-sm hover:bg-border-soft transition-colors"
        @click="relinkGithub"
      >
        <Github :size="14" />
        使用 GitHub 重新登录
      </button>
    </section>

    <section class="pt-6 border-t border-border-soft">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-red-400 mb-4">
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
