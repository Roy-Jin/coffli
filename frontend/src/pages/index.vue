<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { Plus } from "@lucide/vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import PostCard from "@/components/post/PostCard.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import TagBadge from "@/components/common/TagBadge.vue";
import { getPosts, getAllTags } from "@/api/posts";
import { useUserStore } from "@/stores/user";
import type { Post, Tag } from "@/types/api";

const userStore = useUserStore();

const posts = ref<Post[]>([]);
const tags = ref<Tag[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedTagSlug = ref<string | null>(null);

const filteredPosts = computed(() => {
  const list = [...posts.value].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
    const aTime = new Date(a.published_at ?? a.created_at).getTime();
    const bTime = new Date(b.published_at ?? b.created_at).getTime();
    return bTime - aTime;
  });
  if (!selectedTagSlug.value) return list;
  return list.filter((p) => p.tags.some((t) => t.slug === selectedTagSlug.value));
});

async function loadPosts() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getPosts({ status: "published", limit: 20 });
    posts.value = res.posts;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载文章失败";
  } finally {
    loading.value = false;
  }
}

async function loadTags() {
  try {
    const res = await getAllTags();
    tags.value = res.tags;
  } catch {
    // tags are non-critical
  }
}

function toggleTag(tag: Tag) {
  selectedTagSlug.value =
    selectedTagSlug.value === tag.slug ? null : tag.slug;
}

onMounted(() => {
  loadPosts();
  loadTags();
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />

    <main class="flex-1">
      <!-- Hero -->
      <section class="mx-auto max-w-5xl px-4 pt-12 pb-8 text-center">
        <h1
          class="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-primary-soft bg-clip-text text-transparent"
        >
          Coffli
        </h1>
        <p class="mt-3 text-base text-muted">为 GitHub 用户打造的博客社区</p>

        <!-- Featured tags -->
        <div v-if="tags.length" class="flex flex-wrap justify-center gap-2 mt-6">
          <TagBadge
            v-for="tag in tags"
            :key="tag.id"
            :name="tag.name"
            :active="selectedTagSlug === tag.slug"
            :clickable="true"
            @click="toggleTag(tag)"
          />
        </div>
      </section>

      <!-- Posts -->
      <section class="mx-auto max-w-5xl px-4 pb-16">
        <div v-if="loading" class="py-20">
          <LoadingSpinner :size="32" />
        </div>

        <div v-else-if="error" class="py-20 text-center">
          <p class="text-muted mb-4">{{ error }}</p>
          <button
            type="button"
            class="px-4 py-2 rounded-cute bg-primary hover:bg-primary-hover text-white text-sm transition-colors"
            @click="loadPosts"
          >
            重试
          </button>
        </div>

        <EmptyState
          v-else-if="!filteredPosts.length"
          title="暂无文章"
          :description="selectedTagSlug ? '该标签下还没有文章' : '快来发布第一篇文章吧'"
        />

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PostCard
            v-for="post in filteredPosts"
            :key="post.id"
            :post="post"
          />
        </div>
      </section>
    </main>

    <AppFooter />

    <!-- Write FAB -->
    <RouterLink
      v-if="userStore.isLoggedIn"
      to="/new"
      class="fixed bottom-6 right-6 z-30 w-14 h-14 flex items-center justify-center rounded-full bg-primary hover:bg-primary-hover text-white shadow-soft-lg transition-colors"
      aria-label="写文章"
    >
      <Plus :size="24" />
    </RouterLink>
  </div>
</template>
