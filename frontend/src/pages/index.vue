<template>
  <div class="home-page">
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <div class="header-text">
            <h2 class="page-title">{{ $t('home.latestPosts') }}</h2>
            <p class="page-subtitle">{{ $t('home.postsSubtitle') }}</p>
          </div>
          <button v-if="userStore.isLoggedIn" class="write-btn" @click="goToNewPost">
            <Pencil />
            <span>{{ $t('home.writePost') }}</span>
          </button>
        </div>

        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <p>{{ $t('home.loadingPosts') }}</p>
        </div>

        <div v-else-if="error" class="state-box">
          <AlertCircle class="state-icon error-icon" />
          <p>{{ error }}</p>
          <button class="secondary" @click="fetchPosts">
            <RotateCcw />
            <span>{{ $t('common.retry') }}</span>
          </button>
        </div>

        <div v-else-if="posts.length === 0" class="state-box">
          <Feather class="state-icon" />
          <p>{{ $t('home.noPosts') }}</p>
        </div>

        <div v-else class="posts-grid">
          <article v-for="post in posts" :key="post.id" class="post-card" @click="openPost(post.slug)">
            <h3 class="post-card-title">{{ post.title }}</h3>
            <p class="post-card-excerpt">{{ getExcerpt(post) }}</p>

            <div v-if="post.tags && post.tags.length" class="post-card-tags">
              <span v-for="tag in post.tags" :key="tag.id" class="tag-badge">{{ tag.name }}</span>
            </div>

            <div class="post-card-footer">
              <span class="post-meta">
                <Calendar />
                {{ formatDate(post.created_at) }}
              </span>
              <span class="post-meta">
                <Eye />
                {{ post.view_count }}
              </span>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Pencil, AlertCircle, RotateCcw, Feather, Calendar, Eye } from 'lucide-vue-next'
import apiClient, { type Post } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const header = inject('header') as { show: () => void; hide: () => void }

const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref('')

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getExcerpt = (post: Post): string => {
  const text = post.summary || post.content
  return text.length > 160 ? text.slice(0, 160).trimEnd() + '…' : text
}

const openPost = (slug: string) => {
  router.push(`/post/${slug}`)
}

const goToNewPost = () => {
  router.push('/post/new')
}

const fetchPosts = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await apiClient.getPosts({ status: 'published', limit: 20 })
    if (res.status === 200 && res.data) {
      posts.value = res.data.posts
    } else {
      error.value = res.error?.message || t('home.loadError')
    }
  } catch {
    error.value = t('home.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  header?.show()
  fetchPosts()
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 3rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--theme-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.write-btn {
  background: var(--gradient-card);
  color: var(--text-primary);
  border: var(--border-light);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
}

.write-btn:hover {
  border-color: var(--theme-color);
  color: var(--theme-color);
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

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.post-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 1.75rem;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(255, 255, 255, 0.2);
}

.post-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card-excerpt {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  border: var(--border-light);
}

.post-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
}

.post-meta {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 0;
  }

  .container {
    padding: 0 0.75rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 1rem 0;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .post-card {
    padding: 1.25rem;
  }
}
</style>
