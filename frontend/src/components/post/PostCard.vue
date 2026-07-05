<script setup lang="ts">
import { computed } from "vue";
import { Pin, Eye, Clock } from "@lucide/vue";
import type { Post } from "@/types/api";
import { formatRelative } from "@/utils/format";
import UserAvatar from "@/components/common/UserAvatar.vue";
import TagBadge from "@/components/common/TagBadge.vue";

const props = defineProps<{ post: Post }>();

const MAX_TAGS = 3;
const visibleTags = computed(() => props.post.tags.slice(0, MAX_TAGS));
const overflowCount = computed(() => Math.max(0, props.post.tags.length - MAX_TAGS));

const postLink = computed(() => `/post/${props.post.author.github_login}/${props.post.slug}`);
const authorLink = computed(() => `/user/${props.post.author.github_login}`);
const authorName = computed(
  () => props.post.author.display_name || props.post.author.github_login,
);
const timeAgo = computed(() => formatRelative(props.post.published_at ?? props.post.created_at));
</script>

<template>
  <article
    class="relative flex flex-col bg-surface rounded-cute-lg p-3 sm:p-4 lg:p-5 shadow-soft hover:shadow-soft-lg transition-shadow border border-border-soft"
  >
    <div class="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-1">
      <span
        v-if="post.status !== 'published'"
        :class="[
          'flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-cute-sm text-xs',
          post.status === 'draft'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-gray-500/20 text-gray-400',
        ]"
      >
        {{ post.status === 'draft' ? '草稿' : '已归档' }}
      </span>
      <span
        v-if="post.is_pinned"
        class="flex items-center gap-1 bg-primary/20 text-primary px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-cute-sm text-xs"
      >
        <Pin :size="12" />
        置顶
      </span>
    </div>

    <img
      v-if="post.cover_image_url"
      :src="post.cover_image_url"
      :alt="post.title"
      class="w-full h-28 sm:h-36 lg:h-40 object-cover rounded-cute mb-2 sm:mb-3 lg:mb-4"
    />

    <RouterLink
      :to="postLink"
      class="font-display text-base sm:text-lg font-semibold hover:text-primary transition-colors"
    >
      {{ post.title }}
    </RouterLink>

    <p v-if="post.summary" class="text-xs sm:text-sm text-muted line-clamp-2 mt-1.5 sm:mt-2">{{ post.summary }}</p>

    <div v-if="post.tags.length" class="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
      <TagBadge v-for="tag in visibleTags" :key="tag.id" :name="tag.name" />
      <span
        v-if="overflowCount > 0"
        class="inline-flex items-center text-xs text-muted px-2 py-0.5 rounded-cute-sm bg-surface-hover"
      >
        +{{ overflowCount }}
      </span>
    </div>

    <div
      class="flex items-center gap-2 sm:gap-3 mt-2 pt-2 sm:mt-3 sm:pt-2.5 border-t border-border-soft text-xs text-muted"
    >
      <RouterLink
        :to="authorLink"
        class="flex items-center gap-1.5 sm:gap-2 hover:text-primary transition-colors"
      >
        <UserAvatar :src="post.author.avatar_url" :name="authorName" :size="20" class="w-5 h-5 sm:w-6 sm:h-6" />
        <span>{{ authorName }}</span>
      </RouterLink>
      <span class="flex items-center gap-1">
        <Eye :size="14" />
        {{ post.view_count }}
      </span>
      <span class="flex items-center gap-1">
        <Clock :size="14" />
        {{ timeAgo }}
      </span>
    </div>
  </article>
</template>
