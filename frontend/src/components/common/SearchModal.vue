<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";
import { Search, X, FileText, User } from "@lucide/vue";
import { getPosts } from "@/api/posts";
import { useUserStore } from "@/stores/user";
import UserAvatar from "@/components/common/UserAvatar.vue";
import type { Post } from "@/types/api";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const userStore = useUserStore();
const query = ref("");
const posts = ref<Post[]>([]);
const loading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return posts.value.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      p.summary?.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some((t) => t.name.toLowerCase().includes(q)) ||
      p.author.display_name?.toLowerCase().includes(q) ||
      p.author.github_login.toLowerCase().includes(q)
    );
  });
});

async function loadPosts() {
  loading.value = true;
  try {
    const res = await getPosts({ status: "published", limit: 100 });
    posts.value = res.posts;
  } catch {
    posts.value = [];
  } finally {
    loading.value = false;
  }
}

function close() {
  visible.value = false;
  query.value = "";
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    visible.value = !visible.value;
  }
  if (e.key === "Escape" && visible.value) {
    close();
  }
}

watch(visible, (v) => {
  if (v) {
    loadPosts();
    nextTick(() => inputRef.value?.focus());
  }
});

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4 bg-black/50 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="w-full max-w-xl rounded-cute border border-border-soft bg-surface/95 backdrop-blur-md shadow-soft-xl overflow-hidden"
        >
          <div class="flex items-center gap-3 px-4 py-3 border-b border-border-soft">
            <Search :size="18" class="text-muted" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="搜索文章、标签、作者..."
              class="flex-1 bg-transparent text-[#e4e6eb] text-sm placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              class="p-1 rounded-cute-sm text-muted hover:text-[#e4e6eb] hover:bg-surface-hover transition-colors"
              @click="close"
            >
              <X :size="16" />
            </button>
          </div>

          <div class="max-h-[50vh] overflow-y-auto py-2">
            <div v-if="loading" class="py-8 text-center text-muted text-sm">
              搜索中...
            </div>

            <div v-else-if="!query.trim()" class="px-4 py-6 text-center text-muted text-sm">
              输入关键词搜索文章，或按
              <kbd class="px-1.5 py-0.5 rounded bg-surface-hover text-xs">Esc</kbd>
              关闭
            </div>

            <div v-else-if="!results.length" class="px-4 py-8 text-center text-muted text-sm">
              没有找到匹配的文章
            </div>

            <RouterLink
              v-for="post in results"
              v-else
              :key="post.id"
              :to="`/post/${post.author.github_login}/${post.slug}`"
              class="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
              @click="close"
            >
              <UserAvatar
                :src="post.author.avatar_url"
                :name="post.author.github_login"
                :size="36"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-medium text-[#e4e6eb] truncate">
                    {{ post.title }}
                  </span>
                  <span v-if="post.is_pinned" class="text-primary text-xs">置顶</span>
                </div>
                <div class="flex items-center gap-2 mt-1 text-xs text-muted">
                  <User :size="12" />
                  <span>{{ post.author.display_name || post.author.github_login }}</span>
                  <FileText :size="12" />
                  <span class="truncate">{{ post.summary || "暂无摘要" }}</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
