<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Trash2 } from "@lucide/vue";
import { getGuestbook, deleteMessage } from "@/api/guestbook";
import { useUserStore } from "@/stores/user";
import { useToast } from "@/composables/useToast";
import { formatRelative } from "@/utils/format";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import GuestbookForm from "./GuestbookForm.vue";
import type { GuestbookMessage } from "@/types/api";

const props = defineProps<{
  username: string;
}>();

const userStore = useUserStore();
const toast = useToast();

const messages = ref<GuestbookMessage[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const replyToId = ref<number | null>(null);

const topLevelMessages = computed(() =>
  messages.value.filter((m) => m.parent_id === null),
);

function repliesOf(id: number): GuestbookMessage[] {
  return messages.value.filter((m) => m.parent_id === id);
}

function canDelete(msg: GuestbookMessage): boolean {
  if (!userStore.user) return false;
  if (userStore.isAdmin) return true;
  if (msg.author_id === userStore.user.id) return true;
  if (msg.owner_id === userStore.user.id) return true;
  return false;
}

async function loadMessages() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getGuestbook(props.username);
    messages.value = res.messages;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载留言失败";
  } finally {
    loading.value = false;
  }
}

function handleSubmitted(updated: GuestbookMessage[]) {
  messages.value = updated;
  replyToId.value = null;
}

function handleCancel() {
  replyToId.value = null;
}

function toggleReply(id: number) {
  replyToId.value = replyToId.value === id ? null : id;
}

async function handleDelete(id: number) {
  if (!window.confirm("确定要删除这条留言吗？")) return;
  try {
    await deleteMessage(id);
    toast.success("删除成功");
    await loadMessages();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "删除失败");
  }
}

onMounted(() => {
  loadMessages();
});
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-[#e4e6eb] mb-3 sm:mb-4">
      {{ messages.length }} 条留言
    </h3>

    <GuestbookForm :username="username" @submitted="handleSubmitted" />

    <div v-if="loading" class="mt-4 sm:mt-6 flex justify-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mt-4 sm:mt-6">
      <div class="text-red-400 text-sm mb-3">{{ error }}</div>
      <button
        class="bg-surface-hover text-[#e4e6eb] rounded-cute-sm px-4 py-2 text-sm hover:opacity-80 transition-opacity"
        @click="loadMessages"
      >
        重试
      </button>
    </div>

    <div v-else-if="topLevelMessages.length === 0" class="mt-4 sm:mt-6">
      <EmptyState title="还没有留言" description="快来留下第一条祝福吧" icon="Mail" />
    </div>

    <div v-else class="mt-3 sm:mt-4 divide-y divide-border-soft">
      <div
        v-for="msg in topLevelMessages"
        :key="msg.id"
        class="flex gap-2.5 sm:gap-3 py-3 sm:py-4"
      >
        <UserAvatar
          :src="msg.author.avatar_url"
          :name="msg.author.github_login"
          :size="40"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 text-sm">
            <router-link
              :to="`/user/${msg.author.github_login}`"
              class="font-medium text-[#e4e6eb] hover:text-primary transition-colors"
            >
              {{ msg.author.display_name || msg.author.github_login }}
            </router-link>
            <span class="text-muted text-xs">{{ formatRelative(msg.created_at) }}</span>
          </div>

          <div class="mt-1 text-sm text-[#e4e6eb] whitespace-pre-wrap break-words">
            {{ msg.content }}
          </div>

          <div
            v-if="userStore.isLoggedIn"
            class="mt-2 flex items-center gap-4 text-xs"
          >
            <button
              class="text-muted hover:text-primary transition-colors"
              @click="toggleReply(msg.id)"
            >
              回复
            </button>
            <button
              v-if="canDelete(msg)"
              class="text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
              @click="handleDelete(msg.id)"
            >
              <Trash2 class="w-3.5 h-3.5" />
              删除
            </button>
          </div>

          <div v-if="replyToId === msg.id" class="mt-3">
            <GuestbookForm
              :username="username"
              :parent-id="msg.id"
              placeholder="写下你的回复..."
              @submitted="handleSubmitted"
              @cancel="handleCancel"
            />
          </div>

          <div
            v-if="repliesOf(msg.id).length > 0"
            class="mt-2 border-l border-border-soft pl-3 ml-0.5 sm:pl-4 sm:ml-1 space-y-0"
          >
            <div
              v-for="reply in repliesOf(msg.id)"
              :key="reply.id"
              class="flex gap-2.5 sm:gap-3 py-2.5 sm:py-3"
            >
              <UserAvatar
                :src="reply.author.avatar_url"
                :name="reply.author.github_login"
                :size="32"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 text-sm">
                  <router-link
                    :to="`/user/${reply.author.github_login}`"
                    class="font-medium text-[#e4e6eb] hover:text-primary transition-colors"
                  >
                    {{ reply.author.display_name || reply.author.github_login }}
                  </router-link>
                  <span class="text-muted text-xs">{{ formatRelative(reply.created_at) }}</span>
                </div>
                <div class="mt-1 text-sm text-[#e4e6eb] whitespace-pre-wrap break-words">
                  {{ reply.content }}
                </div>
                <div
                  v-if="userStore.isLoggedIn && canDelete(reply)"
                  class="mt-2 flex items-center gap-4 text-xs"
                >
                  <button
                    class="text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
                    @click="handleDelete(reply.id)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
