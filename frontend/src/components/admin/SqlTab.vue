<script setup lang="ts">
import { ref } from "vue";
import { Play, Zap, Table } from "@lucide/vue";
import { adminRequest, type BasicAuth } from "@/api/client";
import { useToast } from "@/composables/useToast";

const props = defineProps<{ auth: BasicAuth }>();

const toast = useToast();

interface SqlMeta {
  columns?: string[];
  rows_read?: number;
  rows_written?: number;
  changes?: number;
  duration?: number;
  last_row_id?: number;
  size_after?: number;
  served_by?: string;
}

type SqlResult =
  | { type: "query"; results: Record<string, unknown>[]; meta: SqlMeta }
  | { type: "command"; success: boolean; meta: SqlMeta };

interface SqlResponse {
  message: string;
  statements: string[];
  results: SqlResult[];
}

const SQL_TEMPLATES: { label: string; sql: string }[] = [
  { label: "表列表", sql: "SELECT name FROM sqlite_master WHERE type='table';" },
  { label: "Users", sql: "SELECT * FROM users LIMIT 10;" },
  { label: "Posts", sql: "SELECT * FROM posts LIMIT 10;" },
  { label: "Tags", sql: "SELECT * FROM tags LIMIT 10;" },
  { label: "Schema", sql: "SELECT sql FROM sqlite_master WHERE type='table';" },
];

const sql = ref("SELECT name FROM sqlite_master WHERE type='table';");
const results = ref<SqlResult[]>([]);
const lastMessage = ref("");
const error = ref("");
const loading = ref(false);

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

function useTemplate(tpl: string) {
  sql.value = tpl;
}

function getColumns(result: SqlResult): string[] {
  if (result.type !== "query") return [];
  if (result.meta.columns?.length) return result.meta.columns;
  if (result.results.length === 0) return [];
  return Object.keys(result.results[0]);
}

function formatCell(value: unknown): string {
  if (value === null) return "NULL";
  if (value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function metaSummary(meta: SqlMeta): string {
  const parts: string[] = [];
  if (meta.duration !== undefined) parts.push(`耗时 ${(meta.duration / 1000).toFixed(2)} ms`);
  if (meta.rows_read !== undefined) parts.push(`读取 ${meta.rows_read} 行`);
  if (meta.rows_written !== undefined) parts.push(`写入 ${meta.rows_written} 行`);
  if (meta.changes !== undefined) parts.push(`变更 ${meta.changes} 行`);
  if (meta.last_row_id !== undefined) parts.push(`last_row_id=${meta.last_row_id}`);
  if (meta.size_after !== undefined) parts.push(`DB 大小 ${meta.size_after} B`);
  return parts.join(" · ");
}

async function execute() {
  if (!sql.value.trim()) {
    toast.error("请输入 SQL 语句");
    return;
  }
  loading.value = true;
  error.value = "";
  results.value = [];
  lastMessage.value = "";
  try {
    const res = await adminRequest<SqlResponse>(
      "/admin/sql",
      { method: "POST", body: { sql: sql.value } },
      props.auth,
    );
    results.value = res.results;
    lastMessage.value = res.message;
    toast.success(res.message);
  } catch (e: unknown) {
    error.value = errorMessage(e, "执行失败");
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold text-[#e4e6eb]">SQL 执行</h2>

    <div class="bg-surface rounded-cute border border-border-soft p-3 sm:p-4 space-y-3">
      <div class="flex items-center gap-2 flex-wrap">
        <Zap class="w-4 h-4 text-muted" />
        <span class="text-xs text-muted">快捷模板：</span>
        <button
          v-for="tpl in SQL_TEMPLATES"
          :key="tpl.label"
          class="px-2 py-1 rounded-cute-sm bg-surface-hover border border-border-soft text-xs text-[#e4e6eb] hover:border-primary hover:text-primary transition-colors"
          @click="useTemplate(tpl.sql)"
        >
          {{ tpl.label }}
        </button>
      </div>

      <textarea
        v-model="sql"
        rows="10"
        class="w-full min-h-[200px] px-3 py-2 rounded-cute bg-[#0f1419] border border-border-soft text-[#e4e6eb] font-mono text-sm focus:outline-none focus:border-primary resize-y"
        placeholder="输入 SQL 语句（多条以 ; 分隔）"
      />

      <div class="flex justify-end">
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-cute bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="execute"
        >
          <Play class="w-4 h-4" />
          {{ loading ? "执行中..." : "执行" }}
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="bg-red-500/10 border border-red-500/40 rounded-cute p-3 sm:p-4 text-red-400 text-sm break-words"
    >
      <div class="font-medium mb-1">执行出错</div>
      <pre class="whitespace-pre-wrap break-words font-mono text-xs">{{ error }}</pre>
    </div>

    <div v-if="results.length" class="space-y-4">
      <div class="text-sm text-muted">
        {{ lastMessage }} · 共 {{ results.length }} 个结果
      </div>

      <div
        v-for="(r, i) in results"
        :key="i"
        class="bg-surface rounded-cute border border-border-soft p-3 sm:p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2 text-sm text-[#e4e6eb]">
            <Table class="w-4 h-4 text-primary" />
            <span>结果 #{{ i + 1 }}</span>
            <span
              class="px-2 py-0.5 rounded-cute-sm text-xs"
              :class="r.type === 'query' ? 'bg-primary/20 text-primary' : 'bg-surface-hover text-muted'"
            >
              {{ r.type }}
            </span>
          </div>
          <span v-if="r.meta" class="text-xs text-muted">{{ metaSummary(r.meta) }}</span>
        </div>

        <div v-if="r.type === 'command'" class="text-sm">
          <span :class="r.success ? 'text-primary' : 'text-red-400'">
            {{ r.success ? "执行成功" : "执行失败" }}
          </span>
        </div>

        <div v-else>
          <div v-if="!r.results.length" class="text-sm text-muted">无数据</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-surface-hover text-muted text-left">
                  <th class="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">#</th>
                  <th
                    v-for="col in getColumns(r)"
                    :key="col"
                    class="px-2 py-1.5 sm:px-3 sm:py-2 font-medium whitespace-nowrap"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in r.results"
                  :key="ri"
                  class="border-t border-border-soft"
                >
                  <td class="px-2 py-1.5 sm:px-3 sm:py-2 text-muted">{{ ri + 1 }}</td>
                  <td
                    v-for="col in getColumns(r)"
                    :key="col"
                    class="px-2 py-1.5 sm:px-3 sm:py-2 font-mono text-[#e4e6eb] break-all max-w-[400px]"
                  >
                    {{ formatCell(row[col]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
