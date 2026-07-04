import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@/types/api";
import { ApiError } from "@/api/client";
import { getMe, logout as authLogout } from "@/api/auth";

export const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<User | null>(null);
    const loading = ref(false);

    const isLoggedIn = computed(() => user.value !== null);

    const displayName = computed(() => {
      if (!user.value) return "";
      return user.value.display_name || user.value.github_login;
    });

    const isAdmin = computed(() => user.value?.role === "admin");

    async function fetchUser() {
      loading.value = true;
      try {
        const res = await getMe();
        user.value = res.user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          user.value = null;
        }
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function setUser(u: User) {
      user.value = u;
    }

    function clearUser() {
      user.value = null;
    }

    async function logout() {
      try {
        await authLogout();
      } finally {
        clearUser();
      }
    }

    return {
      user,
      loading,
      isLoggedIn,
      displayName,
      isAdmin,
      fetchUser,
      setUser,
      clearUser,
      logout,
    };
  },
  {
    persist: {
      key: "coffli-user",
      pick: ["user"],
    },
  },
);
