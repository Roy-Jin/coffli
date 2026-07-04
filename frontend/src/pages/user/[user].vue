<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { Edit, Mail, ChevronDown, ChevronUp } from "@lucide/vue";
import { getUser } from "@/api/users";
import { getPosts } from "@/api/posts";
import { useUserStore } from "@/stores/user";
import type { User, Post } from "@/types/api";
import { formatDate } from "@/utils/format";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import PostCard from "@/components/post/PostCard.vue";
import GuestbookList from "@/components/guestbook/GuestbookList.vue";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer.vue";
import GithubIcon from "@/components/common/GithubIcon.vue";

const route = useRoute();
const userStore = useUserStore();

const username = computed(() => {
  const u = route.params.user;
  return Array.isArray(u) ? (u[0] ?? "") : u;
});

const user = ref<User | null>(null);
const loading = ref(false);
const notFound = ref(false);
const posts = ref<Post[]>([]);
const postsLoading = ref(false);
const showAllPosts = ref(false);

const isOwnProfile = computed(
  () => !!userStore.user && userStore.user.github_login === username.value,
);

const displayName = computed(
  () => user.value?.display_name || user.value?.github_login || "",
);

const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
    const aTime = new Date(a.published_at ?? a.created_at).getTime();
    const bTime = new Date(b.published_at ?? b.created_at).getTime();
    return bTime - aTime;
  });
});

const visiblePosts = computed(() => {
  if (showAllPosts.value) return sortedPosts.value;
  return sortedPosts.value.slice(0, 4);
});

const hasMorePosts = computed(() => sortedPosts.value.length > 4);

async function loadPosts() {
  if (!user.value) return;
  postsLoading.value = true;
  try {
    const res = await getPosts({
      author: user.value.id,
      status: isOwnProfile.value ? "all" : "published",
      limit: 100,
    });
    posts.value = res.posts;
  } catch {
    posts.value = [];
  } finally {
    postsLoading.value = false;
  }
}

async function loadUser() {
  if (!username.value) return;
  loading.value = true;
  notFound.value = false;
  user.value = null;
  posts.value = [];
  showAllPosts.value = false;
  try {
    const res = await getUser(username.value);
    user.value = res.user;
    await loadPosts();
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
}

watch(username, () => loadUser(), { immediate: true });
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <div class="mx-auto max-w-5xl px-4 py-8">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-20">
          <LoadingSpinner :size="32" />
        </div>

        <!-- Not found -->
        <EmptyState
          v-else-if="notFound"
          title="用户未找到"
          description="该用户可能不存在或已被删除"
          icon="UserX"
        >
          <RouterLink
            to="/"
            class="inline-flex items-center px-4 py-2 rounded-cute-sm bg-primary text-white text-sm hover:bg-primary-hover transition-colors"
          >
            返回首页
          </RouterLink>
        </EmptyState>

        <!-- User profile -->
        <div v-else-if="user" class="space-y-6">
          <!-- Profile header card -->
          <section
            class="bg-surface rounded-cute-lg p-6 border border-border-soft shadow-soft"
          >
            <div class="flex flex-col sm:flex-row gap-5">
              <UserAvatar
                :src="user.avatar_url"
                :name="displayName"
                :size="96"
              />
              <div class="flex-1 min-w-0">
                <h1 class="font-display text-2xl font-semibold text-[#e4e6eb]">
                  {{ displayName }}
                </h1>
                <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
                  <a
                    :href="`https://github.com/${user.github_login}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <GithubIcon :size="14" />
                    {{ user.github_login }}
                  </a>
                  <span v-if="user.email" class="inline-flex items-center gap-1.5">
                    <Mail :size="14" />
                    {{ user.email }}
                  </span>
                </div>
                <p class="mt-3 text-xs text-muted">
                  加入于 {{ formatDate(user.created_at) }}
                </p>
              </div>
              <RouterLink
                v-if="isOwnProfile"
                to="/settings"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cute-sm bg-surface-hover text-[#e4e6eb] text-sm hover:bg-border-soft transition-colors self-start"
              >
                <Edit :size="14" />
                编辑资料
              </RouterLink>
            </div>
          </section>

          <!-- Bio module -->
          <section
            v-if="user.bio"
            class="bg-surface rounded-cute-lg p-6 border border-border-soft"
          >
            <h2 class="text-lg font-semibold text-[#e4e6eb] mb-4">个人简介</h2>
            <div class="text-sm text-[#e4e6eb] leading-relaxed">
              <MarkdownRenderer :content="user.bio" />
            </div>
          </section>

          <!-- Posts module -->
          <section class="bg-surface rounded-cute-lg p-6 border border-border-soft">
            <h2 class="text-lg font-semibold text-[#e4e6eb] mb-4">
              文章
              <span class="ml-2 text-xs font-normal text-muted">({{ posts.length }})</span>
            </h2>

            <div v-if="postsLoading" class="flex justify-center py-12">
              <LoadingSpinner />
            </div>
            <EmptyState
              v-else-if="posts.length === 0"
              title="还没有文章"
              :description="isOwnProfile ? '你还没有任何文章，去写第一篇吧' : '此用户暂未发布任何文章'"
              icon="FileText"
            >
              <RouterLink
                v-if="isOwnProfile"
                to="/new"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm transition-colors"
              >
                开始写作
              </RouterLink>
            </EmptyState>
            <div v-else>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PostCard
                  v-for="post in visiblePosts"
                  :key="post.id"
                  :post="post"
                />
              </div>
              <button
                v-if="hasMorePosts"
                type="button"
                class="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-cute-sm text-sm text-muted hover:text-[#e4e6eb] hover:bg-surface-hover transition-colors"
                @click="showAllPosts = !showAllPosts"
              >
                <template v-if="showAllPosts">
                  <ChevronUp :size="16" />
                  收起文章
                </template>
                <template v-else>
                  <ChevronDown :size="16" />
                  更多文章 ({{ sortedPosts.length - 4 }})
                </template>
              </button>
            </div>
          </section>

          <!-- Guestbook module -->
          <section class="bg-surface rounded-cute-lg p-6 border border-border-soft">
            <GuestbookList :username="username" />
          </section>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
