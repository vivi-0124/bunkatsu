import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authClient } from '../../../../lib/auth-client'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<any>(null)
  const isPending = ref(true)

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
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })
    if (result?.error) {
      console.error('Sign in error:', result.error)
      throw result.error
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
    } catch (e) {
      console.error(e)
    }
  }

  return { session, isPending, fetchSession, signIn, signOut }
})
