<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { renderMarkdown } from "@/composables/useMarkdown";
import mermaid from "mermaid";

const props = defineProps<{ content: string }>();
const containerRef = ref<HTMLElement | null>(null);

let mermaidInited = false;
function initMermaid() {
  if (mermaidInited) return;
  mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
  mermaidInited = true;
}

async function processMermaid() {
  if (!containerRef.value) return;
  initMermaid();
  const nodes = containerRef.value.querySelectorAll<HTMLElement>(".mermaid");
  if (nodes.length === 0) return;
  nodes.forEach((node, i) => {
    if (!node.id) node.id = `mermaid-${i}-${Date.now()}`;
  });
  try {
    await mermaid.run({ nodes: Array.from(nodes) });
  } catch (e) {
    console.error("Mermaid render error:", e);
  }
}

async function render() {
  await nextTick();
  await processMermaid();
}

onMounted(render);
watch(() => props.content, render);
</script>

<template>
  <div ref="containerRef" class="prose-cute" v-html="renderMarkdown(content)"></div>
</template>
