import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/stores/user";

declare module "vue-router" {
  interface RouteMeta {
    requireAuth?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/pages/index.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/pages/login.vue"),
    },
    {
      path: "/new",
      name: "post-new",
      component: () => import("@/pages/new.vue"),
      meta: { requireAuth: true },
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/pages/settings.vue"),
      meta: { requireAuth: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("@/pages/admin.vue"),
    },
    {
      path: "/:user/:slug/edit",
      name: "post-edit",
      component: () => import("@/pages/post/[user]/[slug]/edit.vue"),
      meta: { requireAuth: true },
    },
    {
      path: "/:user/:slug",
      name: "post",
      component: () => import("@/pages/post/[user]/[slug].vue"),
    },
    {
      path: "/:user",
      name: "user",
      component: () => import("@/pages/user/[user].vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/[...404].vue"),
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.meta.requireAuth) {
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      return {
        path: "/login",
        query: { redirect: to.fullPath },
      };
    }
  }
});

export default router;
