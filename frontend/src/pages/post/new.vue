<template>
  <div class="new-post-page">
    <main class="main-content">
      <div class="container">
        <div class="new-post-card">
          <h1 class="page-title text-gradient">{{ $t('post.newPost') }}</h1>

          <form @submit.prevent="publish" class="post-form">
            <div class="form-group">
              <label for="title" class="form-label">
                <Heading class="icon" />
                {{ $t('post.title') }}
              </label>
              <input
                id="title"
                :value="form.title"
                @input="onTitleInput"
                type="text"
                class="form-input"
                :placeholder="$t('post.titlePlaceholder')"
              />
            </div>

            <div class="form-group">
              <label for="slug" class="form-label">
                <Link class="icon" />
                {{ $t('post.slug') }}
              </label>
              <input
                id="slug"
                v-model="form.slug"
                type="text"
                class="form-input"
                :placeholder="$t('post.slugPlaceholder')"
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
                </select>
              </div>
            </div>

            <div class="action-section">
              <button type="button" class="secondary" :disabled="loading" @click="saveDraft">
                <Save />
                <span>{{ loading && form.status === 'draft' ? $t('post.savingDraft') : $t('post.saveDraft') }}</span>
              </button>
              <button type="submit" :disabled="loading">
                <Send />
                <span>{{ loading && form.status === 'published' ? $t('post.publishing') : $t('post.publish') }}</span>
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Heading,
  Link,
  AlignLeft,
  PenTool,
  Tags,
  Flag,
  Save,
  Send,
} from 'lucide-vue-next'
import apiClient from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const modal = inject('modal') as {
  showToast: (options: { type?: string; message: string; duration?: number }) => void
}
const header = inject('header') as { show: () => void; hide: () => void }

const form = ref({
  title: '',
  slug: '',
  summary: '',
  content: '',
  tags: '',
  status: 'draft' as 'draft' | 'published',
})
const loading = ref(false)

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const onTitleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  form.value.title = target.value
  if (!form.value.slug) {
    form.value.slug = generateSlug(form.value.title)
  }
}

const submit = async () => {
  if (loading.value) return

  if (!form.value.title.trim() || !form.value.slug.trim() || !form.value.content.trim()) {
    modal?.showToast({ type: 'error', message: t('post.validation.requiredFields') })
    return
  }

  loading.value = true
  try {
    const tags = form.value.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const res = await apiClient.createPost({
      slug: form.value.slug.trim(),
      title: form.value.title.trim(),
      content: form.value.content,
      summary: form.value.summary.trim() || undefined,
      status: form.value.status,
      tags,
    })

    if (res.status === 201 && res.data) {
      modal?.showToast({ type: 'success', message: t('post.postCreated') })
      router.push(`/post/${res.data.post.slug}`)
    } else {
      modal?.showToast({
        type: 'error',
        message: res.error?.message || t('post.postCreateFailed'),
      })
    }
  } catch {
    modal?.showToast({ type: 'error', message: t('post.postCreateFailed') })
  } finally {
    loading.value = false
  }
}

const publish = () => {
  form.value.status = 'published'
  submit()
}

const saveDraft = () => {
  form.value.status = 'draft'
  submit()
}

onMounted(() => {
  header?.show()
  if (!userStore.isLoggedIn) {
    router.replace('/login')
  }
})
</script>

<style scoped>
.new-post-page {
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

.new-post-card {
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

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 0;
  }

  .new-post-card {
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
