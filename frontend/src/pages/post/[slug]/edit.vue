<template>
  <div class="edit-post-page">
    <main class="main-content">
      <div class="container">
        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <p>{{ $t('post.loadingPost') }}</p>
        </div>

        <div v-else-if="notFound" class="state-box">
          <Compass class="state-icon" />
          <p>{{ $t('post.postNotFound') }}</p>
          <router-link to="/" class="back-link">{{ $t('home.backToHome') }}</router-link>
        </div>

        <div v-else-if="forbidden" class="state-box">
          <Lock class="state-icon" />
          <p>{{ $t('post.noPermission') }}</p>
          <router-link to="/" class="back-link">{{ $t('home.backToHome') }}</router-link>
        </div>

        <div v-else class="edit-post-card">
          <h1 class="page-title text-gradient">{{ $t('post.editPost') }}</h1>

          <form @submit.prevent="save" class="post-form">
            <div class="form-group">
              <label for="title" class="form-label">
                <Heading class="icon" />
                {{ $t('post.title') }}
              </label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                class="form-input"
                :placeholder="$t('post.titlePlaceholder')"
              />
            </div>

            <div class="form-group">
              <label for="summary" class="form-label">
                <AlignLeft class="icon" />
                {{ $t('post.summary') }} <span class="optional">{{ $t('common.optional') }}</span>
              </label>
              <textarea
                id="summary"
                v-model="form.summary"
                class="form-textarea"
                :placeholder="$t('post.summaryPlaceholder')"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="content" class="form-label">
                <PenTool class="icon" />
                {{ $t('post.content') }}
              </label>
              <textarea
                id="content"
                v-model="form.content"
                class="form-textarea content-textarea"
                :placeholder="$t('post.contentPlaceholder')"
                rows="18"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="tags" class="form-label">
                  <Tags class="icon" />
                  {{ $t('post.tags') }} <span class="optional">{{ $t('common.commaSeparated') }}</span>
                </label>
                <input
                  id="tags"
                  v-model="form.tags"
                  type="text"
                  class="form-input"
                  :placeholder="$t('post.tagsPlaceholder')"
                />
              </div>

              <div class="form-group">
                <label for="status" class="form-label">
                  <Flag class="icon" />
                  {{ $t('post.status') }}
                </label>
                <select id="status" v-model="form.status" class="form-input">
                  <option value="draft">{{ $t('post.draft') }}</option>
                  <option value="published">{{ $t('post.published') }}</option>
                  <option value="archived">{{ $t('post.archived') }}</option>
                </select>
              </div>
            </div>

            <div class="action-section">
              <button type="button" class="secondary" :disabled="saving" @click="goBack">
                <X />
                <span>{{ $t('common.cancel') }}</span>
              </button>
              <button type="submit" :disabled="saving">
                <Save />
                <span>{{ saving ? $t('post.savingChanges') : $t('post.saveChanges') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Compass,
  Lock,
  Heading,
  AlignLeft,
  PenTool,
  Tags,
  Flag,
  X,
  Save,
} from 'lucide-vue-next'
import apiClient, { type Post } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const modal = inject('modal') as {
  showToast: (options: { type?: string; message: string; duration?: number }) => void
}
const header = inject('header') as { show: () => void; hide: () => void }

const post = ref<Post | null>(null)
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const forbidden = ref(false)

const form = ref({
  title: '',
  summary: '',
  content: '',
  tags: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
})

const fetchPost = async () => {
  loading.value = true
  notFound.value = false
  forbidden.value = false

  const slug = route.params.slug as string
  if (!slug) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    const res = await apiClient.getPost(slug)
    if (res.status === 200 && res.data?.post) {
      post.value = res.data.post
      if (
        userStore.getUser?.id !== post.value.author_id &&
        !userStore.isAdmin
      ) {
        forbidden.value = true
        return
      }
      form.value.title = post.value.title
      form.value.summary = post.value.summary || ''
      form.value.content = post.value.content
      form.value.tags = (post.value.tags || []).map((t) => t.name).join(', ')
      form.value.status = post.value.status
    } else if (res.status === 404) {
      notFound.value = true
    } else {
      modal?.showToast({
        type: 'error',
        message: res.error?.message || t('post.loadError'),
      })
      notFound.value = true
    }
  } catch {
    modal?.showToast({ type: 'error', message: t('post.loadError') })
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (saving.value || !post.value) return

  if (!form.value.title.trim() || !form.value.content.trim()) {
    modal?.showToast({ type: 'error', message: t('post.validation.titleContentRequired') })
    return
  }

  saving.value = true
  try {
    const tags = form.value.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const res = await apiClient.updatePost(post.value.slug, {
      title: form.value.title.trim(),
      content: form.value.content,
      summary: form.value.summary.trim() || undefined,
      status: form.value.status,
      tags,
    })

    if (res.status === 200) {
      modal?.showToast({ type: 'success', message: t('post.postUpdated') })
      router.push(`/post/${post.value.slug}`)
    } else {
      modal?.showToast({
        type: 'error',
        message: res.error?.message || t('post.postUpdateFailed'),
      })
    }
  } catch {
    modal?.showToast({ type: 'error', message: t('post.postUpdateFailed') })
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  if (post.value) {
    router.push(`/post/${post.value.slug}`)
  } else {
    router.push('/')
  }
}

onMounted(() => {
  header?.show()
  if (!userStore.isLoggedIn) {
    router.replace('/login')
    return
  }
  fetchPost()
})
</script>

<style scoped>
.edit-post-page {
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 3rem 0;
}

.container {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 1rem;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 4rem 2rem;
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
  color: var(--text-secondary);
}

.state-icon {
  font-size: 2.5rem;
  color: var(--text-tertiary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-tertiary);
  border-top-color: var(--theme-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.edit-post-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
}

.optional {
  color: var(--text-tertiary);
  font-weight: 400;
  font-size: 0.85rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--theme-color);
  box-shadow: 0 0 0 3px var(--theme-focus);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.6;
}

.content-textarea {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.95rem;
  min-height: 360px;
  line-height: 1.7;
}

.action-section {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: var(--border-light);
}

.action-section button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.back-link {
  color: var(--theme-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 0;
  }

  .edit-post-card {
    padding: 1.75rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .action-section {
    flex-direction: column-reverse;
  }

  .action-section button {
    width: 100%;
  }
}
</style>
