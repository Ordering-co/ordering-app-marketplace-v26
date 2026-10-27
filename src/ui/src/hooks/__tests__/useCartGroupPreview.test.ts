import { renderHook, waitFor } from '@testing-library/react-native'
import { clearCartGroupPreviewCache, useCartGroupPreview } from '../useCartGroupPreview'

const mockState: any = { carts: {}, token: 'user-token', refreshOrderOptions: null }

jest.mock('@components', () => ({
  useOrder: () => [{ carts: mockState.carts }, { refreshOrderOptions: mockState.refreshOrderOptions }],
  useSession: () => [{ token: mockState.token, user: { id: 595 } }],
  useApi: () => [{ root: 'https://api.test', appId: 'app', appInternalName: 'app-marketplace' }]
}))

const buildCart = (uuid: string, overrides: any = {}) => ({
  uuid,
  business_id: 1,
  valid: true,
  status: 0,
  products: [{ id: 1 }],
  total: 105,
  subtotal: 91.43,
  delivery_price_with_discount: 8.57,
  driver_tip: 0,
  group: null,
  ...overrides
})

const respond = (result: any, error = false) => Promise.resolve({ json: async () => ({ error, result }) })

const setupFetch = (routes: Record<string, any>) => {
  global.fetch = jest.fn((url: string, options: any = {}) => {
    const key = `${options.method || 'GET'} ${url.replace('https://api.test', '')}`
    const handler = routes[key]
    if (!handler) return respond(['NOT_FOUND'], true)
    return typeof handler === 'function' ? handler(options) : respond(handler)
  }) as any
}

const calls = () => (global.fetch as jest.Mock).mock.calls.map(([url, options = {}]: any) => `${options.method || 'GET'} ${url.replace('https://api.test', '')}`)

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const salad = buildCart('salad', { business_id: 100, total: 69 })
const demoCart = buildCart('demoCart', { business_id: 102 })
const groupResult = {
  uuid: 'group-1',
  total: 165,
  carts: [{ ...salad }, { ...demoCart, delivery_price_with_discount: 0, total: 96 }]
}

describe('useCartGroupPreview', () => {
  beforeEach(() => {
    mockState.token = 'user-token'
    mockState.carts = { 'businessId:100': salad, 'businessId:102': demoCart }
    mockState.refreshOrderOptions = jest.fn(() => Promise.resolve())
    clearCartGroupPreviewCache()
  })

  it('registers the carts as a group and returns the group pricing', async () => {
    setupFetch({
      'POST /cart_groups': (options: any) => {
        expect(JSON.parse(options.body)).toEqual({ carts: ['demoCart', 'salad'] })
        return respond({ uuid: 'group-1' })
      },
      'GET /cart_groups/group-1': groupResult
    })
    const { result } = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(result.current.cartGroup?.uuid).toBe('group-1'), { timeout: 2000 })
    expect(calls()).toEqual(['POST /cart_groups', 'GET /cart_groups/group-1'])
    expect(mockState.refreshOrderOptions).toHaveBeenCalledTimes(1)
  })

  it('loads the first preview right away and reports it as pending until then', async () => {
    setupFetch({ 'POST /cart_groups': { uuid: 'group-1' }, 'GET /cart_groups/group-1': groupResult })
    const { result } = renderHook(() => useCartGroupPreview())
    expect(result.current.isPending).toBe(true)
    expect(result.current.cartGroup).toBeNull()
    await waitFor(() => expect(result.current.cartGroup?.uuid).toBe('group-1'), { timeout: 200 })
    expect(result.current.isPending).toBe(false)
  })

  it('serves a remounted cart from the cached preview without requesting it again', async () => {
    setupFetch({ 'POST /cart_groups': { uuid: 'group-1' }, 'GET /cart_groups/group-1': groupResult })
    const first = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(first.result.current.cartGroup?.uuid).toBe('group-1'), { timeout: 2000 })
    first.unmount()
    ;(global.fetch as jest.Mock).mockClear()
    const second = renderHook(() => useCartGroupPreview())
    expect(second.result.current.isPending).toBe(false)
    expect(second.result.current.cartGroup?.uuid).toBe('group-1')
    await wait(50)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('waits for the debounce after the carts change once a preview settled', async () => {
    setupFetch({ 'POST /cart_groups': { uuid: 'group-1' }, 'GET /cart_groups/group-1': groupResult })
    const { result, rerender } = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(result.current.cartGroup?.uuid).toBe('group-1'), { timeout: 2000 })
    ;(global.fetch as jest.Mock).mockClear()
    mockState.carts = { 'businessId:100': { ...salad, group: { uuid: 'group-1' }, total: 80 }, 'businessId:102': { ...demoCart, group: { uuid: 'group-1' } } }
    rerender({})
    expect(result.current.isPending).toBe(true)
    await wait(150)
    expect(global.fetch).not.toHaveBeenCalled()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled(), { timeout: 1000 })
  })

  it('reuses the group already shared by every cart', async () => {
    mockState.carts = {
      'businessId:100': { ...salad, group: { uuid: 'group-1' } },
      'businessId:102': { ...demoCart, group: { uuid: 'group-1' } }
    }
    setupFetch({ 'GET /cart_groups/group-1': groupResult })
    const { result } = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(result.current.cartGroup?.total).toBe(165), { timeout: 2000 })
    expect(calls()).toEqual(['GET /cart_groups/group-1'])
    expect(mockState.refreshOrderOptions).not.toHaveBeenCalled()
  })

  it('stays idle with a single cart, when disabled or without session', async () => {
    setupFetch({})
    mockState.carts = { 'businessId:100': salad }
    const single = renderHook(() => useCartGroupPreview())
    mockState.carts = { 'businessId:100': salad, 'businessId:102': demoCart }
    const disabled = renderHook(() => useCartGroupPreview({ enabled: false }))
    await wait(500)
    mockState.token = null
    const anonymous = renderHook(() => useCartGroupPreview())
    await wait(500)
    expect(single.result.current.cartGroup).toBeNull()
    expect(disabled.result.current.cartGroup).toBeNull()
    expect(anonymous.result.current.cartGroup).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('clears empty carts left in the group before reading its pricing', async () => {
    let reads = 0
    setupFetch({
      'POST /cart_groups': { uuid: 'group-1' },
      'POST /carts/clear': (options: any) => {
        expect(JSON.parse(options.body)).toEqual({ uuid: 'empty', user_id: 595 })
        return respond({ uuid: 'empty' })
      },
      'GET /cart_groups/group-1': () => {
        reads += 1
        return respond(reads === 1
          ? { ...groupResult, carts: [{ uuid: 'empty', products: [], delivery_price_with_discount: 8.57 }, ...groupResult.carts] }
          : groupResult)
      }
    })
    const { result } = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(result.current.cartGroup?.carts).toHaveLength(2), { timeout: 2000 })
    expect(calls()).toEqual(['POST /cart_groups', 'GET /cart_groups/group-1', 'POST /carts/clear', 'GET /cart_groups/group-1'])
    expect(mockState.refreshOrderOptions).toHaveBeenCalledTimes(1)
  })

  it('registers again when the shared group no longer holds every cart', async () => {
    mockState.carts = {
      'businessId:100': { ...salad, group: { uuid: 'stale' } },
      'businessId:102': { ...demoCart, group: { uuid: 'stale' } }
    }
    setupFetch({
      'GET /cart_groups/stale': { uuid: 'stale', carts: [salad] },
      'POST /cart_groups': { uuid: 'group-1' },
      'GET /cart_groups/group-1': groupResult
    })
    const { result } = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(result.current.cartGroup?.uuid).toBe('group-1'), { timeout: 2000 })
    expect(calls()).toEqual(['GET /cart_groups/stale', 'POST /cart_groups', 'GET /cart_groups/group-1'])
  })

  it('ignores a group that holds carts with products outside the current list', async () => {
    setupFetch({
      'POST /cart_groups': { uuid: 'group-1' },
      'GET /cart_groups/group-1': { ...groupResult, carts: [...groupResult.carts, buildCart('closed', { valid: false })] }
    })
    const { result } = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2), { timeout: 2000 })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cartGroup).toBeNull()
  })

  it('falls back to no group when the group cannot be created', async () => {
    setupFetch({ 'POST /cart_groups': () => respond(['ERROR_MULTIPLE_CART_GROUPS'], true) })
    const { result } = renderHook(() => useCartGroupPreview())
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1), { timeout: 2000 })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cartGroup).toBeNull()
    expect(calls()).toEqual(['POST /cart_groups'])
  })
})
