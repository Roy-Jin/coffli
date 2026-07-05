<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { Plus, Coffee, PenLine, Sparkles, ArrowRight } from "@lucide/vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import PostCard from "@/components/post/PostCard.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { getPosts } from "@/api/posts";
import { useUserStore } from "@/stores/user";
import type { Post } from "@/types/api";

const userStore = useUserStore();

const posts = ref<Post[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const filteredPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
    const aTime = new Date(a.published_at ?? a.created_at).getTime();
    const bTime = new Date(b.published_at ?? b.created_at).getTime();
    return bTime - aTime;
  });
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

onMounted(loadPosts);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />

    <main class="flex-1 relative overflow-hidden">
      <!-- Decorative gradient blobs -->
      <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div class="absolute -top-12 -left-12 w-80 h-80 rounded-full bg-primary/20 blur-3xl"></div>
        <div class="absolute -top-16 right-0 w-72 h-72 rounded-full bg-primary-soft/15 blur-3xl"></div>
        <div class="absolute top-8 left-1/2 -translate-x-1/2 w-[500px] h-32 rounded-full bg-primary/10 blur-3xl"></div>
      </div>

      <!-- Hero -->
      <section>
        <div class="mx-auto max-w-5xl px-3 sm:px-4 pt-14 pb-8 sm:pt-20 sm:pb-12 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs mb-6">
            <Sparkles :size="12" />
            <span>咖啡很苦，生活很甜！</span>
          </div>

          <h1
            class="font-display text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-[#e4e6eb] via-primary to-primary-hover bg-clip-text text-transparent"
          >
            Coffli
          </h1>

          <p class="mt-5 text-base md:text-lg text-muted max-w-xl mx-auto leading-relaxed">
            一杯咖啡的时间，记录与分享你的想法🎉
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3 mt-8">
            <RouterLink
              v-if="userStore.isLoggedIn"
              to="/new"
              class="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
            >
              <PenLine :size="16" />
              开始写作
            </RouterLink>
            <RouterLink
              v-else
              to="/login"
              class="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
            >
              <Coffee :size="16" />
              加入我们
            </RouterLink>
            <a
              href="#posts"
              class="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-cute-sm bg-surface hover:bg-surface-hover text-[#e4e6eb] text-sm font-medium border border-border-soft transition-colors"
            >
              浏览文章
              <ArrowRight :size="16" />
            </a>
          </div>
        </div>
      </section>

      <!-- Posts -->
      <section id="posts" class="mx-auto max-w-5xl px-3 sm:px-4 pb-12 sm:pb-20 scroll-mt-20">
        <div class="mb-6 sm:mb-8">
          <h2 class="font-display text-2xl font-semibold text-[#e4e6eb]">
            最新发布
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ filteredPosts.length }} 篇文章
          </p>
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
          description="快来发布第一篇文章吧"
        />

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
      class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 w-14 h-14 flex items-center justify-center rounded-full bg-primary hover:bg-primary-hover text-white shadow-soft-lg transition-all hover:-translate-y-1"
      aria-label="写文章"
    >
      <Plus :size="24" />
    </RouterLink>
  </div>
</template>
