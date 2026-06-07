import { defineStore } from "pinia";

interface UserInfo {
  username: string;
  nickname: string;
  last_login: number;
  deleted_at: number;
  password: string;
  role: string;
  gender: number;
  reg_time: number;
  active: boolean;
  avatar: boolean;
  id: number;
  info: any; // JSON格式的字符串，包含ip、email、phone、birthday、bio等信息
}

interface UserState {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    user: null,
    token: null,
    isAuthenticated: false,
  }),

  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    isLoggedIn: (state) => state.isAuthenticated,
    getUsername: (state) => state.user?.username,
  },

  actions: {
    setUser(user: any) {
      this.user = user;
      this.isAuthenticated = true;
    },

    setToken(token: string) {
      this.token = token;
    },

    clearAuth() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
    },

    async get(key: "user" | "token"): Promise<any> {
      if (key === "user") {
        return this.user;
      } else if (key === "token") {
        return this.token;
      }
      return null;
    },
  },

  persist: {
    key: "coffli-user",
    storage: localStorage,
  },
});
