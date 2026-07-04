<script setup lang="ts">
import { ref, computed } from "vue";
import { MessageSquare, Trash2 } from "@lucide/vue";
import { useUserStore } from "@/stores/user";
import { formatRelative } from "@/utils/format";
import UserAvatar from "@/components/common/UserAvatar.vue";
import CommentForm from "./CommentForm.vue";
import type { Comment } from "@/types/api";

defineOptions({ name: "CommentItem" });

const props = defineProps<{
  comment: Comment;
  slug: string;
  comments: Comment[];
}>();

const emit = defineEmits<{
  reply: [comment: Comment];
  deleted: [id: number];
  submitted: [comments: Comment[]];
}>();

const userStore = useUserStore();

const showReplyForm = ref(false);

const replies = computed(() =>
  props.comments.filter((c) => c.parent_id === props.comment.id),
);

const canDelete = computed(() => {
  if (!userStore.user) return false;
  return userStore.user.id === props.comment.user_id || userStore.isAdmin;
});

function toggleReply() {
  showReplyForm.value = !showReplyForm.value;
  if (showReplyForm.value) {
    emit("reply", props.comment);
  }
}

function handleReplySubmitted(comments: Comment[]) {
  showReplyForm.value = false;
  emit("submitted", comments);
}

function handleReplyCancel() {
  showReplyForm.value = false;
}

function handleDelete() {
  if (!window.confirm("确定要删除这条评论吗？")) return;
  emit("deleted", props.comment.id);
}
</script>

<template>
  <div class="flex gap-3 py-4">
    <UserAvatar
      :src="comment.author.avatar_url"
      :name="comment.author.github_login"
      :size="40"
    />
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 text-sm">
        <router-link
          :to="`/${comment.author.github_login}`"
          class="font-medium text-[#e4e6eb] hover:text-primary transition-colors"
        >
          {{ comment.author.display_name || comment.author.github_login }}
        </router-link>
        <span class="text-muted text-xs">{{ formatRelative(comment.created_at) }}</span>
      </div>

      <div class="mt-1 text-sm text-[#e4e6eb] whitespace-pre-wrap break-words">
        {{ comment.content }}
      </div>

      <div
        v-if="userStore.isLoggedIn"
        class="mt-2 flex items-center gap-4 text-xs"
      >
        <button
          class="text-muted hover:text-primary flex items-center gap-1 transition-colors"
          @click="toggleReply"
        >
          <MessageSquare class="w-3.5 h-3.5" />
          回复
        </button>
        <button
          v-if="canDelete"
          class="text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
          @click="handleDelete"
        >
          <Trash2 class="w-3.5 h-3.5" />
          删除
        </button>
      </div>

      <div v-if="showReplyForm" class="mt-3">
        <CommentForm
          :slug="slug"
          :parent-id="comment.id"
          placeholder="写下你的回复..."
          @submitted="handleReplySubmitted"
          @cancel="handleReplyCancel"
        />
      </div>

      <div
        v-if="replies.length > 0"
        class="mt-2 border-l border-border-soft pl-4 ml-1"
      >
        <CommentItem
          v-for="reply in replies"
          :key="reply.id"
          :comment="reply"
          :slug="slug"
          :comments="comments"
          @reply="emit('reply', $event)"
          @deleted="emit('deleted', $event)"
          @submitted="emit('submitted', $event)"
        />
      </div>
    </div>
  </div>
</template>
