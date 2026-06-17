import { describe, it, expect, beforeEach } from 'vitest'
import { useSnackbar } from './useSnackbar'

describe('useSnackbar', () => {
  const { message, show, color, showMessage, success, error, info } = useSnackbar()

  beforeEach(() => {
    // リセット
    show.value = false
    message.value = ''
    color.value = 'success'
  })

  it('初期状態が正しいこと', () => {
    expect(show.value).toBe(false)
    expect(message.value).toBe('')
    expect(color.value).toBe('success')
  })

  it('showMessage が正しく状態を更新すること', () => {
    showMessage('テストメッセージ', 'error')
    expect(show.value).toBe(true)
    expect(message.value).toBe('テストメッセージ')
    expect(color.value).toBe('error')
  })

  it('success 関数が正しい色で状態を更新すること', () => {
    success('成功しました')
    expect(show.value).toBe(true)
    expect(message.value).toBe('成功しました')
    expect(color.value).toBe('success')
  })

  it('error 関数が正しい色で状態を更新すること', () => {
    error('失敗しました')
    expect(show.value).toBe(true)
    expect(message.value).toBe('失敗しました')
    expect(color.value).toBe('error')
  })

  it('info 関数が正しい色で状態を更新すること', () => {
    info('お知らせです')
    expect(show.value).toBe(true)
    expect(message.value).toBe('お知らせです')
    expect(color.value).toBe('info')
  })
})
