<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ modelValue: string; placeholder?: string; rows?: number }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const charCount = computed(() => props.modelValue.length);

function onInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  emit("update:modelValue", value);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between mb-2 text-xs text-muted">
      <span>支持 Markdown 语法</span>
      <span>{{ charCount }} 字符</span>
    </div>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows ?? 16"
      @input="onInput"
      class="w-full bg-[#0f1419] text-[#e4e6eb] font-mono text-sm p-4 rounded-cute border border-border-soft focus:border-primary focus:outline-none resize-y"
    ></textarea>
  </div>
</template>
