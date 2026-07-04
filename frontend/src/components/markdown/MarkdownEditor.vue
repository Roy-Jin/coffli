<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer.vue";

const props = defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const previewContent = ref(props.modelValue);
let timer: ReturnType<typeof setTimeout> | null = null;

function schedulePreview(value: string) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    previewContent.value = value;
  }, 300);
}

function onInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  emit("update:modelValue", value);
  schedulePreview(value);
}

const charCount = computed(() => props.modelValue.length);

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="flex flex-col">
      <div class="flex items-center justify-between mb-2 text-xs text-muted">
        <span>支持 Markdown 语法</span>
        <span>{{ charCount }} 字符</span>
      </div>
      <textarea
        :value="modelValue"
        :placeholder="placeholder"
        @input="onInput"
        class="flex-1 min-h-64 bg-[#0f1419] text-[#e4e6eb] font-mono text-sm p-4 rounded-cute border border-border-soft focus:border-primary focus:outline-none resize-none"
      ></textarea>
    </div>
    <div class="flex flex-col">
      <div class="mb-2 text-xs text-muted">预览</div>
      <div
        class="flex-1 min-h-64 bg-surface rounded-cute border border-border-soft p-4 overflow-auto"
      >
        <MarkdownRenderer :content="previewContent" />
      </div>
    </div>
  </div>
</template>
