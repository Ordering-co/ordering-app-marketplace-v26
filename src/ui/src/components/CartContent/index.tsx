import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';
import Spinner from 'react-native-loading-spinner-overlay';
import { Fade, Placeholder, PlaceholderLine } from 'rn-placeholder';
import { CCContainer, CCNotCarts, CCList, ChCartsTotal } from './styles';

import { useLanguage, useConfig, useUtils, useOrder } from '@components';
import {
  Cart,
  OButton,
  OText,
  NotFoundSource
} from '@ui'
import { useCartGroupPreview } from '../../hooks/useCartGroupPreview'

const PriceSkeleton = ({ width }: { width: number }) => (
  <Placeholder Animation={Fade} style={{ width }}>
    <PlaceholderLine height={14} style={{ marginBottom: 0 }} />
  </Placeholder>
)

const CartGroup = React.memo(({ group, index, renderCart, handleClickCheckout, groupCartsByUuid, isGroupPricingPending }: {
  group: any[],
  index: number,
  renderCart: (cart: any) => React.JSX.Element,
  handleClickCheckout: (group: any[], uuid: string | null) => void,
  groupCartsByUuid?: Record<string, any>,
  isGroupPricingPending?: boolean
}) => {
  const [, t] = useLanguage()
  const theme = useTheme()
  const [{ parsePrice }] = useUtils()

  const validCarts = useMemo(() => group.filter((cart: any) => cart?.valid), [group])
  const hasPending = useMemo(() => validCarts.some((cart: any) => cart?.status === 2), [validCarts])
  const totalForCart = useMemo(() => validCarts.reduce((total: number, cart: any) => total + (groupCartsByUuid?.[cart?.uuid] ?? cart)?.total, 0), [validCarts, groupCartsByUuid])

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <OText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
          {t('CART', 'Cart')} #{index + 1}
          {hasPending && (
            <OText size={12} color={theme?.colors?.primary}>
              {' '}({t('PENDING', 'Pending')})
            </OText>
          )}
        </OText>
        {validCarts?.length > 0 && (
          <OButton
            onClick={() => handleClickCheckout(group, validCarts?.length === 1 ? group[0]?.uuid : null)}
            text={t('CHECKOUT', 'Checkout')}
          />
        )}
      </View>
      {group?.map(renderCart)}
      {validCarts?.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <OText>{t('TOTAL_FOR', 'Total for')} {t('CART', 'Cart')} #{index + 1}</OText>
          {isGroupPricingPending && !hasPending ? <PriceSkeleton width={80} /> : <OText>{parsePrice(totalForCart)}</OText>}
        </View>
      )}
    </>
  )
})

interface CartItemProps {
  cart: any;
  singleBusiness: boolean;
  isFranchiseApp: boolean;
  onNavigationRedirect: (screen: string, params?: any) => void;
  isCartsLoading: boolean;
  setIsCartsLoading: (loading: boolean) => void;
  isMultiCheckout: boolean;
  cartsOpened: string[];
  setCartsOpened: (carts: string[]) => void;
  changeActiveState: (isClosed: boolean, uuid: string) => void;
  hasCartReservation: boolean;
  hideCouponInput?: boolean;
  hideDeliveryFee?: boolean;
  hideDriverTip?: boolean;
}

const CartItem = React.memo(({
  cart,
  singleBusiness,
  isFranchiseApp,
  onNavigationRedirect,
  isCartsLoading,
  setIsCartsLoading,
  isMultiCheckout,
  cartsOpened,
  setCartsOpened,
  changeActiveState,
  hasCartReservation,
  hideCouponInput,
  hideDeliveryFee,
  hideDriverTip
}: CartItemProps) => {
  const [orderState] = useOrder()

  if (!(cart.products.length > 0 || (cart?.reservation && orderState?.options?.type === 9))) {
    return null
  }

  return (
    <Cart
      forceHideCheckoutButton
      singleBusiness={singleBusiness}
      isFranchiseApp={isFranchiseApp}
      cart={cart}
      cartuuid={cart.uuid}
      onNavigationRedirect={onNavigationRedirect}
      isCartsLoading={isCartsLoading}
      setIsCartsLoading={setIsCartsLoading}
      isMultiCheckout={isMultiCheckout}
      hideUpselling
      businessConfigs={cart?.business?.configs}
      hideCouponInput={hideCouponInput}
      hideDeliveryFee={hideDeliveryFee}
      hideDriverTip={hideDriverTip}
      cartsOpened={cartsOpened}
      setCartsOpened={setCartsOpened}
      changeActiveState={changeActiveState}
      isActive={cartsOpened?.includes?.(cart?.uuid) || !!singleBusiness}
      hasCartReservation={hasCartReservation}
    />
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.cart.uuid === nextProps.cart.uuid &&
    prevProps.cart.products === nextProps.cart.products &&
    prevProps.cart.total === nextProps.cart.total &&
    prevProps.isCartsLoading === nextProps.isCartsLoading &&
    prevProps.cartsOpened === nextProps.cartsOpened &&
    prevProps.hasCartReservation === nextProps.hasCartReservation
  )
})

export const CartContent = React.memo((props: any) => {
  const {
    onNavigationRedirect,
    singleBusiness,
    businessSlug,
    navigation,
    isFranchiseApp
  } = props

  const theme = useTheme();
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()
  const [{ parsePrice }] = useUtils();
  const [isCartsLoading, setIsCartsLoading] = useState(false)
  const [cartsOpened, setCartsOpened] = useState<string[]>([])
  const [{ carts: cartsContext, options }, { confirmCart }] = useOrder();

  const cartsList = useMemo(() => {
    return (cartsContext &&
      Object.values(cartsContext).filter((cart: any) =>
        cart.products?.length > 0 || (cart?.reservation && options?.type === 9)
      )) ?? [];
  }, [cartsContext, options?.type]);

  const carts = useMemo(() => {
    return businessSlug
      ? cartsList.filter((cart: any) =>
        cart?.business?.slug === businessSlug ||
        parseInt(businessSlug) === cart?.business_id
      )
      : cartsList
  }, [cartsList, businessSlug]);

  const isOrderStateCarts = !!carts
  const isMultiCheckout = configs?.checkout_multi_business_enabled?.value === '1' && options?.type !== 9
  const hasCartReservation = carts?.some((cart: any) => cart?.reservation)

  const cartsAvailable: any = useMemo(() => Object.values(carts || {})?.filter?.((cart: any) => cart?.valid), [carts])
  const { cartGroup, isPending: isGroupPricingPending } = useCartGroupPreview({ enabled: isMultiCheckout && !hasCartReservation })
  const groupCartsByUuid = useMemo(
    () => (cartGroup?.carts || []).reduce((map: Record<string, any>, cart: any) => ({ ...map, [cart?.uuid]: cart }), {}),
    [cartGroup]
  )
  const pricedCarts: any[] = useMemo(
    () => cartsAvailable.map((cart: any) => groupCartsByUuid[cart?.uuid] ?? cart),
    [cartsAvailable, groupCartsByUuid]
  )
  const totalCartsPrice = pricedCarts?.length && pricedCarts.reduce((total: any, cart: any) => { return total + cart?.total }, 0)
  const totalCartsFee = pricedCarts?.length && pricedCarts
    ?.filter((cart: any) => cart?.status !== 1 && cart?.valid && cart?.products?.length)
    ?.reduce((total: any, cart: any) => { return total + (cart?.delivery_price_with_discount) }, 0)
  const totalDriverTip = pricedCarts.reduce((sum: any, cart: any) => sum + (cart?.driver_tip || 0), 0)

  const cartGroups = useMemo(() => {
    if (!carts?.length) return {}
    return carts.sort((a: any, b: any) => b?.status - a?.status).reduce((groups: any, cart: any) => {
      const groupId: any = cart?.status === 2 ? [`pending:${cart?.group?.uuid || cart?.uuid}`] : ['active']
      groups[groupId] = [...(groups[groupId] || []), cart]
      return groups
    }, {})
  }, [carts])

  const renderCart = useCallback((cart: any) => (
    <CCList nestedScrollEnabled={true} key={cart.uuid} style={{ overflow: 'visible' }}>
      <CartItem
        singleBusiness={singleBusiness}
        isFranchiseApp={isFranchiseApp}
        cart={cart}
        onNavigationRedirect={onNavigationRedirect}
        isCartsLoading={isCartsLoading}
        setIsCartsLoading={setIsCartsLoading}
        isMultiCheckout={isMultiCheckout}
        hideCouponInput={configs?.multi_business_checkout_coupon_input_style?.value === 'group'}
        hideDeliveryFee={isMultiCheckout && configs?.multi_business_checkout_show_combined_delivery_fee?.value === '1'}
        hideDriverTip={isMultiCheckout && configs?.multi_business_checkout_show_combined_driver_tip?.value === '1'}
        cartsOpened={cartsOpened}
        setCartsOpened={setCartsOpened}
        changeActiveState={changeActiveState}
        hasCartReservation={hasCartReservation}
      />
    </CCList>
  ), [cartsOpened, singleBusiness, hasCartReservation, configs])

  const handleCheckoutRedirect = useCallback((group: any[], singleUuid: string | null) => {
    const isSingleCart = cartsAvailable.length === 1
    const groupValidCarts = group.filter((cart: any) => cart?.valid)
    const previewGroupUuid = cartGroup?.uuid && groupValidCarts.length && groupValidCarts.every((cart: any) => groupCartsByUuid[cart?.uuid]) ? cartGroup.uuid : null
    const hasNotGroup = !previewGroupUuid && group.some((cart: any) => !cart?.group?.uuid)
    const cartGroupUuid = previewGroupUuid ?? group[0]?.group?.uuid

    if (isSingleCart || singleUuid) {
      onNavigationRedirect('CheckoutPage', {
        cartUuid: singleUuid
      })
    } else if (hasNotGroup) {
      onNavigationRedirect('MultiCheckout', {
        checkCarts: true
      })
    } else {
      onNavigationRedirect('MultiCheckout', {
        cartUuid: cartGroupUuid
      })
    }
  }, [cartsAvailable, onNavigationRedirect, cartGroup, groupCartsByUuid])

  const changeActiveState = useCallback((isClosed: boolean, uuid: string) => {
    const isActive = cartsOpened?.includes?.(uuid) || !!singleBusiness
    if (isActive || !isClosed) {
      setCartsOpened(cartsOpened?.filter?.((_uuid: any) => _uuid !== uuid))
    } else {
      setCartsOpened([
        ...cartsOpened,
        uuid
      ])
    }
  }, [cartsOpened])

  useEffect(() => {
    const unsuscribe = navigation.addListener('focus', () => {
      const cartsListBlockedByPaypal = carts?.filter((cart: any) => cart?.status === 2 && cart?.paymethod_data?.gateway === 'paypal')
      if (cartsListBlockedByPaypal?.length > 0) {
        cartsListBlockedByPaypal.map(async (cart: any) => {
          await confirmCart(cart?.uuid)
        })
      }
    })
    return () => {
      return unsuscribe()
    }
  }, [carts, navigation])

  return (
    <CCContainer
      style={{ paddingHorizontal: 20 }}
    >
      {isOrderStateCarts && carts?.length > 0 && (
        <>
          {Object.keys(cartGroups)?.length > 0 && isMultiCheckout
            ? (
              Object.entries(cartGroups).map(([group, _], i) => (
                <React.Fragment key={group}>
                  <CartGroup
                    group={cartGroups[group]}
                    index={i}
                    renderCart={renderCart}
                    handleClickCheckout={handleCheckoutRedirect}
                    groupCartsByUuid={groupCartsByUuid}
                    isGroupPricingPending={isGroupPricingPending}
                  />
                  <View style={{ height: 1, backgroundColor: '#ccc', width: '100%', marginVertical: 10 }} />
                </React.Fragment>
              ))
            )
            : (
              carts?.map(renderCart)
            )}
          {isMultiCheckout && (
            <>
              {!!cartsAvailable.length && (
                <>
                  <ChCartsTotal>
                    {(isGroupPricingPending || !!totalCartsFee) && configs?.multi_business_checkout_show_combined_delivery_fee?.value === '1' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <OText size={14} lineHeight={24} color={theme.colors.textNormal} weight={'400'}>
                          {t('TOTAL_DELIVERY_FEE', 'Total delivery fee')}
                        </OText>
                        {isGroupPricingPending ? <PriceSkeleton width={60} /> : (
                          <OText size={14} lineHeight={24} color={theme.colors.textNormal} weight={'400'}>
                            {parsePrice(totalCartsFee)}
                          </OText>
                        )}
                      </View>
                    )}
                    {totalDriverTip > 0 &&
                      configs?.multi_business_checkout_show_combined_driver_tip?.value === '1' && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <OText size={14} lineHeight={24} color={theme.colors.textNormal} weight={'400'}>
                            {t('DRIVER_TIP', 'Driver tip')}
                          </OText>
                          <OText size={14} lineHeight={24} color={theme.colors.textNormal} weight={'400'}>
                            {parsePrice(totalDriverTip)}
                          </OText>
                        </View>
                      )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <OText size={16} lineHeight={24} color={theme.colors.textNormal} weight={'500'}>
                        {t('TOTAL_FOR_ALL_CARTS', 'Total for all Carts')}
                      </OText>
                      {isGroupPricingPending ? <PriceSkeleton width={90} /> : (
                        <OText size={16} lineHeight={24} color={theme.colors.textNormal} weight={'500'}>{parsePrice(totalCartsPrice)}</OText>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
                      <OText size={14} color={theme.colors.textNormal} weight={'300'} style={{ textAlign: 'center' }}>
                        {t('CART_GROUP_MESSAGE_ALERT', 'Discounts may be applied at the time of payment for this group.')}
                      </OText>
                    </View>
                  </ChCartsTotal>
                </>
              )}
            </>
          )}
        </>
      )}
      {(!carts || carts?.length === 0) && (
        <CCNotCarts>
          <NotFoundSource
            hideImage
            btnStyle={{ borderRadius: 8 }}
            content={t('CARTS_NOT_FOUND', 'You don\'t have carts available')}
            btnTitle={t('START_SHOPPING', 'Start shopping')}
            onClickButton={() => singleBusiness ? onNavigationRedirect('Business') : onNavigationRedirect('AddressList')}
          />
        </CCNotCarts>
      )}
      <Spinner visible={isCartsLoading} />
    </CCContainer>
  )
})
