import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminUsersPage from '../pages/AdminUsersPage.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia } from 'pinia'

const vuetify = createVuetify({
  components,
  directives,
})

describe('AdminUsersPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('APIからユーザー一覧を取得して表示すること', async () => {
    const wrapper = mount(AdminUsersPage, {
      global: {
        plugins: [vuetify],
      },
    })

    // loading が true で始まり、fetch が終わるのを待つ
    // `AdminUsersPage` がマウントされると `fetchUsers()` が呼ばれる
    // MSW がモックデータ（Admin User, Test User）を返す

    // flushPromises の代わりに少し待つ
    await new Promise(resolve => setTimeout(resolve, 100))

    // テーブルにユーザーが表示されていることを確認
    const html = wrapper.html()
    expect(html).toContain('Admin User')
    expect(html).toContain('Test User')
    expect(html).toContain('admin@example.com')
  })
})
