<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { RefreshCw, Plus, Edit, Trash2, Eye, Table } from "@lucide/vue";
import { adminRequest, type BasicAuth } from "@/api/client";
import { useToast } from "@/composables/useToast";

const props = defineProps<{ auth: BasicAuth }>();

const toast = useToast();

interface KvKey {
  name: string;
  metadata?: unknown;
}

interface KvDefault {
  name: string;
  value: string;
}

type ModalMode = "view" | "edit" | "add";

const keys = ref<KvKey[]>([]);
const loading = ref(false);

const showDefaults = ref(false);
const defaults = ref<KvDefault[]>([]);
const loadingDefaults = ref(false);

const modalOpen = ref(false);
const modalMode = ref<ModalMode>("view");
const modalKey = ref("");
const modalValue = ref("");
const modalSaving = ref(false);

const modalTitle = computed(() => {
  if (modalMode.value === "add") return "添加 KV 键";
  if (modalMode.value === "edit") return "编辑 KV 键";
  return "查看 KV 键";
});

const modalReadonly = computed(() => modalMode.value === "view");
const keyReadonly = computed(() => modalMode.value !== "add");

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

async function loadKeys() {
  loading.value = true;
  try {
    const res = await adminRequest<{ keys: KvKey[] }>(
      "/admin/kv/ls",
      {},
      props.auth,
    );
    keys.value = res.keys;
    toast.success(`已加载 ${res.keys.length} 个键`);
  } catch (e: unknown) {
    toast.error(errorMessage(e, "加载 KV 列表失败"));
  } finally {
    loading.value = false;
  }
}

async function loadDefaults() {
  showDefaults.value = !showDefaults.value;
  if (!showDefaults.value || defaults.value.length > 0) return;
  loadingDefaults.value = true;
  try {
    const res = await adminRequest<{ keys: KvDefault[] }>(
      "/admin/kv/defaults",
      {},
      props.auth,
    );
    defaults.value = res.keys;
    toast.success(`已加载 ${res.keys.length} 个默认值`);
  } catch (e: unknown) {
    toast.error(errorMessage(e, "加载默认值失败"));
    showDefaults.value = false;
  } finally {
    loadingDefaults.value = false;
  }
}

async function openModal(mode: ModalMode, key = "") {
  modalMode.value = mode;
  modalKey.value = key;
  modalValue.value = "";
  if (mode === "add") {
    modalOpen.value = true;
    return;
  }
  try {
    const res = await adminRequest<{ key: string; value: string }>(
      `/admin/kv/${encodeURIComponent(key)}`,
      {},
      props.auth,
    );
    modalValue.value = res.value;
    modalOpen.value = true;
  } catch (e: unknown) {
    toast.error(errorMessage(e, "获取键值失败"));
  }
}

function closeModal() {
  modalOpen.value = false;
  modalKey.value = "";
  modalValue.value = "";
}

async function saveModal() {
  if (!modalKey.value.trim()) {
    toast.error("键名不能为空");
    return;
  }
  modalSaving.value = true;
  try {
    await adminRequest<{ key: string; value: string }>(
      `/admin/kv/${encodeURIComponent(modalKey.value)}`,
      { method: "PUT", body: { value: modalValue.value } },
      props.auth,
    );
    toast.success(modalMode.value === "add" ? "已添加键" : "已保存");
    closeModal();
    await loadKeys();
  } catch (e: unknown) {
    toast.error(errorMessage(e, "保存失败"));
  } finally {
    modalSaving.value = false;
  }
}

async function deleteKey(key: string) {
  if (!window.confirm(`确认删除键 "${key}" 吗？`)) return;
  try {
    await adminRequest<{ key: string }>(
      `/admin/kv/${encodeURIComponent(key)}`,
      { method: "DELETE" },
      props.auth,
    );
    toast.success(`已删除 ${key}`);
    await loadKeys();
  } catch (e: unknown) {
    toast.error(errorMessage(e, "删除失败"));
  }
}

onMounted(() => {
  loadKeys();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h2 class="text-xl font-semibold text-[#e4e6eb]">KV 管理</h2>
      <div class="flex gap-2 flex-wrap">
        <button
          class="inline-flex items-center gap-2 px-3 py-2 rounded-cute bg-primary text-white hover:bg-primary-hover transition-colors"
          @click="openModal('add')"
        >
          <Plus class="w-4 h-4" />
          添加
        </button>
        <button
          class="inline-flex items-center gap-2 px-3 py-2 rounded-cute bg-surface border border-border-soft text-[#e4e6eb] hover:bg-surface-hover transition-colors"
          :class="{ 'ring-1 ring-primary': showDefaults }"
          @click="loadDefaults"
        >
          <Table class="w-4 h-4" />
          查看默认值
        </button>
        <button
          class="inline-flex items-center gap-2 px-3 py-2 rounded-cute bg-surface border border-border-soft text-[#e4e6eb] hover:bg-surface-hover transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="loadKeys"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          刷新
        </button>
      </div>
    </div>

    <div class="bg-surface rounded-cute border border-border-soft overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-hover text-muted text-left">
              <th class="px-2 py-2 sm:px-4 sm:py-3 font-medium">键名</th>
              <th class="px-2 py-2 sm:px-4 sm:py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !keys.length">
              <td colspan="2" class="px-2 py-6 sm:px-4 sm:py-8 text-center text-muted">加载中...</td>
            </tr>
            <tr v-else-if="!keys.length">
              <td colspan="2" class="px-2 py-6 sm:px-4 sm:py-8 text-center text-muted">暂无数据</td>
            </tr>
            <tr
              v-for="k in keys"
              :key="k.name"
              class="border-t border-border-soft hover:bg-surface-hover transition-colors"
            >
              <td class="px-2 py-2 sm:px-4 sm:py-3 font-mono text-[#e4e6eb] break-all">{{ k.name }}</td>
              <td class="px-2 py-2 sm:px-4 sm:py-3">
                <div class="flex justify-end gap-1">
                  <button
                    class="p-1.5 rounded-cute-sm text-muted hover:text-primary hover:bg-surface transition-colors"
                    title="查看"
                    @click="openModal('view', k.name)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 rounded-cute-sm text-muted hover:text-primary hover:bg-surface transition-colors"
                    title="编辑"
                    @click="openModal('edit', k.name)"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 rounded-cute-sm text-muted hover:text-red-400 hover:bg-surface transition-colors"
                    title="删除"
                    @click="deleteKey(k.name)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showDefaults"
      class="bg-surface rounded-cute border border-border-soft p-3 sm:p-4"
    >
      <div class="text-sm text-muted mb-3">默认值列表</div>
      <div v-if="loadingDefaults" class="text-muted text-sm">加载中...</div>
      <div v-else-if="!defaults.length" class="text-muted text-sm">暂无默认值</div>
      <div v-else class="space-y-2">
        <div
          v-for="d in defaults"
          :key="d.name"
          class="border border-border-soft rounded-cute-sm p-2 sm:p-3"
        >
          <div class="font-mono text-sm text-primary mb-1">{{ d.name }}</div>
          <pre class="text-xs text-[#e4e6eb] whitespace-pre-wrap break-words font-mono">{{ d.value }}</pre>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4"
          @click.self="closeModal"
        >
          <div class="bg-surface rounded-cute-lg border border-border-soft shadow-soft-lg w-full max-w-2xl">
            <div class="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-border-soft">
              <h3 class="text-base font-semibold text-[#e4e6eb]">{{ modalTitle }}</h3>
              <button
                class="text-muted hover:text-[#e4e6eb] text-xl leading-none"
                @click="closeModal"
              >
                ×
              </button>
            </div>
            <div class="p-4 sm:p-5 space-y-4">
              <div>
                <label class="block text-xs text-muted mb-1">键名</label>
                <input
                  v-model="modalKey"
                  type="text"
                  :readonly="keyReadonly"
                  class="w-full px-3 py-2 rounded-cute bg-[#0f1419] border border-border-soft text-[#e4e6eb] font-mono text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  :class="{ 'cursor-not-allowed': keyReadonly }"
                  placeholder="输入键名"
                />
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">值</label>
                <textarea
                  v-model="modalValue"
                  rows="10"
                  :readonly="modalReadonly"
                  class="w-full px-3 py-2 rounded-cute bg-[#0f1419] border border-border-soft text-[#e4e6eb] font-mono text-sm focus:outline-none focus:border-primary resize-y disabled:opacity-60"
                  :class="{ 'cursor-not-allowed': modalReadonly }"
                  placeholder="输入值"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 px-4 py-3 sm:px-5 sm:py-4 border-t border-border-soft">
              <button
                class="px-4 py-2 rounded-cute bg-surface border border-border-soft text-[#e4e6eb] hover:bg-surface-hover transition-colors"
                @click="closeModal"
              >
                {{ modalReadonly ? "关闭" : "取消" }}
              </button>
              <button
                v-if="!modalReadonly"
                class="px-4 py-2 rounded-cute bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="modalSaving"
                @click="saveModal"
              >
                {{ modalSaving ? "保存中..." : "保存" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
