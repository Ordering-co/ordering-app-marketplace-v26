import { useEffect, useMemo, useRef, useState } from 'react'
import { useApi, useOrder, useSession } from '@components'

export const CART_GROUP_PREVIEW_DELAY_MS = 400
const PREVIEW_CACHE_LIMIT = 20

type PreviewResult = { groupUuid: string, group: any }
type Snapshot = { groupableCarts: any[], cartUuids: string[], cartsKey: string }

const inFlightPreviews = new Map<string, Promise<PreviewResult>>()
const previewCache = new Map<string, any>()

const cachePreview = (key: string, group: any) => {
  previewCache.delete(key)
  previewCache.set(key, group)
  if (previewCache.size > PREVIEW_CACHE_LIMIT) previewCache.delete(previewCache.keys().next().value as string)
}

export const clearCartGroupPreviewCache = () => previewCache.clear()

const hasProducts = (cart: any) => cart?.products?.length > 0

const getGroupableCarts = (carts: any) => Object.values(carts || {})
  .filter((cart: any) => cart?.valid && cart?.status !== 2 && cart?.business_id && hasProducts(cart))

const getCartSignature = (cart: any) => [
  cart?.uuid,
  cart?.products?.length,
  cart?.subtotal,
  cart?.total,
  cart?.delivery_price_with_discount,
  cart?.driver_tip,
  cart?.driver_tip_rate
].join(':')

const getGroupCartUuids = (group: any): string[] => (group?.carts || []).filter(hasProducts).map((cart: any) => cart?.uuid).sort()

const coversExactly = (group: any, cartUuids: string[]) => {
  const groupUuids = getGroupCartUuids(group)
  return groupUuids.length === cartUuids.length && groupUuids.every((uuid, index) => uuid === cartUuids[index])
}

const missesCarts = (group: any, cartUuids: string[]) => {
  const groupUuids = getGroupCartUuids(group)
  return cartUuids.some(uuid => !groupUuids.includes(uuid))
}

export const useCartGroupPreview = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const [ordering]: any = useApi()
  const [{ token, user }]: any = useSession()
  const [orderState, orderActions]: any = useOrder()
  const [result, setResult] = useState<{ key: string | null, group: any }>({ key: null, group: null })
  const registeredGroupRef = useRef<{ cartsKey: string | null, uuid: string | null }>({ cartsKey: null, uuid: null })
  const hasSettledRef = useRef(false)

  const groupableCarts: any[] = useMemo(() => getGroupableCarts(orderState?.carts), [orderState?.carts])
  const cartUuids: string[] = useMemo(() => groupableCarts.map((cart: any) => cart.uuid).sort(), [groupableCarts])
  const cartsKey = cartUuids.join('|')
  const signature = useMemo(() => groupableCarts.map(getCartSignature).sort().join('|'), [groupableCarts])
  const isActive = enabled && !!token && cartUuids.length > 1
  const previewKey = isActive ? `${token}|${signature}` : null

  const latestRef = useRef<Snapshot>({ groupableCarts, cartUuids, cartsKey })
  latestRef.current = { groupableCarts, cartUuids, cartsKey }
  const refreshOrderOptionsRef = useRef<(() => Promise<any>) | undefined>(orderActions?.refreshOrderOptions)
  refreshOrderOptionsRef.current = orderActions?.refreshOrderOptions

  useEffect(() => {
    if (!previewKey || previewCache.has(previewKey)) return

    let cancelled = false
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-App-X': ordering?.appId,
      'X-INTERNAL-PRODUCT-X': ordering?.appInternalName
    }

    const request = async (path: string, options: any = {}) => {
      const response = await fetch(`${ordering.root}${path}`, { ...options, headers })
      const { error, result: content } = await response.json()
      if (error) throw new Error(Array.isArray(content) ? content.join(', ') : String(content))
      return content
    }

    const registerGroup = async (uuids: string[]) => {
      const group = await request('/cart_groups', { method: 'POST', body: JSON.stringify({ carts: uuids }) })
      return group?.uuid
    }

    const resolveGroupUuid = async (snapshot: Snapshot) => {
      const sharedUuid = snapshot.groupableCarts[0]?.group?.uuid
      if (sharedUuid && snapshot.groupableCarts.every((cart: any) => cart?.group?.uuid === sharedUuid)) return sharedUuid
      if (registeredGroupRef.current.cartsKey === snapshot.cartsKey && registeredGroupRef.current.uuid) return registeredGroupRef.current.uuid
      return registerGroup(snapshot.cartUuids)
    }

    const clearEmptyCarts = async (group: any) => {
      const emptyCarts = (group?.carts || []).filter((cart: any) => !hasProducts(cart))
      if (!emptyCarts.length) return false
      await Promise.all(emptyCarts.map((cart: any) => request('/carts/clear', {
        method: 'POST',
        body: JSON.stringify({ uuid: cart.uuid, user_id: user?.id })
      })))
      return true
    }

    const loadPreview = async (snapshot: Snapshot): Promise<PreviewResult> => {
      let groupUuid = await resolveGroupUuid(snapshot)
      let group = groupUuid ? await request(`/cart_groups/${groupUuid}`).catch(() => null) : null
      if (!group || missesCarts(group, snapshot.cartUuids)) {
        groupUuid = await registerGroup(snapshot.cartUuids)
        group = await request(`/cart_groups/${groupUuid}`)
      }
      const clearedCarts = await clearEmptyCarts(group)
      if (clearedCarts) {
        group = await request(`/cart_groups/${groupUuid}`)
      }
      const priced = coversExactly(group, snapshot.cartUuids) ? group : null
      if (priced) cachePreview(previewKey, priced)
      const isContextOutdated = clearedCarts || snapshot.groupableCarts.some((cart: any) => cart?.group?.uuid !== groupUuid)
      if (isContextOutdated && refreshOrderOptionsRef.current) {
        await refreshOrderOptionsRef.current()
      }
      return { groupUuid, group: priced }
    }

    const timer = setTimeout(async () => {
      const snapshot = latestRef.current
      try {
        if (!inFlightPreviews.has(previewKey)) {
          inFlightPreviews.set(previewKey, loadPreview(snapshot).finally(() => inFlightPreviews.delete(previewKey)))
        }
        const { groupUuid, group } = await (inFlightPreviews.get(previewKey) as Promise<PreviewResult>)
        if (cancelled) return
        registeredGroupRef.current = { cartsKey: snapshot.cartsKey, uuid: groupUuid }
        setResult({ key: previewKey, group })
      } catch (err) {
        if (cancelled) return
        registeredGroupRef.current = { cartsKey: null, uuid: null }
        setResult({ key: previewKey, group: null })
      } finally {
        if (!cancelled) hasSettledRef.current = true
      }
    }, hasSettledRef.current ? CART_GROUP_PREVIEW_DELAY_MS : 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [previewKey, token, user?.id, ordering?.root, ordering?.appId, ordering?.appInternalName])

  const settledGroup = previewKey && previewCache.has(previewKey)
    ? previewCache.get(previewKey)
    : (result.key === previewKey ? result.group : undefined)

  const cartGroup = useMemo(
    () => (previewKey && settledGroup && coversExactly(settledGroup, cartUuids) ? settledGroup : null),
    [previewKey, settledGroup, cartUuids]
  )
  const isPending = !!previewKey && settledGroup === undefined

  return { cartGroup, isPending, loading: isPending }
}
