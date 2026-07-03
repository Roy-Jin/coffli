<template>
  <div class="profile-page">
    <main class="main-content">
      <div class="container">
        <div class="profile-card card card-lg">
          <div class="avatar-section">
            <div class="avatar-container">
              <img :src="user?.avatar_url || defaultAvatar" alt="Avatar" class="avatar" />
            </div>
            <h1 class="nickname text-gradient">{{ user?.display_name || user?.github_login }}</h1>
            <p class="username">@{{ user?.github_login }}</p>
            <span v-if="user?.role === 'admin'" class="role-badge">Admin</span>
          </div>

          <div class="info-section">
            <h2 class="section-title">Basic Info</h2>
            <div class="info-grid">
              <div v-if="user?.email" class="info-item">
                <label class="info-label">Email</label>
                <span class="info-value">{{ user.email }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">Joined</label>
                <span class="info-value">{{ formatDate(user?.created_at) }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">Last Login</label>
                <span class="info-value">{{ formatDate(user?.last_login_at) }}</span>
              </div>
            </div>
          </div>

          <div v-if="user?.bio" class="info-section">
            <h2 class="section-title">Bio</h2>
            <p class="bio-text">{{ user.bio }}</p>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <Loader2 class="spin" />
        </div>

        <div v-if="error" class="error-state card">
          <p>{{ error }}</p>
          <router-link to="/" class="back-link">Back to Home</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import apiClient, { type User } from '@/api'
import defaultAvatar from '@/assets/defaultAvatar.svg'

const route = useRoute()
const router = useRouter()

const user = ref<User | null>(null)
const loading = ref(false)
const error = ref('')

const modal = inject('modal') as {
  showToast: (options: any) => void
} | undefined

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const fetchUser = async () => {
  const username = route.params.id as string
  if (!username) return

  loading.value = true
  error.value = ''
  try {
    const res = await apiClient.getUserInfo(username)
    if (res.status === 200 && res.data?.user) {
      user.value = res.data.user
    } else if (res.status === 404) {
      error.value = 'User not found'
    } else {
      error.value = res.error?.message || 'Failed to load user'
    }
  } catch {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.main-content {
  padding: 2rem 0;
  display: flex;
  align-items: center;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

.profile-card {
  border-radius: 1.5rem;
}

.avatar-section {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: var(--border-light);
}

.avatar-container {
  margin-bottom: 1.5rem;
}

.avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 4px solid var(--theme-color);
  object-fit: cover;
  box-shadow: var(--shadow-lg);
}

.nickname {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.username {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem 0;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--theme-color);
  color: white;
}

.info-section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 1.5rem;
  background: var(--theme-color);
  border-radius: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: var(--bg-tertiary);
  border: var(--border-light);
}

.info-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 500;
}

.bio-text {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  font-size: 1.5rem;
  color: var(--text-tertiary);
}

.error-state {
  text-align: center;
  padding: 2rem;
  margin-top: 1rem;
}

.error-state p {
  color: var(--error-color);
  margin-bottom: 1rem;
}

.back-link {
  color: var(--theme-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .main-content { padding: 1rem 0; }
  .avatar { width: 120px; height: 120px; }
  .nickname { font-size: 2rem; }
  .info-grid { grid-template-columns: 1fr; }
  .info-item { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
</style>
