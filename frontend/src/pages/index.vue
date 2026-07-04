<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { Plus, Coffee, PenLine, Sparkles, ArrowRight } from "@lucide/vue";
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

const featuredPost = computed(() => filteredPosts.value[0] ?? null);
const restPosts = computed(() => filteredPosts.value.slice(1));

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
      <section class="relative overflow-hidden">
        <!-- Decorative gradient blobs -->
        <div class="pointer-events-none absolute inset-0 -z-10">
          <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl"></div>
          <div class="absolute -top-32 right-0 w-80 h-80 rounded-full bg-primary-soft/15 blur-3xl"></div>
          <div class="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-32 rounded-full bg-primary/10 blur-3xl"></div>
        </div>

        <div class="mx-auto max-w-5xl px-4 pt-20 pb-12 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs mb-6">
            <Sparkles :size="12" />
            <span>GitHub 用户的博客社区</span>
          </div>

          <h1
            class="font-display text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-[#e4e6eb] via-primary to-primary-hover bg-clip-text text-transparent"
          >
            Coffli
          </h1>

          <p class="mt-5 text-base md:text-lg text-muted max-w-xl mx-auto leading-relaxed">
            一杯咖啡的时间，记录与分享你的想法<br class="hidden sm:block" />
            为 GitHub 用户打造的轻量博客社区
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3 mt-8">
            <RouterLink
              v-if="userStore.isLoggedIn"
              to="/new"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
            >
              <PenLine :size="16" />
              开始写作
            </RouterLink>
            <RouterLink
              v-else
              to="/login"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
            >
              <Coffee :size="16" />
              加入我们
            </RouterLink>
            <a
              href="#posts"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-cute-sm bg-surface hover:bg-surface-hover text-[#e4e6eb] text-sm font-medium border border-border-soft transition-colors"
            >
              浏览文章
              <ArrowRight :size="16" />
            </a>
          </div>

          <!-- Tags -->
          <div v-if="tags.length" class="flex flex-wrap justify-center gap-2 mt-10">
            <TagBadge
              v-for="tag in tags"
              :key="tag.id"
              :name="tag.name"
              :active="selectedTagSlug === tag.slug"
              :clickable="true"
              @click="toggleTag(tag)"
            />
          </div>
        </div>
      </section>

      <!-- Posts -->
      <section id="posts" class="mx-auto max-w-5xl px-4 pb-20 scroll-mt-20">
        <div class="flex items-end justify-between mb-8">
          <div>
            <h2 class="font-display text-2xl font-semibold text-[#e4e6eb]">
              {{ selectedTagSlug ? '筛选文章' : '最新发布' }}
            </h2>
            <p class="mt-1 text-sm text-muted">
              {{ filteredPosts.length }} 篇文章
              <span v-if="selectedTagSlug" class="text-primary">· 已按标签筛选</span>
            </p>
          </div>
          <button
            v-if="selectedTagSlug"
            type="button"
            class="text-sm text-muted hover:text-primary transition-colors"
            @click="selectedTagSlug = null"
          >
            清除筛选
          </button>
        </div>

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

        <template v-else>
          <!-- Featured post (first one) -->
          <RouterLink
            v-if="featuredPost"
            :to="`/post/${featuredPost.author.github_login}/${featuredPost.slug}`"
            class="group block mb-8 relative overflow-hidden rounded-cute-lg border border-border-soft bg-surface hover:border-primary/40 transition-all hover:shadow-soft-lg"
          >
            <div class="grid grid-cols-1 md:grid-cols-2">
              <!-- Visual side -->
              <div class="relative h-48 md:h-full min-h-[200px] bg-gradient-to-br from-primary/20 via-primary-soft/10 to-surface overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center">
                  <Coffee :size="80" class="text-primary/30 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div v-if="featuredPost.is_pinned" class="absolute top-4 left-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/90 text-white text-xs font-medium">
                  <Sparkles :size="12" />
                  置顶
                </div>
              </div>
              <!-- Content side -->
              <div class="p-6 md:p-8 flex flex-col justify-center">
                <div class="flex items-center gap-2 text-xs text-muted mb-3">
                  <span class="inline-flex items-center gap-1">
                    <Coffee :size="12" />
                    精选文章
                  </span>
                </div>
                <h3 class="font-display text-2xl font-semibold text-[#e4e6eb] group-hover:text-primary transition-colors leading-tight">
                  {{ featuredPost.title }}
                </h3>
                <p v-if="featuredPost.summary" class="mt-3 text-sm text-muted line-clamp-2 leading-relaxed">
                  {{ featuredPost.summary }}
                </p>
                <div v-if="featuredPost.tags.length" class="flex flex-wrap gap-2 mt-4">
                  <TagBadge
                    v-for="tag in featuredPost.tags.slice(0, 3)"
                    :key="tag.id"
                    :name="tag.name"
                  />
                </div>
                <div class="flex items-center gap-2 mt-5 text-sm text-primary">
                  <span>阅读全文</span>
                  <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </RouterLink>

          <!-- Rest of posts -->
          <div v-if="restPosts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PostCard
              v-for="post in restPosts"
              :key="post.id"
              :post="post"
            />
          </div>
        </template>
      </section>
    </main>

    <AppFooter />

    <!-- Write FAB -->
    <RouterLink
      v-if="userStore.isLoggedIn"
      to="/new"
      class="fixed bottom-6 right-6 z-30 w-14 h-14 flex items-center justify-center rounded-full bg-primary hover:bg-primary-hover text-white shadow-soft-lg transition-all hover:-translate-y-1"
      aria-label="写文章"
    >
      <Plus :size="24" />
    </RouterLink>
  </div>
</template>
