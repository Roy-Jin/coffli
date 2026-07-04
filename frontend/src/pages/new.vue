<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Save, Send, ArrowLeft } from "@lucide/vue";
import { createPost } from "@/api/posts";
import { useUserStore } from "@/stores/user";
import { useToast } from "@/composables/useToast";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import MarkdownEditor from "@/components/markdown/MarkdownEditor.vue";

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const title = ref("");
const slug = ref("");
const summary = ref("");
const content = ref("");
const tagsInput = ref("");
const status = ref<"draft" | "published">("draft");
const slugManuallyEdited = ref(false);
const submitting = ref(false);

const slugPrefix = computed(() => `/${userStore.user?.github_login ?? ""}/`);

const tags = computed(() =>
  tagsInput.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0),
);

function generateSlug(titleValue: string): string {
  return (
    titleValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

watch(title, (val) => {
  if (!slugManuallyEdited.value) {
    slug.value = generateSlug(val);
  }
});

function onSlugInput() {
  slugManuallyEdited.value = true;
}

function validate(): string | null {
  if (!title.value.trim()) return "请输入标题";
  if (!slug.value.trim()) return "请输入链接地址";
  if (!content.value.trim()) return "请输入正文内容";
  return null;
}

async function submit(target: "draft" | "published") {
  const err = validate();
  if (err) {
    toast.error(err);
    return;
  }
  submitting.value = true;
  status.value = target;
  try {
    const res = await createPost({
      slug: slug.value,
      title: title.value.trim(),
      content: content.value,
      summary: summary.value.trim() || undefined,
      status: target,
      tags: tags.value.length ? tags.value : undefined,
    });
    toast.success(target === "published" ? "文章已发布" : "草稿已保存");
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
        <h1 class="font-display text-2xl font-semibold text-[#e4e6eb]">写文章</h1>
      </div>

      <form class="space-y-6" @submit.prevent="publish">
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

        <!-- Slug -->
        <div>
          <label class="block text-sm text-muted mb-2">链接地址</label>
          <div
            class="flex items-stretch bg-surface rounded-cute border border-border-soft focus-within:border-primary overflow-hidden"
          >
            <span class="flex items-center px-3 text-muted text-sm border-r border-border-soft whitespace-nowrap">
              {{ slugPrefix }}
            </span>
            <input
              v-model="slug"
              type="text"
              placeholder="my-first-post"
              class="flex-1 min-w-0 bg-transparent text-[#e4e6eb] px-3 py-3 focus:outline-none"
              @input="onSlugInput"
            />
          </div>
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

        <!-- Status toggle -->
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
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-3 pt-4 border-t border-border-soft">
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
        </div>
      </form>
    </main>

    <AppFooter />
  </div>
</template>
