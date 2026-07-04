<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Save, Send, ArrowLeft, Trash2, Pin } from "@lucide/vue";
import { getPost, updatePost, deletePost } from "@/api/posts";
import { ApiError } from "@/api/client";
import { useUserStore } from "@/stores/user";
import { useToast } from "@/composables/useToast";
import type { PostStatus } from "@/types/api";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import MarkdownEditor from "@/components/markdown/MarkdownEditor.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const slug = computed(() => route.params.slug as string);

const title = ref("");
const summary = ref("");
const content = ref("");
const tagsInput = ref("");
const status = ref<PostStatus>("draft");
const isPinned = ref(false);

const loading = ref(true);
const submitting = ref(false);
const deleting = ref(false);
const showDeleteDialog = ref(false);
const loadError = ref(false);

const slugPrefix = computed(() => `/${route.params.user}/`);

const tags = computed(() =>
  tagsInput.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0),
);

async function loadPost() {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await getPost(slug.value);
    const post = res.post;

    if (!userStore.isLoggedIn || !userStore.user) {
      toast.error("请先登录后再编辑");
      router.replace(`/${post.author.github_login}/${post.slug}`);
      return;
    }
    const isAuthor = userStore.user.id === post.author_id;
    const isAdmin = userStore.isAdmin;
    if (!isAuthor && !isAdmin) {
      toast.error("你没有权限编辑这篇文章");
      router.replace(`/${post.author.github_login}/${post.slug}`);
      return;
    }

    title.value = post.title;
    summary.value = post.summary ?? "";
    content.value = post.content;
    tagsInput.value = post.tags.map((t) => t.name).join(", ");
    status.value = post.status;
    isPinned.value = post.is_pinned === 1;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.code === "NOT_FOUND")) {
      toast.error("文章未找到");
    } else {
      toast.error(err instanceof Error ? err.message : "加载文章失败");
    }
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

function validate(): string | null {
  if (!title.value.trim()) return "请输入标题";
  if (!content.value.trim()) return "请输入正文内容";
  return null;
}

async function submit(target: PostStatus) {
  const err = validate();
  if (err) {
    toast.error(err);
    return;
  }
  submitting.value = true;
  status.value = target;
  try {
    const res = await updatePost(slug.value, {
      title: title.value.trim(),
      content: content.value,
      summary: summary.value.trim() || undefined,
      status: target,
      is_pinned: isPinned.value,
      tags: tags.value.length ? tags.value : undefined,
    });
    const msg =
      target === "published"
        ? "文章已更新并发布"
        : target === "draft"
          ? "草稿已保存"
          : "文章已归档";
    toast.success(msg);
    router.push(`/${res.post.author.github_login}/${res.post.slug}`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "保存失败");
  } finally {
    submitting.value = false;
  }
}

function saveDraft() {
  submit("draft");
}

function publish() {
  submit("published");
}

function archive() {
  submit("archived");
}

async function onDelete() {
  deleting.value = true;
  try {
    await deletePost(slug.value);
    toast.success("文章已删除");
    router.push(`/${route.params.user}`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "删除失败");
  } finally {
    deleting.value = false;
  }
}

onMounted(loadPost);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />

    <main class="flex-1 w-full max-w-4xl mx-auto p-6">
      <div class="flex items-center gap-3 mb-6">
        <button
          type="button"
          class="text-muted hover:text-primary transition-colors"
          @click="router.back()"
        >
          <ArrowLeft :size="20" />
        </button>
        <h1 class="font-display text-2xl font-semibold text-[#e4e6eb]">编辑文章</h1>
      </div>

      <div v-if="loading" class="py-24">
        <LoadingSpinner :size="32" />
      </div>

      <form v-else-if="!loadError" class="space-y-6" @submit.prevent="publish">
        <!-- Title -->
        <div>
          <label class="block text-sm text-muted mb-2">标题</label>
          <input
            v-model="title"
            type="text"
            placeholder="给你的文章起个标题"
            class="w-full bg-surface text-[#e4e6eb] font-display text-xl font-semibold px-4 py-3 rounded-cute border border-border-soft focus:border-primary focus:outline-none"
          />
        </div>

        <!-- Slug (readonly) -->
        <div>
          <label class="block text-sm text-muted mb-2">链接地址</label>
          <div
            class="flex items-stretch bg-surface rounded-cute border border-border-soft overflow-hidden opacity-80"
          >
            <span class="flex items-center px-3 text-muted text-sm border-r border-border-soft whitespace-nowrap">
              {{ slugPrefix }}
            </span>
            <input
              :value="slug"
              type="text"
              readonly
              class="flex-1 min-w-0 bg-transparent text-muted px-3 py-3 focus:outline-none cursor-not-allowed"
            />
          </div>
          <p class="mt-1.5 text-xs text-muted">链接地址创建后不可修改</p>
        </div>

        <!-- Summary -->
        <div>
          <label class="block text-sm text-muted mb-2">
            摘要 <span class="text-muted/70">(可选)</span>
          </label>
          <textarea
            v-model="summary"
            rows="2"
            placeholder="一句话简介..."
            class="w-full bg-surface text-[#e4e6eb] text-sm px-4 py-3 rounded-cute border border-border-soft focus:border-primary focus:outline-none resize-none"
          ></textarea>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm text-muted mb-2">
            标签 <span class="text-muted/70">(用英文逗号分隔)</span>
          </label>
          <input
            v-model="tagsInput"
            type="text"
            placeholder="vue, typescript, 前端"
            class="w-full bg-surface text-[#e4e6eb] text-sm px-4 py-3 rounded-cute border border-border-soft focus:border-primary focus:outline-none"
          />
        </div>

        <!-- Content -->
        <div>
          <label class="block text-sm text-muted mb-2">正文</label>
          <MarkdownEditor v-model="content" placeholder="开始写作..." />
        </div>

        <!-- Status + pinned -->
        <div class="flex flex-wrap items-end gap-6">
          <div>
            <label class="block text-sm text-muted mb-2">状态</label>
            <div class="inline-flex rounded-cute border border-border-soft bg-surface p-1">
              <button
                type="button"
                :class="[
                  'px-4 py-1.5 rounded-cute-sm text-sm transition-colors',
                  status === 'draft' ? 'bg-primary text-white' : 'text-muted hover:text-[#e4e6eb]',
                ]"
                @click="status = 'draft'"
              >
                草稿
              </button>
              <button
                type="button"
                :class="[
                  'px-4 py-1.5 rounded-cute-sm text-sm transition-colors',
                  status === 'published' ? 'bg-primary text-white' : 'text-muted hover:text-[#e4e6eb]',
                ]"
                @click="status = 'published'"
              >
                发布
              </button>
              <button
                type="button"
                :class="[
                  'px-4 py-1.5 rounded-cute-sm text-sm transition-colors',
                  status === 'archived' ? 'bg-primary text-white' : 'text-muted hover:text-[#e4e6eb]',
                ]"
                @click="status = 'archived'"
              >
                归档
              </button>
            </div>
          </div>

          <label class="inline-flex items-center gap-2 text-sm text-[#e4e6eb] cursor-pointer select-none">
            <input
              v-model="isPinned"
              type="checkbox"
              class="w-4 h-4 rounded border-border-soft bg-surface text-primary focus:ring-primary"
            />
            <Pin :size="14" class="text-muted" />
            置顶文章
          </label>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-border-soft">
          <button
            type="button"
            :disabled="submitting"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-surface hover:bg-surface-hover text-[#e4e6eb] text-sm border border-border-soft transition-colors disabled:opacity-50"
            @click="saveDraft"
          >
            <Save :size="14" />
            保存草稿
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm transition-colors disabled:opacity-50"
          >
            <Send :size="14" />
            发布文章
          </button>
          <button
            v-if="status === 'archived'"
            type="button"
            :disabled="submitting"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-surface-hover hover:opacity-80 text-muted text-sm transition-colors disabled:opacity-50"
            @click="archive"
          >
            归档文章
          </button>

          <button
            type="button"
            :disabled="deleting"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/30 transition-colors disabled:opacity-50 ml-auto"
            @click="showDeleteDialog = true"
          >
            <Trash2 :size="14" />
            删除文章
          </button>
        </div>
      </form>
    </main>

    <AppFooter />

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除文章"
      message="确定要删除这篇文章吗？此操作不可撤销。"
      confirm-text="删除"
      danger
      @confirm="onDelete"
    />
  </div>
</template>
