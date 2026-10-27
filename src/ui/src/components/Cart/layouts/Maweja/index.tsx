import React, { useMemo, useState } from 'react'
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'styled-components/native'
import Ionicons from 'react-native-vector-icons/Ionicons'

import {
  Cart as CartController,
  useConfig,
  useLanguage,
  useOrder,
  useSession,
  useUtils,
  useValidationFields
} from '@components'
import { themeBrandColor } from '@/utils/themeBrandColor'
import { leaveToCheckoutOrBack } from '@/utils/checkoutReturn'
import { useKeyboardInset } from '../../../../hooks/useKeyboardInset'
import OAlert from '../../../shared/OAlert'
import OButton from '../../../shared/OButton'
import OText from '../../../shared/OText'
import { CartStudentAlert } from '../../../CartStudentAlert'
import { CouponControl } from '../../../CouponControl'
import { NotFoundSource } from '../../../NotFoundSource'
import { UpsellingProducts } from '../../../UpsellingProducts'

import {
  AddMore,
  AddressPill,
  Card,
  CartListCard,
  CartListCopy,
  CheckoutBar,
  ClearButton,
  CommentInput,
  HeaderBack,
  HeaderCopy,
  InfoLine,
  PageHeader,
  ProductBody,
  ProductPhoto,
  ProductRow,
  ProductTop,
  QuantityValue,
  Screen,
  SectionCard,
  SectionTitle,
  StepButton,
  Stepper,
  StoreBanner,
  TotalRow
} from './styles'

const deliveryTypes = [1, 7]

interface MawejaCart {
  uuid: string;
  business_id?: number | null;
  business?: { slug?: string; name?: string; logo?: string; vertical?: string };
  products?: { quantity?: number }[];
  reservation?: object | null;
  status?: number;
  valid_maximum?: boolean;
  valid_minimum?: boolean;
  valid_address?: boolean;
  maximum?: number;
  minimum?: number;
  subtotal?: number;
  total?: number;
  delivery_price_with_discount?: number | null;
  delivery_price?: number;
  zone?: { name?: string };
  delivery_zone?: { name?: string };
}

const cartsWithProducts = (carts: Record<string, MawejaCart> | null | undefined, type: number) => (
  Object.values(carts || {}).filter(cart => (cart?.products?.length ?? 0) > 0 || (cart?.reservation && type === 9))
)

const belowMinimumFor = (cart: any) => {
  const subtotalWithTaxes = cart?.taxes?.reduce((acc: number, item: any) => {
    if (item?.type === 1) return acc + (item?.summary?.tax || 0)
    return acc
  }, cart?.subtotal || 0)
  return cart?.reservation ? !cart?.valid_minimum : subtotalWithTaxes < cart?.minimum
}

const serviceFeeFor = (cart: any) => (
  (cart?.fees || []).reduce((sum: number, fee: any) => {
    const amount = fee?.summary?.amount ?? ((fee?.summary?.fixed || 0) + (fee?.summary?.percentage_after_discount ?? fee?.summary?.percentage ?? 0))
    return sum + (amount || 0)
  }, 0)
)

const MawejaProduct = (props: any) => {
  const { product, cart, changeQuantity, getProductMax, removeProduct, isCartPending } = props
  const theme = useTheme()
  const [, t] = useLanguage()
  const [{ parsePrice, optimizeImage }] = useUtils()
  const [quantity, setQuantity] = useState(product?.quantity || 1)
  const max = getProductMax ? getProductMax(product) : quantity
  const brand = themeBrandColor(theme)

  const setQty = (next: number) => {
    if (!changeQuantity || next < 1 || next > max || next === quantity) return
    setQuantity(next)
    changeQuantity(product, next)
  }

  return (
    <ProductRow>
      {product?.images ? (
        <ProductPhoto source={{ uri: optimizeImage(product.images, 'h_200,c_limit') }} />
      ) : (
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: theme.colors.backgroundGray200 }} />
      )}
      <ProductBody>
        <ProductTop>
          <View style={{ flex: 1, marginRight: 8 }}>
            <OText size={14} weight="bold" numberOfLines={2}>{product?.name}</OText>
            <OText size={12} color={theme.colors.textSecondary} mTop={4}>
              {`${parsePrice(product?.price)} / ${t('UNIT', 'unit')}`}
            </OText>
            <OText size={16} weight="bold" color={brand} mTop={6}>{parsePrice(product?.total || product?.price)}</OText>
          </View>
          {removeProduct && !isCartPending && (
            <OAlert
              title={t('DELETE_PRODUCT', 'Delete Product')}
              message={t('QUESTION_DELETE_PRODUCT', 'Are you sure that you want to delete the product?')}
              onAccept={() => removeProduct(product, cart)}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.textSecondary} />
            </OAlert>
          )}
        </ProductTop>
        <Stepper>
          {!isCartPending && (
            <StepButton testID={`maweja-qty-minus-${product?.id}`} onPress={() => setQty(quantity - 1)} disabled={quantity <= 1}>
              <Ionicons name="remove" size={18} color={theme.colors.textSecondary} />
            </StepButton>
          )}
          <QuantityValue>
            <OText
              size={16}
              weight="bold"
              lineHeight={18}
              align="center"
              style={{ includeFontPadding: false, textAlignVertical: 'center' }}
            >
              {quantity}
            </OText>
          </QuantityValue>
          {!isCartPending && (
            <StepButton testID={`maweja-qty-plus-${product?.id}`} $square onPress={() => setQty(quantity + 1)} disabled={quantity >= max}>
              <Ionicons name="add" size={18} color={theme.colors.white} />
            </StepButton>
          )}
        </Stepper>
      </ProductBody>
    </ProductRow>
  )
}

export const MawejaCartSection = (props: any) => {
  const { cart, changeQuantity, getProductMax, removeProduct, handleChangeComment, onNavigationRedirect } = props
  const theme = useTheme()
  const [, t] = useLanguage()
  const [{ user }] = useSession()
  const [comment, setComment] = useState(cart?.comment || '')
  const brand = themeBrandColor(theme)
  // The API rejects any change to a cart with a payment in progress
  const isCartPending = cart?.status === 2

  const onComment = (value: string) => {
    setComment(value)
    handleChangeComment?.(value, user?.id)
  }

  return (
    <>
      {cart?.business?.vertical === 'school' && <CartStudentAlert cart={cart} />}
      <Card>
        {!!cart?.business?.name && (
          <StoreBanner>
            <Ionicons name="bag-handle-outline" size={16} color={brand} />
            <OText size={13} weight="bold" color={brand} style={{ marginLeft: 8 }} numberOfLines={1}>
              {String(cart.business.name).toUpperCase()}
            </OText>
          </StoreBanner>
        )}
        {cart?.products?.map((product: any) => (
          <MawejaProduct
            key={product.code || product.id}
            product={product}
            cart={cart}
            changeQuantity={changeQuantity}
            getProductMax={getProductMax}
            removeProduct={removeProduct}
            isCartPending={isCartPending}
          />
        ))}
        {!!cart?.business?.slug && !isCartPending && (
          <AddMore
            testID="maweja-add-products"
            onPress={() => onNavigationRedirect?.('Business', { store: cart.business.slug })}
          >
            <OText size={15} weight="bold" color={brand}>{`+ ${t('ADD_MORE_PRODUCTS', 'Add more products')}`}</OText>
          </AddMore>
        )}
      </Card>
      <SectionCard>
        <SectionTitle>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={brand} />
          <OText size={15} weight="bold" style={{ marginLeft: 8 }}>{t('SPECIAL_INSTRUCTIONS', 'Special instructions')}</OText>
        </SectionTitle>
        <CommentInput
          testID="maweja-cart-comment"
          value={comment}
          onChangeText={onComment}
          placeholder={t('SPECIAL_COMMENTS', 'Special Comments')}
          placeholderTextColor={theme.colors.textSecondary}
          editable={!isCartPending}
          multiline
        />
      </SectionCard>
    </>
  )
}

export const MawejaCartPage = (props: any) => {
  const { onNavigationRedirect, navigation, refreshing, onRefresh, businessSlug } = props
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const keyboardInset = useKeyboardInset()
  const [, t] = useLanguage()
  const [{ auth, user }] = useSession()
  const [{ configs }] = useConfig()
  const [{ parsePrice }] = useUtils()
  const [validationFields] = useValidationFields()
  const [orderState, { clearCart }] = useOrder()
  const [openUpselling, setOpenUpselling] = useState(false)
  const [canOpenUpselling, setCanOpenUpselling] = useState(false)

  const carts = useMemo(() => {
    const list = cartsWithProducts(orderState?.carts, orderState?.options?.type)
    if (!businessSlug) return list
    return list.filter((cart: any) => (
      cart?.business?.slug === businessSlug || String(cart?.business_id) === String(businessSlug)
    ))
  }, [orderState?.carts, orderState?.options?.type, businessSlug])
  const itemCount = carts.reduce((sum: number, cart: any) => (
    sum + (cart?.products || []).reduce((qty: number, product: any) => qty + (product?.quantity || 0), 0)
  ), 0)
  const primaryCart = carts.length === 1 ? carts[0] : null
  // The API rejects any change to a cart with a payment in progress
  const clearableCarts = carts.filter((cart: any) => cart?.status !== 2)
  const isPrimaryCartPending = !!primaryCart && !clearableCarts.length
  const isDelivery = deliveryTypes.includes(orderState?.options?.type)
  const address = orderState?.options?.address?.address
  const brand = themeBrandColor(theme)
  const couponEnabled = validationFields?.fields?.checkout?.coupon?.enabled
  const belowMinimum = primaryCart ? belowMinimumFor(primaryCart) : false
  const checkoutDisabled = !carts.length || (openUpselling && !canOpenUpselling) || (
    !!primaryCart && (!primaryCart.valid_maximum || belowMinimum || !primaryCart.valid_address)
  )

  const goToAddress = () => {
    if (auth) {
      onNavigationRedirect?.('AddressList', { isGoBack: true })
      return
    }
    onNavigationRedirect?.('AddressForm', {
      address: orderState?.options?.address,
      isGoBack: true
    })
  }

  const handleUpsellingPage = (individualCart: any) => {
    setOpenUpselling(false)
    setCanOpenUpselling(false)
    const cart = individualCart || primaryCart
    onNavigationRedirect?.('CheckoutPage', {
      cartUuid: cart?.uuid,
      businessLogo: cart?.business?.logo,
      businessName: cart?.business?.name,
      cartTotal: cart?.total
    })
  }

  const handleCheckout = () => {
    if (carts.length === 1 && primaryCart?.business_id) {
      setOpenUpselling(true)
      return
    }
    if (carts.length === 1) {
      onNavigationRedirect?.('CheckoutPage', {
        cartUuid: primaryCart?.uuid,
        cartTotal: primaryCart?.total
      }, true)
      return
    }
    const isMulti = configs?.checkout_multi_business_enabled?.value === '1'
    if (!isMulti) {
      onNavigationRedirect?.('CheckoutPage', { cartUuid: carts[0]?.uuid })
      return
    }
    onNavigationRedirect?.('MultiCheckout', { checkCarts: true })
  }

  const checkoutLabel = !primaryCart
    ? t('CHECKOUT', 'Checkout')
    : !primaryCart.valid_address
      ? t('OUT_OF_COVERAGE', 'Out of Coverage')
      : !primaryCart.valid_maximum
        ? `${t('MAXIMUM_SUBTOTAL_ORDER', 'Maximum subtotal order')}: ${parsePrice(primaryCart.maximum)}`
        : belowMinimum
          ? `${t('MINIMUN_SUBTOTAL_ORDER', 'Minimum subtotal order:')} ${parsePrice(primaryCart.minimum)}`
          : !openUpselling !== canOpenUpselling
            ? t('CHECKOUT', 'Checkout')
            : t('LOADING', 'Loading')

  const subtotal = primaryCart ? primaryCart.subtotal : carts.reduce((sum: number, cart: any) => sum + (cart?.subtotal || 0), 0)
  const delivery = primaryCart
    ? (primaryCart.delivery_price_with_discount ?? primaryCart.delivery_price ?? 0)
    : carts.reduce((sum: number, cart: any) => sum + (cart?.delivery_price_with_discount || 0), 0)
  const serviceFee = primaryCart
    ? serviceFeeFor(primaryCart)
    : carts.reduce((sum: number, cart: any) => sum + serviceFeeFor(cart), 0)
  const total = primaryCart ? primaryCart.total : carts.reduce((sum: number, cart: any) => sum + (cart?.total || 0), 0)
  const zoneName = primaryCart?.zone?.name || primaryCart?.delivery_zone?.name

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
        contentContainerStyle={{ paddingBottom: insets.bottom + keyboardInset + 96 }}
      >
        <PageHeader>
          <HeaderBack testID="maweja-cart-back" onPress={() => leaveToCheckoutOrBack(navigation, props.route)}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.black} />
          </HeaderBack>
          <HeaderCopy>
            <View testID="maweja-cart-title">
              <OText size={22} weight="bold">{t('MY_CART', 'My cart')}</OText>
            </View>
            <OText size={13} color={theme.colors.textSecondary} mTop={2}>
              {`${itemCount} ${t(itemCount === 1 ? 'PRODUCT' : 'PRODUCTS', itemCount === 1 ? 'Product' : 'Products')}`}
            </OText>
          </HeaderCopy>
          {clearableCarts.length > 0 && (
            <OAlert
              title={t('CLEAR_CART', 'Clear Cart')}
              message={t('QUESTION_CLEAR_CART', 'Are you sure that you want to clear the cart?')}
              onAccept={() => clearableCarts.forEach((cart: any) => clearCart(cart?.uuid))}
            >
              <ClearButton testID="maweja-cart-clear">
                <Ionicons name="trash-outline" size={20} color={brand} />
              </ClearButton>
            </OAlert>
          )}
        </PageHeader>

        {carts.length === 0 && (
          <NotFoundSource
            hideImage
            content={t('CARTS_NOT_FOUND', 'You don\'t have carts available')}
            btnTitle={t('START_SHOPPING', 'Start shopping')}
            onClickButton={() => onNavigationRedirect?.('AddressList')}
          />
        )}

        {carts.map((cart: any) => (
          <CartController
            key={cart.uuid}
            cart={cart}
            cartuuid={cart.uuid}
            onNavigationRedirect={onNavigationRedirect}
            businessConfigs={cart?.business?.configs}
            UIComponent={MawejaCartSection}
          />
        ))}

        {(user?.name || user?.email || user?.cellphone) && (
          <SectionCard>
            <SectionTitle>
              <Ionicons name="person-outline" size={16} color={brand} />
              <OText size={15} weight="bold" style={{ marginLeft: 8 }}>{t('CUSTOMER_DETAILS', 'Customer Details')}</OText>
            </SectionTitle>
            {!!user?.name && (
              <InfoLine>
                <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
                <OText size={14} style={{ marginLeft: 8 }}>{[user.name, user.lastname].filter(Boolean).join(' ')}</OText>
              </InfoLine>
            )}
            {!!user?.email && (
              <InfoLine>
                <Ionicons name="mail-outline" size={14} color={theme.colors.textSecondary} />
                <OText size={14} style={{ marginLeft: 8 }}>{user.email}</OText>
              </InfoLine>
            )}
            {!!user?.cellphone && (
              <InfoLine>
                <Ionicons name="call-outline" size={14} color={theme.colors.textSecondary} />
                <OText size={14} style={{ marginLeft: 8 }}>{user.cellphone}</OText>
              </InfoLine>
            )}
          </SectionCard>
        )}

        <SectionCard testID="maweja-cart-address">
          <SectionTitle style={{ justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="location-outline" size={16} color={brand} />
              <OText size={15} weight="bold" style={{ marginLeft: 8 }} numberOfLines={1}>
                {isDelivery ? t('DELIVERY_ADDRESS', 'Delivery address') : t('PICKUP_ADDRESS', 'Pickup Address')}
              </OText>
            </View>
            <TouchableOpacity testID="maweja-cart-change-address" onPress={goToAddress}>
              <OText size={14} weight="bold" color={brand}>{`${t('CHANGE', 'Change')} >`}</OText>
            </TouchableOpacity>
          </SectionTitle>
          <AddressPill>
            <Ionicons name="location-outline" size={14} color={brand} />
            <OText size={14} style={{ marginLeft: 8, flex: 1 }} numberOfLines={2}>
              {address || t('WHAT_IS_YOUR_ADDRESS', 'What\'s your address?')}
            </OText>
          </AddressPill>
        </SectionCard>

        {carts.length > 0 && (
          <SectionCard>
            <TotalRow>
              <OText size={14} color={theme.colors.textSecondary}>{t('SUBTOTAL', 'Subtotal')}</OText>
              <OText size={14}>{parsePrice(subtotal)}</OText>
            </TotalRow>
            {isDelivery && (
              <TotalRow>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <OText size={14} color={theme.colors.textSecondary}>{t('DELIVERY_FEE', 'Delivery fee')}</OText>
                  {!!zoneName && (
                    <OText size={11} color={theme.colors.white} style={{ marginLeft: 8, backgroundColor: theme.colors.success500, overflow: 'hidden', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                      {zoneName}
                    </OText>
                  )}
                </View>
                <OText size={14}>{parsePrice(delivery)}</OText>
              </TotalRow>
            )}
            {serviceFee > 0 && (
              <TotalRow>
                <OText size={14} color={theme.colors.textSecondary}>{t('SERVICE_FEE', 'Service fee')}</OText>
                <OText size={14}>{parsePrice(serviceFee)}</OText>
              </TotalRow>
            )}
            {couponEnabled && primaryCart && !isPrimaryCartPending && (
              <CouponControl
                businessId={primaryCart.business_id}
                price={primaryCart.total}
                cart={primaryCart}
                onOpenOffers={() => onNavigationRedirect?.('CouponOffers', {
                  businessId: primaryCart.business_id,
                  cartUuid: primaryCart.uuid
                })}
              />
            )}
            <TotalRow style={{ marginBottom: 0, marginTop: 4 }}>
              <OText size={16} weight="bold">{t('TOTAL', 'Total')}</OText>
              <OText size={18} weight="bold" color={brand}>{parsePrice(total)}</OText>
            </TotalRow>
          </SectionCard>
        )}
      </ScrollView>

      {openUpselling && primaryCart && (
        <UpsellingProducts
          handleUpsellingPage={handleUpsellingPage}
          openUpselling={openUpselling}
          businessId={primaryCart.business_id}
          business={primaryCart.business}
          cartProducts={primaryCart.products}
          canOpenUpselling={canOpenUpselling}
          setCanOpenUpselling={setCanOpenUpselling}
          handleCloseUpsellingPage={() => setOpenUpselling(false)}
          isFromCart
        />
      )}

      {carts.length > 0 && (
        <CheckoutBar style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <OButton
            testID="maweja-cart-checkout"
            text={checkoutLabel}
            disabled={checkoutDisabled}
            onClick={handleCheckout}
            style={{ width: '100%', borderRadius: 16, flexDirection: 'row', justifyContent: 'center' }}
            textStyle={{ textAlign: 'center', flex: 1 }}
          />
        </CheckoutBar>
      )}
    </Screen>
  )
}

export const MawejaCartList = (props: any) => {
  const { navigation, refreshing, onRefresh } = props
  const theme = useTheme()
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils()
  const [orderState, { clearCart }] = useOrder()
  const brand = themeBrandColor(theme)
  const carts = useMemo(
    () => cartsWithProducts(orderState?.carts, orderState?.options?.type),
    [orderState?.carts, orderState?.options?.type]
  )

  const openCart = (cart: any) => {
    navigation?.push?.('Cart', { businessSlug: cart?.business?.slug || cart?.business_id })
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <PageHeader>
          <HeaderBack testID="maweja-cart-list-back" onPress={() => leaveToCheckoutOrBack(navigation, props.route)}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.black} />
          </HeaderBack>
          <HeaderCopy>
            <View testID="maweja-cart-list-title">
              <OText size={22} weight="bold">{t('MY_CARTS', 'My carts')}</OText>
            </View>
            <OText size={13} color={theme.colors.textSecondary} mTop={2}>
              {`${carts.length} ${t(carts.length === 1 ? 'CART' : 'CARTS', carts.length === 1 ? 'Cart' : 'Carts')}`}
            </OText>
          </HeaderCopy>
        </PageHeader>

        {carts.length === 0 && (
          <NotFoundSource
            hideImage
            content={t('CARTS_NOT_FOUND', 'You don\'t have carts available')}
            btnTitle={t('START_SHOPPING', 'Start shopping')}
            onClickButton={() => navigation?.navigate?.('BottomTab', { screen: 'Home' })}
          />
        )}

        {carts.map((cart: any) => {
          const count = (cart?.products || []).reduce((sum: number, product: any) => sum + (product?.quantity || 0), 0)
          return (
            <CartListCard key={cart.uuid}>
              <TouchableOpacity
                testID={`maweja-cart-row-${cart.uuid}`}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => openCart(cart)}
              >
                <CartListCopy>
                  <OText size={16} weight="bold" numberOfLines={1}>{cart?.business?.name}</OText>
                  <OText size={13} color={theme.colors.textSecondary} mTop={4}>
                    {`${count} ${t(count === 1 ? 'PRODUCT' : 'PRODUCTS', count === 1 ? 'Product' : 'Products')}`}
                  </OText>
                </CartListCopy>
                <OText size={15} weight="bold" color={brand}>{parsePrice(cart?.total)}</OText>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {cart?.status !== 2 && (
                <OAlert
                  title={t('CLEAR_CART', 'Clear Cart')}
                  message={t('QUESTION_CLEAR_CART', 'Are you sure that you want to clear the cart?')}
                  onAccept={() => clearCart(cart?.uuid)}
                >
                  <ClearButton testID={`maweja-cart-row-clear-${cart.uuid}`}>
                    <Ionicons name="trash-outline" size={18} color={brand} />
                  </ClearButton>
                </OAlert>
              )}
            </CartListCard>
          )
        })}
      </ScrollView>
    </Screen>
  )
}
