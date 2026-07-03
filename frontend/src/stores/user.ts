import { defineStore } from "pinia";
import type { User } from "@/api";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    user: null,
    isAuthenticated: false,
  }),

  getters: {
    getUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    getUsername: (state) => state.user?.github_login,
    getDisplayName: (state) => state.user?.display_name || state.user?.github_login,
    getAvatar: (state) => state.user?.avatar_url,
    getRole: (state) => state.user?.role,
    isAdmin: (state) => state.user?.role === "admin",
  },

  actions: {
    setUser(user: User) {
      this.user = user;
      this.isAuthenticated = true;
    },

    clearAuth() {
      this.user = null;
      this.isAuthenticated = false;
    },
  },

  persist: {
    key: "coffli-user",
    storage: localStorage,
  },
});
