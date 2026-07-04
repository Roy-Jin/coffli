<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getComments, deleteComment } from "@/api/comments";
import { useToast } from "@/composables/useToast";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import CommentForm from "./CommentForm.vue";
import CommentItem from "./CommentItem.vue";
import type { Comment } from "@/types/api";

const props = defineProps<{
  slug: string;
}>();

const toast = useToast();

const comments = ref<Comment[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const topLevelComments = computed(() =>
  comments.value.filter((c) => c.parent_id === null),
);

async function loadComments() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getComments(props.slug);
    comments.value = res.comments;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载评论失败";
  } finally {
    loading.value = false;
  }
}

function handleSubmitted(updated: Comment[]) {
  comments.value = updated;
}

async function handleDeleted(id: number) {
  try {
    await deleteComment(id);
    toast.success("删除成功");
    await loadComments();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "删除失败");
  }
}

onMounted(() => {
  loadComments();
});
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-[#e4e6eb] mb-4">
      {{ comments.length }} 条评论
    </h3>

    <CommentForm :slug="slug" @submitted="handleSubmitted" />

    <div v-if="loading" class="mt-6 flex justify-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mt-6">
      <div class="text-red-400 text-sm mb-3">{{ error }}</div>
      <button
        class="bg-surface-hover text-[#e4e6eb] rounded-cute-sm px-4 py-2 text-sm hover:opacity-80 transition-opacity"
        @click="loadComments"
      >
        重试
      </button>
    </div>

    <div v-else-if="topLevelComments.length === 0" class="mt-6">
      <EmptyState title="还没有评论" description="快来抢沙发吧" icon="MessageSquare" />
    </div>

    <div v-else class="mt-4 divide-y divide-border-soft">
      <CommentItem
        v-for="comment in topLevelComments"
        :key="comment.id"
        :comment="comment"
        :slug="slug"
        :comments="comments"
        @deleted="handleDeleted"
        @submitted="handleSubmitted"
      />
    </div>
  </div>
</template>
