<script setup lang="ts">
import { ref, computed } from "vue";
import { Send } from "@lucide/vue";
import { useUserStore } from "@/stores/user";
import { useToast } from "@/composables/useToast";
import { createComment } from "@/api/comments";
import type { Comment } from "@/types/api";

const props = withDefaults(
  defineProps<{
    slug: string;
    parentId?: number | null;
    placeholder?: string;
  }>(),
  {
    parentId: null,
    placeholder: "写下你的评论...",
  },
);

const emit = defineEmits<{
  submitted: [comments: Comment[]];
  cancel: [];
}>();

const userStore = useUserStore();
const toast = useToast();

const content = ref("");
const submitting = ref(false);

const canSubmit = computed(
  () => content.value.trim().length > 0 && !submitting.value,
);

async function handleSubmit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const res = await createComment(props.slug, {
      content: content.value,
      parent_id: props.parentId ?? undefined,
    });
    toast.success("评论成功");
    content.value = "";
    emit("submitted", res.comments);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "评论失败");
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  content.value = "";
  emit("cancel");
}
</script>

<template>
  <div
    v-if="!userStore.isLoggedIn"
    class="bg-surface rounded-cute p-4 border border-border-soft text-muted text-sm"
  >
    请先<router-link to="/login" class="text-primary hover:text-primary-hover underline">登录</router-link>后再评论
  </div>
  <div v-else class="bg-surface rounded-cute p-4 border border-border-soft">
    <textarea
      v-model="content"
      :placeholder="placeholder"
      rows="3"
      class="w-full bg-[#0f1419] rounded-cute-sm p-3 border border-border-soft focus:border-primary focus:outline-none text-sm text-[#e4e6eb] resize-none placeholder:text-muted"
    ></textarea>
    <div class="flex justify-end gap-2 mt-3">
      <button
        v-if="parentId"
        type="button"
        class="bg-surface-hover text-[#e4e6eb] rounded-cute-sm px-4 py-2 text-sm hover:opacity-80 transition-opacity"
        @click="handleCancel"
      >
        取消
      </button>
      <button
        type="button"
        :disabled="!canSubmit"
        class="bg-primary text-white rounded-cute-sm px-4 py-2 text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
        @click="handleSubmit"
      >
        <Send class="w-4 h-4" />
        {{ submitting ? "提交中..." : "发送" }}
      </button>
    </div>
  </div>
</template>
