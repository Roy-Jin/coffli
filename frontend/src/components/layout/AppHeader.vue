<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { RouterLink, useRouter } from "vue-router";
import {
  Coffee,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  User as UserIcon,
  Settings as SettingsIcon,
} from "@lucide/vue";
import { useUserStore } from "@/stores/user";
import UserAvatar from "@/components/common/UserAvatar.vue";
import SearchModal from "@/components/common/SearchModal.vue";

const userStore = useUserStore();
const router = useRouter();

const menuOpen = ref(false);
const mobileMenuOpen = ref(false);
const searchOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

function openSearch() {
  searchOpen.value = true;
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function toggleMobile() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobile() {
  mobileMenuOpen.value = false;
}

async function onLogout() {
  closeMenu();
  await userStore.logout();
  router.push("/");
}

function onDocClick(e: MouseEvent) {
  if (menuOpen.value && dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    closeMenu();
  }
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border-soft"
  >
    <div class="mx-auto max-w-5xl px-4">
      <div class="flex h-14 items-center justify-between gap-3">
        <!-- Logo -->
        <RouterLink
          to="/"
          class="flex items-center gap-2 font-display font-semibold text-lg text-[#e4e6eb] hover:text-primary transition-colors"
        >
          <Coffee :size="22" class="text-primary" />
          <span>Coffli</span>
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden md:flex items-center gap-1 flex-1 ml-4">
          <RouterLink
            to="/"
            class="px-3 py-1.5 rounded-cute-sm text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            active-class="text-primary"
          >
            首页
          </RouterLink>
          <RouterLink
            v-if="userStore.isLoggedIn"
            to="/new"
            class="px-3 py-1.5 rounded-cute-sm text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            active-class="text-primary"
          >
            写文章
          </RouterLink>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-2 ml-auto">
          <!-- Search trigger (desktop) -->
          <button
            type="button"
            class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-cute-sm bg-surface-hover/60 border border-border-soft text-muted text-sm hover:bg-surface-hover transition-colors"
            @click="openSearch"
          >
            <Search :size="14" />
            <span>搜索</span>
            <kbd class="hidden lg:inline-block px-1.5 py-0.5 rounded bg-surface text-xs">Ctrl K</kbd>
          </button>

          <!-- Logged in: avatar dropdown -->
          <div v-if="userStore.isLoggedIn" ref="dropdownRef" class="relative">
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-cute-sm py-1 pl-1 pr-2 hover:bg-surface-hover transition-colors"
              @click.stop="toggleMenu"
            >
              <UserAvatar
                :src="userStore.user?.avatar_url"
                :name="userStore.displayName"
                :size="28"
              />
              <span class="hidden sm:inline text-sm text-[#e4e6eb] max-w-[120px] truncate">
                {{ userStore.displayName }}
              </span>
              <ChevronDown
                :size="14"
                :class="['text-muted transition-transform', menuOpen ? 'rotate-180' : '']"
              />
            </button>
            <Transition name="fade">
              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-44 rounded-cute border border-border-soft bg-surface/95 backdrop-blur-md shadow-soft-lg py-1 z-50"
              >
                <RouterLink
                  :to="`/user/${userStore.user?.github_login}`"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
                  @click="closeMenu"
                >
                  <UserIcon :size="16" class="text-muted" />
                  个人主页
                </RouterLink>
                <RouterLink
                  to="/settings"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
                  @click="closeMenu"
                >
                  <SettingsIcon :size="16" class="text-muted" />
                  设置
                </RouterLink>
                <div class="my-1 border-t border-border-soft"></div>
                <button
                  type="button"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors w-full"
                  @click="onLogout"
                >
                  <LogOut :size="16" class="text-muted" />
                  登出
                </button>
              </div>
            </Transition>
          </div>

          <!-- Not logged in: login button -->
          <RouterLink
            v-else
            to="/login"
            class="px-3 py-1.5 rounded-cute-sm bg-primary hover:bg-primary-hover text-white text-sm transition-colors"
          >
            登录
          </RouterLink>

          <!-- Mobile hamburger -->
          <button
            type="button"
            class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-cute-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            aria-label="菜单"
            @click="toggleMobile"
          >
            <Menu v-if="!mobileMenuOpen" :size="20" />
            <X v-else :size="20" />
          </button>
        </div>
      </div>

      <!-- Mobile panel -->
      <Transition name="slide-up">
        <nav
          v-if="mobileMenuOpen"
          class="md:hidden flex flex-col gap-1 py-3 border-t border-border-soft"
        >
          <button
            type="button"
            class="px-3 py-2 rounded-cute-sm text-sm text-left text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            @click="openSearch(); closeMobile()"
          >
            搜索
          </button>
          <RouterLink
            to="/"
            class="px-3 py-2 rounded-cute-sm text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            active-class="text-primary"
            @click="closeMobile"
          >
            首页
          </RouterLink>
          <RouterLink
            v-if="userStore.isLoggedIn"
            to="/new"
            class="px-3 py-2 rounded-cute-sm text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            active-class="text-primary"
            @click="closeMobile"
          >
            写文章
          </RouterLink>
          <RouterLink
            v-if="userStore.isLoggedIn"
            :to="`/user/${userStore.user?.github_login}`"
            class="px-3 py-2 rounded-cute-sm text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            @click="closeMobile"
          >
            个人主页
          </RouterLink>
          <RouterLink
            v-if="userStore.isLoggedIn"
            to="/settings"
            class="px-3 py-2 rounded-cute-sm text-sm text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            @click="closeMobile"
          >
            设置
          </RouterLink>
          <button
            v-if="userStore.isLoggedIn"
            type="button"
            class="px-3 py-2 rounded-cute-sm text-sm text-left text-[#e4e6eb] hover:bg-surface-hover transition-colors"
            @click="onLogout"
          >
            登出
          </button>
        </nav>
      </Transition>
    </div>
  </header>

  <SearchModal v-model="searchOpen" />
</template>
