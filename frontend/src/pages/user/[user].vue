<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { Edit } from "@lucide/vue";
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
const activeTab = ref<"posts" | "guestbook">("posts");

const isOwnProfile = computed(
  () => !!userStore.user && userStore.user.github_login === username.value,
);

const displayName = computed(
  () => user.value?.display_name || user.value?.github_login || "",
);

async function loadPosts() {
  if (!user.value) return;
  postsLoading.value = true;
  try {
    const res = await getPosts({
      author: user.value.id,
      status: "published",
      limit: 20,
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
  activeTab.value = "posts";
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
                <a
                  :href="`https://github.com/${user.github_login}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 mt-1.5 text-sm text-muted hover:text-primary transition-colors"
                >
                  <GithubIcon :size="14" />
                  {{ user.github_login }}
                </a>
                <p
                  v-if="user.bio"
                  class="mt-3 text-sm text-[#e4e6eb] leading-relaxed"
                >
                  {{ user.bio }}
                </p>
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

          <!-- Tab navigation -->
          <nav class="flex gap-2">
            <button
              type="button"
              :class="[
                'px-4 py-1.5 rounded-cute-sm text-sm transition-colors',
                activeTab === 'posts'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-[#e4e6eb] hover:bg-surface-hover border border-border-soft',
              ]"
              @click="activeTab = 'posts'"
            >
              文章
            </button>
            <button
              type="button"
              :class="[
                'px-4 py-1.5 rounded-cute-sm text-sm transition-colors',
                activeTab === 'guestbook'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-[#e4e6eb] hover:bg-surface-hover border border-border-soft',
              ]"
              @click="activeTab = 'guestbook'"
            >
              留言板
            </button>
          </nav>

          <!-- Tab content -->
          <div>
            <!-- Posts tab -->
            <div v-if="activeTab === 'posts'">
              <div v-if="postsLoading" class="flex justify-center py-12">
                <LoadingSpinner />
              </div>
              <EmptyState
                v-else-if="posts.length === 0"
                title="还没有发布文章"
                description="此用户暂未发布任何文章"
                icon="FileText"
              />
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PostCard
                  v-for="post in posts"
                  :key="post.id"
                  :post="post"
                />
              </div>
            </div>

            <!-- Guestbook tab -->
            <div v-else>
              <GuestbookList :username="username" />
            </div>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
