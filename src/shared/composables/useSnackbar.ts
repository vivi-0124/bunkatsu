import { ref } from 'vue'

const message = ref('')
const show = ref(false)
const color = ref('success')

export function useSnackbar() {
  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    message.value = msg
    color.value = type
    show.value = true
  }

  const success = (msg: string) => showMessage(msg, 'success')
  const error = (msg: string) => showMessage(msg, 'error')
  const info = (msg: string) => showMessage(msg, 'info')

  return { message, show, color, showMessage, success, error, info }
}
