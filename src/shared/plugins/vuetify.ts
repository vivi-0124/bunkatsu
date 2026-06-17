import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        colors: {
          primary: '#6366f1', // indigo-500
          secondary: '#a855f7', // purple-500
          background: '#f8fafc', // slate-50
          surface: '#ffffff',
          error: '#ef4444',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
        },
      },
      dark: {
        colors: {
          primary: '#818cf8', // indigo-400
          secondary: '#c084fc', // purple-400
          background: '#09090b', // zinc-950
          surface: '#18181b', // zinc-900
          error: '#f87171',
          info: '#60a5fa',
          success: '#4ade80',
          warning: '#fbbf24',
        },
      },
    },
  },
})
