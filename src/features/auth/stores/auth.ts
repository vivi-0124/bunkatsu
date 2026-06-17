import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authClient } from '../../../../lib/auth-client'
import { useSnackbar } from '@/shared/composables/useSnackbar'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<any>(null)
  const isPending = ref(true)
  const { error: showError } = useSnackbar()

  async function fetchSession() {
    try {
      const { data, error } = await authClient.getSession()
      if (data && !error) {
        session.value = data
      } else {
        session.value = null
      }
    } catch (e) {
      session.value = null
    } finally {
      isPending.value = false
    }
  }

  async function signIn() {
    try {
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      })
      if (res?.error) {
        throw new Error(res.error.message || 'ログインに失敗しました')
      }
    } catch (e: any) {
      console.error(e)
      showError(e.message || '認証サーバーに接続できません。Vercelの環境変数を確認してください。')
    }
  }

  async function signOut() {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            session.value = null
            window.location.href = '/'
          }
        }
      })
    } catch (e: any) {
      console.error(e)
      showError(e.message || 'ログアウトに失敗しました')
    }
  }

  return { session, isPending, fetchSession, signIn, signOut }
})
