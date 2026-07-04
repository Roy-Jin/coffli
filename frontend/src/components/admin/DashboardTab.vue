<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Database, RefreshCw, Zap } from "@lucide/vue";
import { adminRequest, type BasicAuth } from "@/api/client";
import { useToast } from "@/composables/useToast";

const props = defineProps<{ auth: BasicAuth }>();

const toast = useToast();

interface KvKey {
  name: string;
  metadata?: unknown;
}

interface InitResponse {
  message: string;
  data?: { kv: Record<string, unknown>; d1: unknown };
}

const kvCount = ref(0);
const initMessage = ref("");
const initStatus = ref<"idle" | "success" | "error">("idle");
const loadingInit = ref(false);
const loadingKeys = ref(false);

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

async function loadKvList() {
  loadingKeys.value = true;
  try {
    const res = await adminRequest<{ keys: KvKey[] }>(
      "/admin/kv/ls",
      {},
      props.auth,
    );
    kvCount.value = res.keys.length;
    toast.success(`已加载 ${res.keys.length} 个 KV 键`);
  } catch (e: unknown) {
    toast.error(errorMessage(e, "加载 KV 列表失败"));
  } finally {
    loadingKeys.value = false;
  }
}

async function initDatabase() {
  loadingInit.value = true;
  try {
    const res = await adminRequest<InitResponse>(
      "/admin/init",
      { method: "POST" },
      props.auth,
    );
    initMessage.value = res.message;
    initStatus.value = "success";
    toast.success(res.message);
    await loadKvList();
  } catch (e: unknown) {
    initStatus.value = "error";
    initMessage.value = errorMessage(e, "初始化数据库失败");
    toast.error(initMessage.value);
  } finally {
    loadingInit.value = false;
  }
}

onMounted(() => {
  loadKvList();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h2 class="text-xl font-semibold text-[#e4e6eb]">控制台概览</h2>
      <div class="flex gap-2">
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-cute bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loadingInit"
          @click="initDatabase"
        >
          <Database class="w-4 h-4" />
          {{ loadingInit ? "初始化中..." : "初始化数据库" }}
        </button>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-cute bg-surface border border-border-soft text-[#e4e6eb] hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loadingKeys"
          @click="loadKvList"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loadingKeys }" />
          刷新 KV 列表
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-surface rounded-cute p-6 border border-border-soft shadow-soft">
        <div class="flex items-center gap-2 text-muted text-sm mb-2">
          <Zap class="w-4 h-4" />
          <span>KV 键总数</span>
        </div>
        <div class="text-3xl font-semibold text-[#e4e6eb]">
          {{ loadingKeys ? "..." : kvCount }}
        </div>
      </div>

      <div class="bg-surface rounded-cute p-6 border border-border-soft shadow-soft">
        <div class="flex items-center gap-2 text-muted text-sm mb-2">
          <Database class="w-4 h-4" />
          <span>数据库初始化状态</span>
        </div>
        <div v-if="loadingInit" class="text-lg text-muted">初始化中...</div>
        <div v-else-if="initStatus === 'success'" class="text-lg text-primary">
          已初始化
        </div>
        <div v-else-if="initStatus === 'error'" class="text-lg text-red-400">
          出错
        </div>
        <div v-else class="text-lg text-muted">未知</div>
      </div>
    </div>

    <div
      v-if="initMessage"
      class="bg-surface rounded-cute p-4 border border-border-soft"
    >
      <div class="text-xs text-muted mb-1 uppercase tracking-wide">响应消息</div>
      <pre class="text-sm text-[#e4e6eb] whitespace-pre-wrap break-words font-sans">{{ initMessage }}</pre>
    </div>
  </div>
</template>
