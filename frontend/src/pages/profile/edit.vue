<template>
  <div class="edit-profile-page">
    <main class="main-content">
      <div class="container">
        <div class="edit-card card card-lg">
          <h1 class="page-title text-gradient">{{ $t('editProfile.title') }}</h1>

          <form @submit.prevent="handleSubmit" class="edit-form">
            <!-- 头像上传 -->
            <div class="form-section">
              <h2 class="section-title">{{ $t('editProfile.avatar') }}</h2>

              <div class="avatar-upload-section">
                <div class="avatar-preview">
                  <img :src="avatarPreview || defaultAvatar" alt="Avatar Preview" class="avatar-image" />
                </div>

                <div class="avatar-upload-controls">
                  <input type="file" ref="avatarInput" accept="image/*" @change="handleAvatarSelect"
                    class="avatar-input" hidden />
                  <button type="button" class="avatar-upload-btn button" @click="triggerAvatarUpload"
                    :disabled="avatarUploading">
                    <i class="fas fa-upload"></i>
                    {{ avatarUploading ? $t('editProfile.uploading') : $t('editProfile.uploadAvatar') }}
                  </button>

                  <div v-if="avatarUploading" class="upload-status">
                    <div class="upload-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ uploadProgress }}%</span>
                    </div>
                  </div>

                  <p class="upload-hint">
                    {{ $t('editProfile.avatarHint') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="form-section">
              <h2 class="section-title">{{ $t('editProfile.basicInfo') }}</h2>

              <div class="form-group">
                <label for="nickname" class="form-label">{{ $t('editProfile.nickname') }}</label>
                <input id="nickname" v-model="formData.nickname" type="text" class="form-input"
                  :placeholder="$t('editProfile.nicknamePlaceholder')" />
              </div>

              <div class="form-group">
                <label class="form-label">{{ $t('editProfile.gender') }}</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" v-model="formData.gender" :value="1" class="radio-input" />
                    <span class="radio-text">{{ $t('profile.male') }}</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="formData.gender" :value="2" class="radio-input" />
                    <span class="radio-text">{{ $t('profile.female') }}</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="formData.gender" :value="3" class="radio-input" />
                    <span class="radio-text">{{ $t('profile.unknown') }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 额外信息 -->
            <div class="form-section">
              <h2 class="section-title">{{ $t('editProfile.additionalInfo') }}</h2>

              <div class="form-group">
                <label for="email" class="form-label">{{ $t('editProfile.email') }}</label>
                <input id="email" v-model="formData.info.email" type="email" class="form-input"
                  :placeholder="$t('editProfile.emailPlaceholder')" />
              </div>

              <div class="form-group">
                <label for="phone" class="form-label">{{ $t('editProfile.phone') }}</label>
                <input id="phone" v-model="formData.info.phone" type="tel" class="form-input"
                  :placeholder="$t('editProfile.phonePlaceholder')" />
              </div>

              <div class="form-group">
                <label for="birthday" class="form-label">{{ $t('editProfile.birthday') }}</label>
                <input id="birthday" v-model="formData.info.birthday" type="date" class="form-input" />
              </div>

              <div class="form-group">
                <label for="bio" class="form-label">{{ $t('editProfile.bio') }}</label>
                <textarea id="bio" v-model="formData.info.bio" class="form-textarea"
                  :placeholder="$t('editProfile.bioPlaceholder')" rows="4"></textarea>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-section">
              <button type="button" class="cancel-btn button" @click="goBack">
                <i class="fas fa-times"></i>
                {{ $t('editProfile.cancel') }}
              </button>
              <button type="submit" class="save-btn button" :disabled="loading">
                <i class="fas fa-save"></i>
                {{ loading ? $t('editProfile.saving') : $t('editProfile.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import defaultAvatar from "@/assets/defaultAvatar.svg";
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import apiClient from '@/api/index'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const loading = ref(false)

// 头像上传相关变量
const avatarInput = ref<HTMLInputElement>()
const avatarUploading = ref(false)
const uploadProgress = ref(0)
const selectedFile = ref<File | null>(null)
const avatarPreview = ref<string>('')

// 注入全局Modal方法
const modal = inject('modal') as {
  showToast: (options: any) => void
  hideToast: () => void
  showModal: (options: any) => void
  hideModal: () => void
}

// 表单数据
const formData = ref({
  nickname: '',
  gender: 3,
  avatar: false,
  info: {
    email: '',
    phone: '',
    birthday: '',
    bio: ''
  }
})

// 用户信息
const userInfo = computed(() => userStore.user || {
  username: '',
  nickname: '',
  last_login: 0,
  role: 'USER',
  gender: 0,
  reg_time: 0,
  avatar: false,
  info: ''
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

// 初始化表单数据
const initializeFormData = () => {
  formData.value = {
    nickname: userInfo.value.nickname || '',
    gender: userInfo.value.gender || 3,
    avatar: userInfo.value.avatar || false,
    info: {
      email: extraInfo.value.email || '',
      phone: extraInfo.value.phone || '',
      birthday: extraInfo.value.birthday || '',
      bio: extraInfo.value.bio || ''
    }
  }
  
  if (userInfo.value.avatar) {
    avatarPreview.value = apiClient.getBaseUrl() + `/api/v1/users/${userInfo.value.username}/avatar`
  } else {
    avatarPreview.value = ''
  }
}

// 触发头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 将 dataURL 转换为 File 对象
const dataURLToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0]?.match(/:(.*?);/)![1];
  const bstr = atob(arr[1]!);
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

// 处理头像选择
const handleAvatarSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const originalFile = input.files[0]
    
    selectedFile.value = originalFile
    avatarUploading.value = true
    uploadProgress.value = 10

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target?.result) {
          const imageSrc = e.target.result as string
          uploadProgress.value = 30

          try {
            // 自动裁剪和压缩图片
            const croppedImage = await cropImageToSquare(imageSrc)
            uploadProgress.value = 60

            // 压缩至20KB以下
            const compressedData = await compressImageToSize(croppedImage, 20 * 1024)
            uploadProgress.value = 90

            // 将压缩后的 dataURL 转换为 File 对象
            const compressedFile = dataURLToFile(compressedData, originalFile.name)
            
            // 更新 selectedFile 为压缩后的文件
            selectedFile.value = compressedFile
            avatarPreview.value = compressedData
            formData.value.avatar = true
            avatarUploading.value = false
            uploadProgress.value = 100

            modal?.showToast({
              type: 'success',
              message: t('editProfile.avatarUploadSuccess')
            })
          } catch (error) {
            console.error('Image processing failed:', error)
            modal?.showToast({
              type: 'error',
              message: error instanceof Error ? error.message : t('editProfile.avatarUploadFailed')
            })
            resetAvatarState()
          }
        }
      }
      reader.readAsDataURL(originalFile)
    } catch (error) {
      console.error('Avatar selection failed:', error)
      modal?.showToast({
        type: 'error',
        message: error instanceof Error ? error.message : t('editProfile.avatarUploadFailed')
      })
      resetAvatarState()
    }
  }
}

// 自动裁剪图片为正方形
const cropImageToSquare = (imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        const size = Math.min(img.width, img.height)
        canvas.width = size
        canvas.height = size

        ctx.drawImage(
          img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0,
          0,
          size,
          size
        )

        const croppedImage = canvas.toDataURL()
        resolve(croppedImage)
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageSrc
  })
}

// 压缩图片到指定大小
const compressImageToSize = (imageData: string, maxSize: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    let quality = 0.8
    let attempts = 0
    const maxAttempts = 10

    const compress = () => {
      attempts++

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        const maxDimension = 800
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width
            width = maxDimension
          } else {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        const compressedData = canvas.toDataURL('image/webp', quality)

        // 计算实际大小
        const sizeInBytes = Math.floor((compressedData.length - 'data:image/webp;base64,'.length) * 0.75)

        if (sizeInBytes <= maxSize || quality <= 0.1 || attempts >= maxAttempts) {
          resolve(compressedData)
        } else {
          quality -= 0.1
          setTimeout(compress, 0)
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageData
    }

    compress()
  })
}

// 重置头像状态
const resetAvatarState = () => {
  if (avatarInput.value) {
    avatarInput.value.value = ''
  }
  selectedFile.value = null
  avatarUploading.value = false
  uploadProgress.value = 0
}

// 提交表单
const handleSubmit = async () => {
  if (loading.value) return

  loading.value = true

  try {
    // 先处理头像上传（如果选择了新头像）
    if (selectedFile.value) {
      // 现在上传的是压缩后的文件
      const avatarResponse = await apiClient.updateUserAvatar(selectedFile.value)
      if (avatarResponse.status !== 200) {
        throw new Error(avatarResponse.error?.message || t('editProfile.avatarUploadFailed'))
      }
      
      if (userStore.user) {
        userStore.setUser({
          ...userStore.user,
          avatar: true
        })
      }
    }

    const updateData: any = {}

    // 只提交有变化的字段（除了头像）
    if (formData.value.nickname !== userInfo.value.nickname) {
      updateData.nickname = formData.value.nickname
    }

    if (formData.value.gender !== userInfo.value.gender) {
      updateData.gender = formData.value.gender
    }

    // 检查info字段是否有变化
    const currentInfo = extraInfo.value
    const hasInfoChanges =
      formData.value.info.email !== currentInfo.email ||
      formData.value.info.phone !== currentInfo.phone ||
      formData.value.info.birthday !== currentInfo.birthday ||
      formData.value.info.bio !== currentInfo.bio

    if (hasInfoChanges) {
      updateData.info = {
        ...currentInfo,
        ...formData.value.info
      }
    }

    // 如果没有需要更新的字段
    if (Object.keys(updateData).length === 0 && !selectedFile.value) {
      modal?.showToast({
        type: 'info',
        message: t('editProfile.noChanges')
      })
      return
    }

    // 如果有其他需要更新的信息，则调用updateUserInfo
    if (Object.keys(updateData).length > 0) {
      const response = await apiClient.updateUserInfo(updateData)

      if (response.status === 200) {
        modal?.showToast({
          type: 'success',
          message: t('editProfile.updateSuccess')
        })

        // 更新本地用户信息
        if (userStore.user) {
          const updatedUser = {
            ...userStore.user,
            ...updateData,
            info: updateData.info ? JSON.stringify(updateData.info) : userStore.user.info
          }
          userStore.setUser(updatedUser)
        }
      } else {
        throw new Error(response.error?.message || t('editProfile.updateFailed'))
      }
    } else if (selectedFile.value) {
      // 只上传了头像的情况
      modal?.showToast({
        type: 'success',
        message: t('editProfile.updateSuccess')
      })
    }

    // 重置头像上传状态
    resetAvatarState()

    goBack()
  } catch (error) {
    console.error(error)
    modal?.showToast({
      type: 'error',
      message: error instanceof Error ? error.message : t('editProfile.networkError')
    })
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.replace("/profile")
}

onMounted(() => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    modal?.showToast({
      type: 'error',
      message: t('editProfile.loginRequired')
    })
    router.replace('/login')
    return
  }

  // 初始化表单数据
  initializeFormData()
})
</script>

<style scoped>
.main-content {
  padding: 2rem 0;
  display: flex;
  align-items: center;
  min-height: calc(100vh - 80px);
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

.edit-card {
  border-radius: 1.5rem;
  transition: all 0.3s ease;
}

.page-title {
  font-size: 2.25rem;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 700;
}

.form-section {
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--theme-color);
  box-shadow: 0 0 0 3px var(--theme-hover);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.radio-label:hover {
  background: var(--theme-hover);
}

.radio-input {
  margin: 0;
  cursor: pointer;
}

.radio-text {
  font-weight: 500;
}

.action-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.cancel-btn:hover {
  border-color: var(--theme-color);
}

.save-btn {
  background: linear-gradient(135deg, var(--theme-color) 0%, var(--theme-hover) 100%);
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.save-btn:hover:not(:disabled) {
  box-shadow: 0 10px 25px var(--theme-hover);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0;
  }

  .page-title {
    font-size: 2rem;
  }

  .radio-group {
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-section {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
  }
}

/* 头像上传样式 */
.avatar-upload-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.avatar-upload-btn {
  background: var(--theme-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.avatar-upload-btn:hover:not(:disabled) {
  background: var(--theme-hover);
}

.avatar-upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--theme-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  min-width: 3rem;
}

.upload-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .avatar-upload-section {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .avatar-upload-controls {
    align-items: center;
  }

  .avatar-upload-btn {
    align-self: center;
  }

  .upload-progress {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .form-input,
  .form-textarea {
    padding: 0.875rem;
  }

  .avatar-preview {
    width: 100px;
    height: 100px;
  }
}
</style>
