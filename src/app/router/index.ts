import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/features/home/pages/HomePage.vue')
    },
    {
      path: '/dashboard',
      component: () => import('@/features/dashboard/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/features/dashboard/pages/DashboardPage.vue')
        },
        {
          path: 'fixed-costs',
          name: 'fixed-costs',
          component: () => import('@/features/fixed-costs/pages/FixedCostsPage.vue')
        },
        {
          path: 'monthly',
          name: 'monthly',
          component: () => import('@/features/monthly-records/pages/MonthlyPage.vue')
        },
        {
          path: 'admin',
          name: 'admin',
          component: () => import('@/features/admin/pages/AdminPage.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('@/features/admin/pages/AdminUsersPage.vue'),
          meta: { requiresAdmin: true }
        }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (authStore.isPending) {
    await authStore.fetchSession()
  }

  const isAuthenticated = !!authStore.session

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else if (to.meta.requiresAdmin && authStore.session?.user?.role !== 'admin') {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
