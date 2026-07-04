<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Eye, Clock, Edit, Trash2, ArrowLeft } from "@lucide/vue";
import { getPost, deletePost } from "@/api/posts";
import { ApiError } from "@/api/client";
import { useUserStore } from "@/stores/user";
import { useToast } from "@/composables/useToast";
import { renderMarkdown, extractHeadings } from "@/composables/useMarkdown";
import { formatDate } from "@/utils/format";
import type { Post } from "@/types/api";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import TagBadge from "@/components/common/TagBadge.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import PostToc from "@/components/post/PostToc.vue";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer.vue";
import CommentList from "@/components/comment/CommentList.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const slug = computed(() => route.params.slug as string);
const post = ref<Post | null>(null);
const loading = ref(true);
const notFound = ref(false);
const showDeleteDialog = ref(false);
const deleting = ref(false);

const headings = computed(() => {
  if (!post.value) return [];
  return extractHeadings(renderMarkdown(post.value.content));
});

const canManage = computed(() => {
  if (!userStore.isLoggedIn || !post.value || !userStore.user) return false;
  return userStore.isAdmin || userStore.user.id === post.value.author_id;
});

const authorName = computed(() => {
  if (!post.value) return "";
  return post.value.author.display_name || post.value.author.github_login;
});

const publishDate = computed(() => {
  if (!post.value) return "";
  return formatDate(post.value.published_at || post.value.created_at);
});

async function loadPost() {
  loading.value = true;
  notFound.value = false;
  try {
    const res = await getPost(slug.value);
    post.value = res.post;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.code === "NOT_FOUND")) {
      notFound.value = true;
    } else {
      toast.error(err instanceof Error ? err.message : "加载文章失败");
      notFound.value = true;
    }
  } finally {
    loading.value = false;
  }
}

async function onDelete() {
  if (!post.value) return;
  deleting.value = true;
  try {
    await deletePost(slug.value);
    toast.success("文章已删除");
    router.push(`/${post.value.author.github_login}`);
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

    <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="loading" class="py-24">
        <LoadingSpinner :size="32" />
      </div>

      <!-- Not found -->
      <div v-else-if="notFound" class="py-24">
        <EmptyState
          title="文章未找到"
          description="该文章可能已被删除或链接有误"
          icon="FileText"
        >
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm transition-colors"
          >
            <ArrowLeft :size="16" />
            返回首页
          </RouterLink>
        </EmptyState>
      </div>

      <!-- Article -->
      <article
        v-else-if="post"
        class="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <!-- Main content -->
        <div class="lg:col-span-2 min-w-0">
          <header class="mb-6">
            <h1 class="font-display text-3xl font-bold text-[#e4e6eb] leading-tight">
              {{ post.title }}
            </h1>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted">
              <RouterLink
                :to="`/${post.author.github_login}`"
                class="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <UserAvatar
                  :src="post.author.avatar_url"
                  :name="authorName"
                  :size="28"
                />
                <span class="text-[#e4e6eb]">{{ authorName }}</span>
              </RouterLink>
              <span class="flex items-center gap-1">
                <Clock :size="14" />
                {{ publishDate }}
              </span>
              <span class="flex items-center gap-1">
                <Eye :size="14" />
                {{ post.view_count }} 阅读
              </span>
            </div>

            <div v-if="post.tags.length" class="flex flex-wrap gap-2 mt-4">
              <TagBadge
                v-for="tag in post.tags"
                :key="tag.id"
                :name="tag.name"
              />
            </div>
          </header>

          <!-- Body -->
          <div class="bg-surface rounded-cute-lg border border-border-soft p-6">
            <MarkdownRenderer :content="post.content" />
          </div>

          <!-- Action bar -->
          <div
            v-if="canManage"
            class="flex items-center gap-3 mt-6 pt-6 border-t border-border-soft"
          >
            <RouterLink
              :to="`/${post.author.github_login}/${post.slug}/edit`"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-surface hover:bg-surface-hover text-[#e4e6eb] text-sm border border-border-soft transition-colors"
            >
              <Edit :size="14" />
              编辑
            </RouterLink>
            <button
              type="button"
              :disabled="deleting"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/30 transition-colors disabled:opacity-50"
              @click="showDeleteDialog = true"
            >
              <Trash2 :size="14" />
              删除
            </button>
          </div>

          <!-- Comments -->
          <div class="mt-10">
            <CommentList :slug="post.slug" />
          </div>
        </div>

        <!-- Sidebar TOC -->
        <aside class="hidden lg:block">
          <PostToc :headings="headings" />
        </aside>
      </article>
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
