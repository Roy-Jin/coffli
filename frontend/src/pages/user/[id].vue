<template>
  <div class="profile-page">
    <main class="main-content">
      <div class="container">
        <!-- 用户信息卡片 -->
        <div class="profile-card card card-lg">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <div class="avatar-container">
              <img :src="userAvatar" alt="User Avatar" class="avatar" />
            </div>
            <h1 class="nickname text-gradient">{{ userInfo.nickname || userInfo.username }}</h1>
            <p class="username">@{{ userInfo.username }}</p>
          </div>

          <!-- 基本信息 -->
          <div class="info-section">
            <h2 class="section-title">{{ $t('profile.basicInfo') }}</h2>
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">{{ $t('profile.role') }}:</label>
                <span class="info-value">{{ userInfo.role }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">{{ $t('profile.gender') }}:</label>
                <span class="info-value">{{ getGenderText(userInfo.gender) }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">{{ $t('profile.lastLogin') }}:</label>
                <span class="info-value">{{ formatTime(userInfo.last_login) }}</span>
              </div>
            </div>
          </div>

          <!-- 额外信息 -->
          <div v-if="hasAdditionalInfo" class="info-section">
            <h2 class="section-title">{{ $t('profile.additionalInfo') }}</h2>
            <div class="info-grid">
              <div v-if="extraInfo.email" class="info-item">
                <label class="info-label">{{ $t('profile.email') }}:</label>
                <span class="info-value">{{ extraInfo.email }}</span>
              </div>
              <div v-if="extraInfo.phone" class="info-item">
                <label class="info-label">{{ $t('profile.phone') }}:</label>
                <span class="info-value">{{ extraInfo.phone }}</span>
              </div>
              <div v-if="extraInfo.birthday" class="info-item">
                <label class="info-label">{{ $t('profile.birthday') }}:</label>
                <span class="info-value">{{ extraInfo.birthday }}</span>
              </div>
              <div v-if="extraInfo.bio" class="info-item">
                <label class="info-label">{{ $t('profile.bio') }}:</label>
                <span class="info-value">{{ extraInfo.bio }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import defaultAvatar from "@/assets/defaultAvatar.svg";
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import apiClient from '@/api/index'

const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const userInfo = ref({
  username: '',
  nickname: '',
  last_login: 0,
  role: 'USER',
  gender: 0,
  reg_time: 0,
  avatar: false,
  info: ''
})

// 注入全局Modal方法
const modal = inject('modal') as {
  showToast: (options: any) => void
  hideToast: () => void
  showModal: (options: any) => void
  hideModal: () => void
}

// 用户头像
const userAvatar = computed(() => {
  if (userInfo.value.avatar) {
    return apiClient.getBaseUrl() + `/api/v1/users/${userInfo.value.username}/avatar`;
  } else {
    return defaultAvatar;
  }
})

// 解析额外信息
const extraInfo = computed(() => {
  try {
    return JSON.parse(userInfo.value.info)
  } catch {
    return {
      ip: '',
      email: '',
      phone: '',
      birthday: '',
      bio: ''
    }
  }
})

// 检查是否有额外信息
const hasAdditionalInfo = computed(() => {
  const info = extraInfo.value
  return info.email || info.phone || info.birthday || info.bio
})

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return t('profile.unknown')
  return new Date(timestamp).toLocaleString()
}

// 获取性别文本
const getGenderText = (gender: number) => {
  const genderMap = {
    1: t('profile.male'),
    2: t('profile.female'),
    3: t('profile.unknown')
  }
  return genderMap[gender as keyof typeof genderMap] || t('profile.unknown')
}

// 获取用户信息
const fetchUserInfo = async () => {
  const userId = route.params.id as string
  if (!userId) return

  loading.value = true
  try {
    const response = await apiClient.getUserInfo(userId)
    if (response.status === 200 && response.data) {
      userInfo.value = response.data
    } else {
      modal?.showModal({
        type: 'info',
        message: response.error?.message || t('profile.networkError'),
        onCancel: () => useRouter().replace('/')
      })
    }
  } catch (error) {
    console.error(error)
    modal?.showModal({
      type: 'info',
      message: t('profile.networkError'),
      onCancel: () => useRouter().replace('/')
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
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
  transition: all 0.3s ease;
}

.avatar-section {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
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
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px var(--theme-hover);
}

.nickname {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.username {
  font-size: 1.2rem;
  margin: 0;
  font-weight: 500;
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
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--theme-color);
}

.info-label {
  font-weight: 600;
  font-size: 1rem;
}

.info-value {
  font-weight: 500;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0;
  }

  .avatar {
    width: 120px;
    height: 120px;
  }

  .nickname {
    font-size: 2rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    text-align: left;
  }
}

@media (max-width: 480px) {
  .avatar {
    width: 100px;
    height: 100px;
  }

  .nickname {
    font-size: 1.75rem;
  }
}
</style>
