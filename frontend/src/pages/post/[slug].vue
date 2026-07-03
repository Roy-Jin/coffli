<template>
  <div class="post-page">
    <main class="main-content">
      <div class="container">
        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <p>{{ $t('post.loadingPost') }}</p>
        </div>

        <div v-else-if="error" class="state-box">
          <AlertCircle class="state-icon error-icon" />
          <p>{{ error }}</p>
          <button class="secondary" @click="fetchPost">
            <RotateCcw />
            <span>{{ $t('common.retry') }}</span>
          </button>
        </div>

        <div v-else-if="notFound" class="state-box">
          <Compass class="state-icon" />
          <p>{{ $t('post.postNotFound') }}</p>
          <router-link to="/" class="back-link">{{ $t('home.backToHome') }}</router-link>
        </div>

        <article v-else-if="post" class="post-detail">
          <router-link to="/" class="back-link">
            <ArrowLeft />
            <span>{{ $t('common.back') }}</span>
          </router-link>

          <h1 class="post-title">{{ post.title }}</h1>

          <div class="post-meta-row">
            <span class="meta-item">
              <UserCircle />
              {{ $t('home.author') }}
            </span>
            <span class="meta-item">
              <Calendar />
              {{ formatDate(post.created_at) }}
            </span>
            <span class="meta-item">
              <Eye />
              {{ post.view_count }} {{ $t('post.views') }}
            </span>
          </div>

          <div v-if="post.tags && post.tags.length" class="post-tags">
            <span v-for="tag in post.tags" :key="tag.id" class="tag-badge">{{ tag.name }}</span>
          </div>

          <div class="post-content">{{ post.content }}</div>

          <div
            v-if="userStore.isLoggedIn && (userStore.isAdmin || userStore.getUser?.id === post.author_id)"
            class="post-actions"
          >
            <button class="secondary" @click="goToEdit">
              <Pencil />
              <span>{{ $t('common.edit') }}</span>
            </button>
            <button class="danger-btn" :disabled="deleting" @click="handleDelete">
              <Trash2 />
              <span>{{ deleting ? $t('common.deleting') : $t('common.delete') }}</span>
            </button>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  AlertCircle,
  RotateCcw,
  Compass,
  ArrowLeft,
  UserCircle,
  Calendar,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import apiClient, { type Post } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const modal = inject('modal') as {
  showToast: (options: { type?: string; message: string; duration?: number }) => void
  showModal: (options: any) => void
}
const header = inject('header') as { show: () => void; hide: () => void }

const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const deleting = ref(false)

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const fetchPost = async () => {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const slug = route.params.slug as string
    const res = await apiClient.getPost(slug)
    if (res.status === 200 && res.data) {
      post.value = res.data.post
    } else if (res.status === 404) {
      notFound.value = true
    } else {
      error.value = res.error?.message || t('post.loadError')
    }
  } catch {
    error.value = t('post.loadError')
  } finally {
    loading.value = false
  }
}

const goToEdit = () => {
  if (post.value) {
    router.push(`/post/${post.value.slug}/edit`)
  }
}

const handleDelete = () => {
  if (!post.value || deleting.value) return
  modal?.showModal({
    type: 'confirm',
    title: t('post.deletePost'),
    message: t('post.deleteConfirm'),
    onConfirm: async () => {
      deleting.value = true
      try {
        const res = await apiClient.deletePost(post.value!.slug)
        if (res.status === 200 || res.status === 204) {
          modal?.showToast({ type: 'success', message: t('post.postDeleted') })
          router.push('/')
        } else {
          modal?.showToast({
            type: 'error',
            message: res.error?.message || t('post.postDeleteFailed'),
          })
        }
      } catch {
        modal?.showToast({ type: 'error', message: t('post.postDeleteFailed') })
      } finally {
        deleting.value = false
      }
    },
  })
}

onMounted(() => {
  header?.show()
  fetchPost()
})
</script>

<style scoped>
.post-page {
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

.error-icon {
  color: var(--error-color);
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

.post-detail {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.back-link:hover {
  color: var(--theme-color);
}

.post-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.25;
  margin-bottom: 1.25rem;
}

.post-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-tertiary);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tag-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 0.375rem;
  border: var(--border-light);
}

.post-content {
  color: var(--text-primary);
  line-height: 1.8;
  font-size: 1.05rem;
  white-space: pre-wrap;
  word-break: break-word;
  padding-top: 1rem;
  border-top: var(--border-light);
}

.post-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: var(--border-light);
}

.danger-btn {
  background: var(--error-color);
  color: #fff;
}

.danger-btn:hover:not(:disabled) {
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.35);
}

.danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 0;
  }

  .post-detail {
    padding: 1.75rem;
  }

  .post-title {
    font-size: 2rem;
  }

  .post-meta-row {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .post-detail {
    padding: 1.25rem;
  }

  .post-title {
    font-size: 1.75rem;
  }

  .post-actions {
    flex-direction: column;
  }

  .post-actions button {
    width: 100%;
  }
}
</style>
