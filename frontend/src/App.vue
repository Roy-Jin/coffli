<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './components/useModal.vue'
import Header from './components/useHeader.vue'
import apiClient from './api'
import { useUserStore } from './stores/user'

const modalRef = ref()
const headerRef = ref()
const router = useRouter()
const userStore = useUserStore()

provide('modal', {
  showToast: (options: any) => modalRef.value?.showToast(options),
  hideToast: () => modalRef.value?.hideToast(),
  showModal: (options: any) => modalRef.value?.showModal(options),
  hideModal: () => modalRef.value?.hideModal()
})

provide('header', {
  show: () => headerRef.value?.show(),
  hide: () => headerRef.value?.hide()
})

onMounted(async () => {
  const valid = await apiClient.checkAuth()
  if (!valid) {
    userStore.clearAuth()
  }

  router.afterEach(() => {
    const appElement = document.getElementById('app')
    if (appElement) {
      appElement.scrollIntoView({
        block: 'start',
        behavior: 'smooth'
      })
    }
  })
})

</script>

<template>
  <Header ref="headerRef" />
  <router-view />
  <Modal ref="modalRef" />
</template>

<style>
@import "tailwindcss";
@import '@styles/base.css';
</style>
