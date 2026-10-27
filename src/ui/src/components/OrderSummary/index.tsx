import React, { useState, useRef } from 'react';
import { ActivityIndicator, Alert, Platform, View, TouchableOpacity, TextInput } from 'react-native'
import { useTheme } from 'styled-components/native';
import AntIcon from 'react-native-vector-icons/AntDesign'
import FA5Icon from 'react-native-vector-icons/FontAwesome5'

import {
  OSContainer,
  OSProductList,
  OSBill,
  OSTable,
  OSRow,
  Divider,
  ClearCartButton,
  LoyaltyCard,
  TaxesFeesDetail
} from './styles';

import {
  Cart,
  useOrder,
  useLanguage,
  useUtils,
  useConfig
} from '@components';

import { verifyDecimals, capitalize } from '../../utils';
import { deleteCartProduct } from '../../../../utils/giftCardCart'
import {
  ProductItemAccordion,
  CouponControl,
  TaxInformation,
  MomentOption,
  OInput, OModal, OText, OAlert, OButton
} from '@ui'
import { MawejaInvoiceHeader, MawejaNotices, MawejaTotalRule, MawejaZoneBadge } from '../Checkout/layouts/Maweja'
import { themeBrandColor } from '@/utils/themeBrandColor'

const deliveryTypes = [1, 7]

export const OrderSummaryUI = (props: any) => {
  const {
    changeQuantity,
    getProductMax,
    offsetDisabled,
    removeProduct,
    isCartPending,
    isFromCheckout,
    commentState,
    handleChangeComment,
    onNavigationRedirect,
    handleRemoveOfferClick,
    preorderSlotInterval,
    preorderLeadTime,
    preorderTimeRange,
    preorderMaximumDays,
    preorderMinimumDays,
    cateringTypes,
    hideDeliveryFee,
    loyaltyRewardRate,
    maxDate,
    hideTotal,
    clearCart,
    hideProducts,
    showOnlyProducts,
    hideCommentsByValidationCheckout,
    hideCouponByValidationCheckout,
    onCommentFocus,
    layout,
    businessName,
    deliveryTime
  } = props;

  const theme = useTheme()
  const [, t] = useLanguage();
  const [{ configs }] = useConfig();
  const [orderState] = useOrder();
  const [{ parsePrice, parseNumber }] = useUtils();
  const commentRef = useRef<TextInput>(null)
  const [openTaxModal, setOpenTaxModal] = useState<any>({ open: false, data: null, type: '' })
  const [showTaxesFeesDetail, setShowTaxesFeesDetail] = useState(false)
  const hideCartDiscount = hideCouponByValidationCheckout
  const hideCartComments = hideCommentsByValidationCheckout

  const cart = orderState?.carts?.[`businessId:${props.cart.business_id}`]
  const isMawejaBill = layout === 'maweja'
  const zoneName = cart?.zone?.name || cart?.delivery_zone?.name || ''
  const articleCount = (cart?.products || []).reduce((sum: number, product: any) => sum + (Number(product?.quantity) || 0), 0)
  const timeText = (() => {
    if (deliveryTime == null || deliveryTime === '') return ''
    const text = String(deliveryTime)
    if (text.includes('-') || text.includes('–')) {
      return text.toLowerCase().includes('min') ? text : `${text} min`
    }
    return text
  })()
  const extraValueMetafields = cart?.metafields?.filter?.((meta: any) => meta?.key?.startsWith('extra_value_')) || []

  const productTaxesList = cart?.taxes?.filter((tax: any) => tax.type === 2 && tax?.rate !== 0 && tax?.target === 'product') || []
  const feesList = cart?.fees?.filter((fee: any) => !(fee.fixed === 0 && fee.percentage === 0)) || []
  const taxesAndFeesTotal =
    productTaxesList.reduce((acc: number, tax: any) => acc + (tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0), 0) +
    feesList.reduce((acc: number, fee: any) => acc + (fee?.summary?.amount ?? (fee?.summary?.fixed + (fee?.summary?.percentage_after_discount ?? fee?.summary?.percentage))), 0)

  const walletName: any = {
    cash: {
      name: t('PAY_WITH_CASH_WALLET', 'Pay with Cash Wallet'),
    },
    credit_point: {
      name: t('PAY_WITH_CREDITS_POINTS_WALLET', 'Pay with Credit Points Wallet'),
    }
  }

  const getIncludedTaxes = (isDeliveryFee?: boolean) => {
    if (cart?.taxes === null || !cart?.taxes) {
      return cart?.business?.tax_type === 1 ? cart?.tax : 0
    } else {
      return cart?.taxes.reduce((taxIncluded: number, tax: any) => {
        return taxIncluded +
          (((!isDeliveryFee && tax.type === 1 && tax.target === 'product') ||
            (isDeliveryFee && tax.type === 1 && tax.target === 'delivery_fee')) ? tax.summary?.tax : 0)
      }, 0)
    }
  }

  const clearAmount = (value: any) => parseFloat((Math.trunc(value * 100) / 100).toFixed(configs.format_number_decimal_length?.value ?? 2))
  const deliveryTotalForFreeCheck = clearAmount(
    (Number(cart?.delivery_price_with_discount ?? cart?.delivery_price) || 0) + getIncludedTaxes(true),
  )
  const freeDeliveryMetaRaw = cart?.metafields?.find?.((m: any) => m?.key === 'extra_value_free_delivery')?.value
  const parsedFreeDeliveryMeta = freeDeliveryMetaRaw != null ? Number(freeDeliveryMetaRaw) : NaN
  const isDeliveryFreeViaMetafield =
    deliveryTotalForFreeCheck > 0 &&
    Number.isFinite(parsedFreeDeliveryMeta) &&
    clearAmount(parsedFreeDeliveryMeta + deliveryTotalForFreeCheck) === 0

  const rawFreeDeliveryPartnerName = cart?.metafields?.find?.((m: any) => m?.key === 'free_delivery_partner_name')?.value
  const freeDeliveryPartnerName = ((): string => {
    if (rawFreeDeliveryPartnerName == null || rawFreeDeliveryPartnerName === '') return ''
    if (typeof rawFreeDeliveryPartnerName === 'string') {
      try {
        const parsed = JSON.parse(rawFreeDeliveryPartnerName)
        return typeof parsed === 'string' ? parsed.trim() : String(parsed).trim()
      } catch {
        return rawFreeDeliveryPartnerName.trim()
      }
    }
    return String(rawFreeDeliveryPartnerName).trim()
  })()
  const freeDeliveryFeeTooltipMessage = isDeliveryFreeViaMetafield
    ? (freeDeliveryPartnerName
      ? t('FREE_DELIVERY_FOR', 'Free delivery for') + ' ' + freeDeliveryPartnerName + ' ' + t('CARDHOLDERS', 'Cardholders')
      : t('FREE_DELIVERY', 'Free delivery'))
    : ''

  const loyaltyRewardValue = clearAmount((cart?.subtotal + getIncludedTaxes()) * loyaltyRewardRate)
  const isDisabledRewards = configs?.disabled_rewards?.value === '1'
  const loyaltyRewardMessage = t('RECEIVE_LOYALTY_POINT', 'You could receive :amount: points for this purchase.')
  const [loyaltyRewardMessageStart, loyaltyRewardMessageEnd] = loyaltyRewardMessage.split(':amount:')
  const showLoyaltyReward = !isDisabledRewards && !!loyaltyRewardValue && isFinite(loyaltyRewardValue)

  const handleDeleteClick = (product: any) => {
    deleteCartProduct({
      cart,
      product,
      removeProduct,
      clearCart
    })
  }

  const handleEditProduct = (product: any) => {
    onNavigationRedirect('ProductDetails', {
      isCartProduct: true,
      productCart: product,
      businessSlug: cart?.business?.slug,
      businessId: cart?.business_id,
      categoryId: product?.category_id,
      productId: product?.id,
      isFromCheckout: isFromCheckout,
    })
  }

  const handleClearProducts = async () => {
    try {
      await clearCart(cart?.uuid)
    } catch { }
  }

  const getIncludedTaxesDiscounts = () => {
    return cart?.taxes?.filter((tax: any) => (tax?.type === 1 && tax?.target === 'product'))?.reduce((carry: number, tax: any) => carry + (tax?.summary?.tax_after_discount ?? tax?.summary?.tax), 0)
  }

  const OfferAlert = ({ offerId }: any) => {
    return (
      <OAlert
        title={t('OFFER', 'Offer')}
        message={t('QUESTION_DELETE_OFFER', 'Are you sure that you want to delete the offer?')}
        onAccept={() => handleRemoveOfferClick(offerId)}
      >
        <AntIcon style={{ marginLeft: 3 }} name='closecircle' size={16} color={theme.colors.primary} />
      </OAlert>
    )
  }

  return (
    <OSContainer>
      {cart?.products?.length > 0 && (
        <>
          {!hideProducts && (
            <OSProductList>
              {cart?.products?.map((product: any) => (
                <ProductItemAccordion
                  key={product.code}
                  product={product}
                  isCartProductView={props.isCartProductView}
                  isCartPending={isCartPending}
                  isCartProduct
                  changeQuantity={changeQuantity}
                  getProductMax={getProductMax}
                  offsetDisabled={offsetDisabled}
                  onDeleteProduct={handleDeleteClick}
                  onEditProduct={handleEditProduct}
                  isFromCheckout={isFromCheckout}
                  isDisabledEdit={!cart?.business_id}
                />
              ))}
            </OSProductList>
          )}
          {showOnlyProducts && (
            <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row' }}>
              <OAlert
                title={t('CLEAR_CART', 'Clear Cart')}
                message={t('QUESTION_CLEAR_CART', 'Are you sure that you want to clear the cart?')}
                onAccept={() => handleClearProducts()}
              >
                <ClearCartButton>
                  <OText size={16} color={theme.colors.danger} weight={'600'}>
                    {t('CLEAR_CART', 'Clear Cart')}
                  </OText>
                </ClearCartButton>
              </OAlert>
            </View>
          )}
          {!showOnlyProducts && (
            <>
              {cart?.valid && (
                <OSBill style={isMawejaBill ? {
                  backgroundColor: theme.colors.backgroundCard || theme.colors.white,
                  borderRadius: 18,
                  marginBottom: 12
                } : undefined}>
                  {isMawejaBill && (
                    <MawejaInvoiceHeader
                      title={t('INVOICE', 'Invoice')}
                      brand={businessName || cart?.business?.name}
                    />
                  )}
                  <OSTable>
                    <OText size={12}>{isMawejaBill
                      ? `${t('SUBTOTAL', 'Subtotal')} (${articleCount})`
                      : t('SUBTOTAL', 'Subtotal')}
                    </OText>
                    <OText size={12}>
                      {parsePrice(cart?.subtotal + getIncludedTaxes())}
                    </OText>
                  </OSTable>
                  {cart?.discount > 0 && cart?.total >= 0 && cart?.offers?.length === 0 && (
                    <OSTable>
                      {cart?.discount_type === 1 ? (
                        <OText size={12}>
                          {t('DISCOUNT', 'Discount')}
                          <OText size={12}>{`(${verifyDecimals(cart?.discount_rate, parsePrice)}%)`}</OText>
                        </OText>
                      ) : (
                        <OText size={12}>{t('DISCOUNT', 'Discount')}</OText>
                      )}
                      <OText size={12}>- {parsePrice(cart?.discount || 0)}</OText>
                    </OSTable>
                  )}
                  {
                    cart?.offers?.length > 0 && cart?.offers?.filter((offer: any) => offer?.target === 1)?.map((offer: any) => (
                      <OSTable key={offer.id}>
                        <OSRow>
                          <OText size={12}>{offer.name}</OText>
                          {offer.rate_type === 1 && (
                            <OText size={12}>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</OText>
                          )}
                          <TouchableOpacity style={{ marginLeft: 3 }} onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_1' })}>
                            <AntIcon name='infocirlceo' size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                          {!!offer?.id && (
                            <OfferAlert offerId={offer?.id} />
                          )}
                        </OSRow>
                        <OText size={12}>
                          - {parsePrice(offer?.summary?.discount)}
                        </OText>
                      </OSTable>
                    ))
                  }
                  {cart?.offers?.filter((offer: any) => offer?.target === 1)?.length > 0 &&
                    cart?.subtotal_with_discount > 0 &&
                    cart?.discount > 0 &&
                    cart?.total >= 0 && (
                      <OSTable>
                        <OText size={12} numberOfLines={1}>{t('SUBTOTAL_WITH_DISCOUNT', 'Subtotal with discount')}</OText>
                        {cart?.business?.tax_type === 1 ? (
                          <OText size={12}>{parsePrice(cart?.subtotal_with_discount + getIncludedTaxesDiscounts())}</OText>
                        ) : (
                          <OText size={12}>{parsePrice(cart?.subtotal_with_discount ?? 0)}</OText>
                        )}
                      </OSTable>
                    )}
                  {(productTaxesList.length > 0 || feesList.length > 0) && !isMawejaBill && (
                    <>
                      <OSTable>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => setShowTaxesFeesDetail(!showTaxesFeesDetail)}
                          accessibilityRole='button'
                          accessibilityState={{ expanded: showTaxesFeesDetail }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <OText size={12}>{t('TAXES_AND_FEES', 'Taxes and fees')}</OText>
                          <View style={{ marginLeft: 6, transform: [{ rotate: showTaxesFeesDetail ? '180deg' : '0deg' }] }}>
                            <AntIcon name='down' size={14} color={theme.colors.textSecondary} />
                          </View>
                        </TouchableOpacity>
                        <OText size={12}>{parsePrice(taxesAndFeesTotal)}</OText>
                      </OSTable>
                      {showTaxesFeesDetail && (
                        <TaxesFeesDetail>
                          {productTaxesList.map((tax: any, i: number) => (
                            <OSTable key={tax.id ?? `tax_${i}`}>
                              <OSRow>
                                <OText size={12} color={theme.colors.textSecondary} numberOfLines={1} >
                                  {tax.name || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}{' '}
                                  {`(${verifyDecimals(tax?.rate, parseNumber)}%)`}{' '}
                                </OText>
                                <TouchableOpacity onPress={() => setOpenTaxModal({ open: true, data: tax, type: 'tax' })} >
                                  <AntIcon name='infocirlceo' size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                              </OSRow>
                              <OText size={12} color={theme.colors.textSecondary}>{parsePrice(tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0)}</OText>
                            </OSTable>
                          ))}
                          {feesList.map((fee: any, i: number) => (
                            <OSTable key={(fee?.id ?? 'fee') + `_${i}`}>
                              <OSRow>
                                <OText size={12} color={theme.colors.textSecondary} numberOfLines={1}>
                                  {fee.name || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}{' '}
                                  ({fee?.fixed > 0 && `${parsePrice(fee?.fixed)}${fee.percentage > 0 ? ' + ' : ''}`}{fee.percentage > 0 && `${fee.percentage}%`}){' '}
                                </OText>
                                <TouchableOpacity onPress={() => setOpenTaxModal({ open: true, data: fee, type: 'fee' })} >
                                  <AntIcon name='infocirlceo' size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                              </OSRow>
                              <OText size={12} color={theme.colors.textSecondary}>{parsePrice(fee?.summary?.amount ?? (fee?.summary?.fixed + (fee?.summary?.percentage_after_discount ?? fee?.summary?.percentage)))}</OText>
                            </OSTable>
                          ))}
                        </TaxesFeesDetail>
                      )}
                    </>
                  )}
                  {isMawejaBill && feesList.map((fee: any, i: number) => (
                    <OSTable key={(fee?.id ?? 'fee') + `_maweja_${i}`}>
                      <OText size={14}>{fee.name || t('SERVICE_FEE', 'Service fee')}</OText>
                      <OText size={14}>{parsePrice(fee?.summary?.amount ?? (fee?.summary?.fixed + (fee?.summary?.percentage_after_discount ?? fee?.summary?.percentage)))}</OText>
                    </OSTable>
                  ))}
                  {isMawejaBill && productTaxesList.map((tax: any, i: number) => (
                    <OSTable key={(tax?.id ?? 'tax') + `_maweja_${i}`}>
                      <OText size={14}>{tax.name || t('TAX', 'Tax')}</OText>
                      <OText size={14}>{parsePrice(tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0)}</OText>
                    </OSTable>
                  ))}
                  {
                    cart?.offers?.length > 0 && cart?.offers?.filter((offer: any) => offer?.target === 3)?.map((offer: any) => (
                      <OSTable key={offer.id}>
                        <OSRow>
                          <OText size={12}>{offer.name}</OText>
                          {offer.rate_type === 1 && (
                            <OText size={12}>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</OText>
                          )}
                          <TouchableOpacity style={{ marginLeft: 3 }} onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_3' })}>
                            <AntIcon name='infocirlceo' size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                          {!!offer?.id && (
                            <OfferAlert offerId={offer?.id} />
                          )}
                        </OSRow>
                        <OText size={12}>
                          - {parsePrice(offer?.summary?.discount)}
                        </OText>
                      </OSTable>
                    ))
                  }
                  {deliveryTypes.includes(orderState?.options?.type) && !hideDeliveryFee && cart?.business_id && (
                    <OSTable>
                      {isDeliveryFreeViaMetafield ? (
                        <OSRow style={{ alignItems: 'center' }}>
                          <OText size={12}>{t('DELIVERY_FEE', 'Delivery Fee')}</OText>
                          <View
                            style={{ marginLeft: 6 }}
                            {...(Platform.OS === 'web' ? ({ title: freeDeliveryFeeTooltipMessage } as Record<string, string>) : {})}
                          >
                            <TouchableOpacity
                              onPress={() => {
                                if (Platform.OS !== 'web') {
                                  Alert.alert(t('DELIVERY_FEE', 'Delivery Fee'), freeDeliveryFeeTooltipMessage)
                                }
                              }}
                              accessibilityLabel={freeDeliveryFeeTooltipMessage}
                              accessibilityRole='button'
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <AntIcon name='infocirlceo' size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </OSRow>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <OText size={12}>{t('DELIVERY_FEE', 'Delivery Fee')}</OText>
                          {isMawejaBill && <MawejaZoneBadge name={zoneName} />}
                        </View>
                      )}
                      {isDeliveryFreeViaMetafield ? (
                        <OSRow style={{ alignItems: 'center' }}>
                          <OText
                            size={12}
                            style={{ textDecorationLine: 'line-through', color: theme.colors.disabled || '#9E9E9E', marginRight: 6 }}
                          >
                            {parsePrice((cart?.delivery_price_with_discount ?? cart?.delivery_price) + getIncludedTaxes(true))}
                          </OText>
                          <OText size={12} weight={'600'} color={theme.colors.primary}>
                            {t('FREE', 'Free')}
                          </OText>
                        </OSRow>
                      ) : (
                        <OText size={12}>{parsePrice(cart?.delivery_price + getIncludedTaxes(true))}</OText>
                      )}
                    </OSTable>
                  )}
                  {cart?.extra_value_checkprice && cart?.extra_value_checkprice > 0 && (
                    <OSTable>
                      <OText size={12}>{t('EXTRA_VALUE_CHECKPRICE', 'Extra value checkprice')}</OText>
                      <OText size={12}>{parsePrice(cart?.extra_value_checkprice)}</OText>
                    </OSTable>
                  )}
                  {
                    cart?.taxes?.length > 0 && cart?.taxes?.filter((tax: any) => tax?.type === 2 && tax?.rate !== 0 && tax?.target === 'delivery_fee').map((tax: any, i: number) => (
                      <OSTable key={`${tax.description}_${i}`}>
                        <OSRow>
                          <OText size={12} numberOfLines={1}>
                            {tax.name || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}
                            {`(${verifyDecimals(tax?.rate, parseNumber)}%)`}
                          </OText>
                          <TouchableOpacity onPress={() => setOpenTaxModal({ open: true, data: tax, type: 'tax' })}>
                            <AntIcon name='infocirlceo' size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </OSRow>
                        <OText size={12}>{parsePrice(tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0)}</OText>
                      </OSTable>
                    ))
                  }
                  {
                    cart?.offers?.length > 0 && cart?.offers?.filter((offer: any) => offer?.target === 2)?.map((offer: any) => (
                      <OSTable key={offer.id}>
                        <OSRow>
                          <OText size={12}>{offer.name}</OText>
                          {offer.rate_type === 1 && (
                            <OText size={12}>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</OText>
                          )}
                          <TouchableOpacity style={{ marginLeft: 3 }} onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_2' })}>
                            <AntIcon name='infocirlceo' size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                          {!!offer?.id && (
                            <OfferAlert offerId={offer?.id} />
                          )}
                        </OSRow>
                        <OText size={12}>
                          - {parsePrice(offer?.summary?.discount)}
                        </OText>
                      </OSTable>
                    ))
                  }
                  {cart?.driver_tip > 0 && (
                    <OSTable>
                      <OText size={12}>
                        {t('DRIVER_TIP', 'Driver tip')}
                        {cart?.driver_tip_rate > 0 &&
                          parseInt(configs?.driver_tip_type?.value, 10) === 2 &&
                          !parseInt(configs?.driver_tip_use_custom?.value, 10) &&
                          (
                            `(${verifyDecimals(cart?.driver_tip_rate, parseNumber)}%)`
                          )}
                      </OText>
                      <OText size={12}>{parsePrice(cart?.driver_tip)}</OText>
                    </OSTable>
                  )}
                  {extraValueMetafields.filter((meta: any) =>
                    !!parseFloat(meta?.value) &&
                    !(isDeliveryFreeViaMetafield && meta?.key === 'extra_value_free_delivery'),
                  ).map((meta: any) => {
                    const strippedKey = meta?.key?.replace('extra_value_', '')
                    const langKey = meta?.key?.toUpperCase()
                    const fallback = strippedKey?.replace(/_/g, ' ')?.split(' ')?.map((word: string) => capitalize(word))?.join(' ')
                    return (
                      <OSTable key={meta?.key}>
                        <OText size={12}>
                          {t(langKey, fallback)}{' '}
                        </OText>
                        <OText size={12}>{parseFloat(meta?.value) > 0 ? parsePrice(parseFloat(meta?.value)) : `- ${parsePrice(parseFloat(meta?.value) * -1)}`}</OText>
                      </OSTable>
                    )
                  })}
                  {cart?.payment_events?.length > 0 && cart?.payment_events?.map((event: any) => (
                    <OSTable key={event.id}>
                      <OText size={12} numberOfLines={1}>
                        {walletName[cart?.wallets?.find((wallet: any) => wallet.id === event.wallet_id)?.type]?.name}
                      </OText>
                      <OText size={12}>-{parsePrice(event.amount, { isTruncable: true })}</OText>
                    </OSTable>
                  ))}
                  {!hideCartDiscount && !isCartPending && cart?.business_id && (
                    <View>
                      <View style={{ paddingVertical: 5 }}>
                        <CouponControl
                          businessId={cart.business_id}
                          price={cart.total}
                          cart={cart}
                          onOpenOffers={() => onNavigationRedirect('CouponOffers', {
                            businessId: cart.business_id,
                            cartUuid: cart.uuid
                          })}
                        />
                      </View>
                    </View>
                  )}
                  {showLoyaltyReward && !isMawejaBill && (
                    <LoyaltyCard>
                      <FA5Icon name='trophy' size={32} color={'#FFC107'} style={{ marginRight: 18, transform: [{ rotate: '15deg' }] }} />
                      <View style={{ flex: 1 }}>
                        <OText size={13} weight={'bold'} color={theme.colors.textNormal}>
                          {loyaltyRewardMessageStart}
                          <OText size={13} weight={'bold'} color={theme.colors.primary}>{loyaltyRewardValue}</OText>
                          {loyaltyRewardMessageEnd}
                        </OText>
                      </View>
                    </LoyaltyCard>
                  )}
                  {(isMawejaBill || (cart?.total >= 1 && !hideTotal)) && (
                    <View style={{ marginTop: isMawejaBill ? 4 : 15, borderTopWidth: isMawejaBill ? 0 : 1, borderTopColor: '#d9d9d9' }}>
                      {isMawejaBill && <MawejaTotalRule />}
                      <OSTable style={{ marginTop: isMawejaBill ? 0 : 15 }}>
                        <OText size={isMawejaBill ? 16 : 14} style={{ fontWeight: 'bold' }} color={theme.colors.textNormal}>
                          {isMawejaBill ? t('TOTAL_TO_PAY', 'Total to pay') : t('TOTAL', 'Total')}
                        </OText>
                        <OText size={isMawejaBill ? 18 : 14} style={{ fontWeight: 'bold' }} color={isMawejaBill ? themeBrandColor(theme) : theme.colors.textNormal}>
                          {parsePrice(cart?.total >= 0 ? cart?.total : 0)}
                        </OText>
                      </OSTable>
                    </View>
                  )}
                  {isMawejaBill && (
                    <MawejaNotices
                      timeTitle={t('ESTIMATED_DELIVERY', 'Estimated delivery')}
                      timeBody={timeText ? `${timeText} ${t('AFTER_CONFIRMATION', 'after confirmation')}` : ''}
                      secureTitle={t('SECURE_PAYMENT', 'Secure payment')}
                      secureBody={businessName || cart?.business?.name
                        ? t('ORDER_PROTECTED_BY', 'Your order is protected by :name:').replace(':name:', businessName || cart?.business?.name)
                        : ''}
                    />
                  )}
                  {cart?.business_id && cart?.status !== 2 && !hideCartComments && (
                    <OSTable style={{ alignItems: 'flex-start' }}>
                      <View style={{ width: '100%', marginTop: 20 }}>
                        <OText size={12} style={{ marginBottom: 10 }}>{t('COMMENTS', 'Comments')}</OText>
                        <View style={{ width: '100%' }}>
                          <OInput
                            value={cart?.comment}
                            placeholder={t('SPECIAL_COMMENTS', 'Special Comments')}
                            onChange={(value: string) => handleChangeComment(value)}
                            style={{
                              alignItems: 'flex-start',
                              width: '100%',
                              height: 120,
                              maxHeight: 120,
                              borderColor: theme.colors.border,
                              paddingRight: 50,
                              borderRadius: 8
                            }}
                            inputStyle={{
                              height: 100,
                              maxHeight: 100,
                              textAlignVertical: 'top',
                              paddingTop: 10
                            }}
                            forwardRef={commentRef}
                            multiline
                            onFocus={onCommentFocus}
                          />
                          {commentState?.loading && (
                            <View style={{ position: 'absolute', right: 20, top: 10 }}>
                              <ActivityIndicator
                                size='large'
                                color={theme.colors.primary}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    </OSTable>
                  )}
                </OSBill>
              )}
              {cateringTypes.includes(orderState?.options?.type) && maxDate && cart?.business && (
                <View>
                  <MomentOption
                    maxDate={maxDate}
                    cateringPreorder
                    isCart
                    preorderSlotInterval={preorderSlotInterval}
                    preorderLeadTime={preorderLeadTime}
                    preorderTimeRange={preorderTimeRange}
                    preorderMaximumDays={preorderMaximumDays}
                    preorderMinimumDays={preorderMinimumDays}
                    business={cart?.business}
                  />
                </View>
              )}
              <OModal
                open={openTaxModal.open}
                onClose={() => setOpenTaxModal({ open: false, data: null, type: '' })}
                title={`${openTaxModal.data?.name ||
                  t('INHERIT_FROM_BUSINESS', 'Inherit from business')} ${openTaxModal.data?.rate_type !== 2 ? `(${typeof openTaxModal.data?.rate === 'number' ? `${openTaxModal.data?.rate}%` : `${parsePrice(openTaxModal.data?.fixed ?? 0)} + ${openTaxModal.data?.percentage}%`})` : ''}  `}
              >
                <TaxInformation
                  type={openTaxModal.type}
                  data={openTaxModal.data}
                  products={cart?.products}
                />
              </OModal>
            </>
          )}
        </>
      )}
    </OSContainer>
  )
}

export const OrderSummary = (props: any) => {
  const orderSummaryProps = {
    ...props,
    UIComponent: OrderSummaryUI
  }

  return (
    <Cart {...orderSummaryProps} />
  )
}
