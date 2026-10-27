import React, { useEffect, useMemo, useState } from 'react'
import { BackHandler, ScrollView, View } from 'react-native'
import { Fade, Placeholder, PlaceholderLine, PlaceholderMedia } from 'rn-placeholder'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'styled-components/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

import {
  ToastType,
  useConfig,
  useEvent,
  useLanguage,
  useOrder,
  useSchoolStudents,
  useSession,
  useToast,
  useUtils
} from '@components'
import {
  Alert,
  FloatingButton,
  OModal,
  OText,
  ProfessionalFilter,
  ServiceForm,
  StudentOnboardingPopup,
  StudentSelector
} from '@ui'

import { BusinessProductsListingParams } from '../../../../types'
import { _removeStoreData, _retrieveStoreData } from '../../../../providers/StoreUtil'
import { convertHoursToMinutes } from '../../../../utils'
import { PressableScale } from '../../../shared/PressableScale'
import { themeBrandColor } from '@/utils/themeBrandColor'
import { openFromCheckout } from '@/utils/checkoutReturn'
import { truncateDescription } from './truncateDescription'
import { useKeyboardInset } from '../../../../hooks/useKeyboardInset'
import { UpsellingRedirect } from '../../UpsellingRedirect'
import {
  AddButton,
  BackButton,
  CategoryCaption,
  CategoryCard,
  CategoryCopy,
  CategoryImage,
  Grid,
  HeaderBack,
  Hero,
  HeroImage,
  HeroShade,
  Identity,
  IdentityCopy,
  Logo,
  LogoFrame,
  MetaItem,
  MetaRow,
  ProductCard,
  ProductCopy,
  ProductHeader,
  ProductHeaderCopy,
  ProductImage,
  Screen,
  Section,
  SkeletonCaption,
  SkeletonCard,
  SkeletonProduct
} from './styles'

const CATEGORY_SKELETONS = [0, 1, 2, 3, 4, 5]
const PRODUCT_SKELETONS = [0, 1, 2, 3]

const isOneClickConfig = (value: unknown) => value === '1' || value === 1 || value === true

const productHasOptions = (product: any) => (product?.extras?.length || 0) > 0

const timeLabel = (value: unknown) => {
  if (value == null || value === '') return ''
  const text = String(value)
  if (text.includes('-') || text.includes('–')) {
    return text.toLowerCase().includes('min') ? text : `${text} min`
  }
  return convertHoursToMinutes(text)
}

const sortedCategories = (business: any) => {
  const categories = Array.isArray(business?.categories) ? [...business.categories] : []
  return categories
    .filter((category) => category?.id != null && category.id !== 'featured')
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))
}

const countFor = (category: any, products: any[]) => {
  if (Array.isArray(category?.products) && category.products.length) return category.products.length
  return products.filter((product) => product?.category_id === category?.id).length
}

const productsFor = (category: any, loaded: any[]) => {
  const embedded = Array.isArray(category?.products) ? category.products : []
  const matched = loaded.filter((product) => product?.category_id === category?.id)
  const byId = new Map<any, any>()
    ;[...embedded, ...matched].forEach((product) => {
      if (product?.id != null) byId.set(product.id, product)
    })
  return [...byId.values()].sort((a, b) => (a.rank || 0) - (b.rank || 0))
}

export const MawejaBusinessMenu = (props: BusinessProductsListingParams) => {
  const {
    navigation,
    businessState,
    categoryState,
    handleChangeCategory,
    header,
    logo,
    alertState,
    setAlertState,
    multiRemoveProducts,
    professionalSelected,
    handleUpdateProfessionals,
    handleChangeProfessionalSelected,
    productModal,
    getNextProducts
  } = props

  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const keyboardInset = useKeyboardInset()
  const brand = themeBrandColor(theme)
  const [, t] = useLanguage()
  const [{ auth }] = useSession()
  const { refresh: refreshStudents } = useSchoolStudents()
  const [orderState, { addProduct, updateProduct }] = useOrder()
  const [{ parsePrice, optimizeImage, parseNumber }] = useUtils()
  const [, { showToast }] = useToast()
  const [{ configs }] = useConfig()
  const [events] = useEvent()

  const { business, loading, error } = businessState || { business: null, loading: false, error: null }
  const categories = useMemo(() => sortedCategories(business), [business])
  const [activeCategory, setActiveCategory] = useState<any>(null)
  const [openUpselling, setOpenUpselling] = useState(false)
  const [canOpenUpselling, setCanOpenUpselling] = useState(false)
  const [openService, setOpenService] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<any>(null)
  const isQuickAddProduct = isOneClickConfig(configs?.add_product_with_one_click?.value)
  const currentCart: any = Object.values(orderState?.carts || {}).find((cart: any) => cart?.business?.slug === business?.slug) ?? {}
  const catalogProducts = Array.isArray(categoryState?.products) ? categoryState.products : []
  const visibleProducts = activeCategory ? productsFor(activeCategory, catalogProducts) : []
  const viewOrderButtonVisible = !loading && auth && currentCart?.products?.length > 0
  const subtotalWithTaxes = (currentCart?.taxes || []).reduce((total: number, item: any) => {
    if (item?.type === 1) return total + item?.summary?.tax
    return total
  }, currentCart?.subtotal)
  const hasNoReservation = !currentCart?.reservation && orderState?.options?.type === 9
  const belowMinimum = currentCart?.reservation ? !currentCart?.valid_minimum : subtotalWithTaxes < currentCart?.minimum

  const leaveBusiness = () => {
    if (props.onGoBack) {
      props.onGoBack()
      return
    }
    if (navigation?.canGoBack() && !props.fromMulti) navigation.goBack()
    else navigation?.navigate('BottomTab')
  }

  const openCategory = (category: any) => {
    setActiveCategory(category)
    handleChangeCategory?.(category)
    events.emit('product_list_viewed', category)
  }

  const closeCategory = () => {
    setActiveCategory(null)
    handleChangeCategory?.({ id: null, name: t('ALL', 'All') })
  }

  const onProductClick = async (product: any) => {
    if (currentCart?.status === 2) {
      setAlertState?.({ open: true, content: [t('YOU_HAVE_CART_IN_PROGRESS', 'You have a cart in progress, please complete it')] })
      return
    }
    if (!productHasOptions(product) && !product.inventoried && product?.type !== 'service' && auth && isQuickAddProduct) {
      const isProductAddedToCart = currentCart?.products?.find((item: any) => item.id === product.id)
      const minimumPerOrder = product?.minimum_per_order || 1
      const cartData = currentCart?.business_id ? currentCart : { business_id: business.id }
      ReactNativeHapticFeedback.trigger('impactLight', { enableVibrateFallback: true, ignoreAndroidSystemSettings: false })
      if (isProductAddedToCart) {
        await updateProduct({
          name: product?.name,
          id: product.id,
          code: isProductAddedToCart?.code,
          quantity: isProductAddedToCart.quantity + 1
        }, cartData, isQuickAddProduct)
      } else {
        await addProduct({ ...product, quantity: minimumPerOrder }, cartData, isQuickAddProduct)
      }
    } else if (product?.type === 'service' && business?.professionals?.length > 0) {
      setCurrentProduct(product)
      setOpenService(true)
      return
    } else if (product?.enabled) {
      const productAddedToCartLength = currentCart?.products?.reduce((total: number, item: any) => {
        return total + (item?.id === product?.id ? item?.quantity : 0)
      }, 0) || 0
      const businessSummary = business ? {
        id: business.id,
        slug: business.slug,
        name: business.name,
        logo: business.logo,
        header: business.header,
        vertical: business.vertical
      } : business
      const categorySummary = product?.category
        ? { id: product.category.id, name: product.category.name, business_id: product.category.business_id }
        : product?.category
      const productSummary = { ...product, category: categorySummary }
      delete productSummary.business
      const productParams = {
        product: productSummary,
        business: businessSummary,
        businessSlug: business?.slug,
        productId: product?.id,
        categoryId: product?.category_id,
        businessId: business?.id || product?.category?.business_id,
        productAddedToCartLength,
        isRedirect: false
      }
      if ((props as any).route?.params?.fromCheckout) {
        openFromCheckout(navigation, (props as any).route, 'ProductDetails', productParams)
      } else {
        navigation?.navigate('ProductDetails', productParams)
      }
    } else {
      showToast(ToastType.Error, t('PRODUCT_NOT_FOUND', 'Product not found'))
    }
    events.emit('product_clicked', product)
  }

  useEffect(() => {
    if (business?.vertical === 'school') refreshStudents()
  }, [business?.slug, business?.vertical])

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeCategory) {
        closeCategory()
        return true
      }
      leaveBusiness()
      return true
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack)
    return () => subscription.remove()
  }, [activeCategory])

  useEffect(() => {
    if (!business && !loading && !error) {
      showToast(ToastType.Error, t('BUSINESS_NOT_FOUND', 'Business not found'))
      navigation?.navigate('BottomTab', { screen: 'Home' })
    }
  }, [business, error, loading])

  useEffect(() => {
    if (productModal?.product && !productModal?.loading && !productModal?.error) {
      onProductClick(productModal.product)
    }
  }, [productModal])

  useEffect(() => {
    const restoreAdjustedCart = async () => {
      const adjustBusinessId = await _retrieveStoreData('adjust-cart-products')
      if (!currentCart?.business_id || !adjustBusinessId) return
      _removeStoreData('adjust-cart-products')
      const unavailable = (currentCart.products || []).filter((product: any) => product.valid !== true)
      const alreadyRemoved = await _retrieveStoreData('already-removed')
      _removeStoreData('already-removed')
      if (unavailable.length > 0) {
        multiRemoveProducts && await multiRemoveProducts(unavailable, currentCart)
        return
      }
      if (alreadyRemoved === 'removed') {
        setAlertState?.({ open: true, content: [t('NOT_AVAILABLE_PRODUCT', 'This product is not available.')] })
      }
    }
    restoreAdjustedCart()
  }, [currentCart?.uuid])

  const headerUri = header || business?.header
  const logoUri = logo || business?.logo
  const description = business?.description || business?.about
  const rating = business?.reviews?.total
  const deliveryTime = timeLabel(orderState?.options?.type === 1 ? business?.delivery_time : business?.pickup_time)
  const otherTime = timeLabel(orderState?.options?.type === 1 ? business?.pickup_time : business?.delivery_time)
  const showOtherTime = Boolean(otherTime) && otherTime !== deliveryTime

  const onOrderPress = () => {
    props.onNavigationRedirect?.('Cart', { businessSlug: business?.slug })
  }
  const waitingForCategories = !activeCategory && !error && categories.length === 0 && (loading || categoryState?.loading)
  const waitingForProducts = Boolean(activeCategory) && visibleProducts.length === 0 && (loading || categoryState?.loading)

  return (
    <Screen>
      {business?.vertical === 'school' && (
        <StudentOnboardingPopup business={business} navigation={navigation} />
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 + keyboardInset + (viewOrderButtonVisible ? 72 : 0) }}
        onScroll={({ nativeEvent }) => {
          if (!activeCategory || !business?.lazy_load_products_recommended || !getNextProducts) return
          const hasMore = categoryState?.pagination?.totalPages !== categoryState?.pagination?.currentPage
          const nearEnd = nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height + 400 > nativeEvent.contentSize.height
          if (nearEnd && hasMore && !categoryState?.loading) getNextProducts()
        }}
        scrollEventThrottle={16}
      >
        <Hero>
          {headerUri ? (
            <HeroImage source={{ uri: optimizeImage(headerUri, 'h_500,c_limit') }} />
          ) : null}
          <HeroShade />
          <BackButton testID="maweja-business-back" onPress={leaveBusiness}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.textNormal} />
          </BackButton>
          <Identity>
            <LogoFrame>
              {logoUri ? <Logo source={{ uri: optimizeImage(logoUri, 'h_150,c_limit') }} /> : null}
            </LogoFrame>
            <IdentityCopy>
              <OText size={18} weight="bold" color={theme.colors.white} numberOfLines={1}>
                {business?.name}
              </OText>
              {!!description && (
                <OText size={12} color={theme.colors.white} numberOfLines={2} mTop={4}>
                  {description}
                </OText>
              )}
              <MetaRow>
                {rating > 0 && (
                  <MetaItem>
                    <Ionicons name="star" size={14} color={theme.colors.star} />
                    <OText size={12} color={theme.colors.white} style={{ marginLeft: 4 }}>
                      {parseNumber(rating, { separator: '.' })}
                    </OText>
                  </MetaItem>
                )}
                {!!deliveryTime && (
                  <MetaItem>
                    <Ionicons name="time-outline" size={14} color={theme.colors.white} />
                    <OText size={12} color={theme.colors.white} style={{ marginLeft: 4 }}>{deliveryTime}</OText>
                  </MetaItem>
                )}
                {showOtherTime && (
                  <MetaItem>
                    <Ionicons name="time-outline" size={14} color={theme.colors.white} />
                    <OText size={12} color={theme.colors.white} style={{ marginLeft: 4 }}>{otherTime}</OText>
                  </MetaItem>
                )}
              </MetaRow>
            </IdentityCopy>
          </Identity>
        </Hero>

        {business?.professionals?.length > 0 && !activeCategory && (
          <Section>
            <OText size={16} weight="bold">
              {t('PROFESSIONALS', 'Professionals')}
            </OText>
            <ProfessionalFilter
              professionals={business.professionals}
              professionalSelected={professionalSelected}
              handleChangeProfessionalSelected={handleChangeProfessionalSelected}
              handleUpdateProfessionals={handleUpdateProfessionals}
            />
          </Section>
        )}

        {waitingForCategories && (
          <Placeholder Animation={Fade}>
            <Section>
              <PlaceholderLine width={58} height={18} style={{ marginBottom: 10, borderRadius: 6 }} />
              <PlaceholderLine width={36} height={12} style={{ marginBottom: 0, borderRadius: 6 }} />
            </Section>
            <Grid testID="maweja-category-skeleton">
              {CATEGORY_SKELETONS.map((item) => (
                <SkeletonCard key={item}>
                  <PlaceholderMedia style={{ width: '100%', height: 112, borderRadius: 0 }} />
                  <SkeletonCaption>
                    <PlaceholderLine width={72} height={12} style={{ marginBottom: 8, borderRadius: 6 }} />
                    <PlaceholderLine width={42} height={10} style={{ marginBottom: 0, borderRadius: 6 }} />
                  </SkeletonCaption>
                </SkeletonCard>
              ))}
            </Grid>
          </Placeholder>
        )}

        {!activeCategory && !waitingForCategories && (
          <>
            <Section>
              <OText size={20} weight="bold">{t('CHOOSE_A_CATEGORY', 'Choose a category')}</OText>
              <OText size={13} color={theme.colors.textSecondary} mTop={4}>
                {`${categories.length} ${t('CATEGORIES_AVAILABLE', 'categories available')}`}
              </OText>
            </Section>
            {business?.vertical === 'school' && (
              <Section>
                <StudentSelector business={business} navigation={navigation} />
              </Section>
            )}
            <Grid testID="maweja-category-grid">
              {categories.map((category) => {
                const image = category.image || category.products?.find((product: any) => product?.images)?.images
                const count = countFor(category, catalogProducts)
                return (
                  <PressableScale
                    key={String(category.id)}
                    testID={`maweja-category-${category.id}`}
                    onPress={() => openCategory(category)}
                    style={{ width: '48%' }}
                  >
                    <CategoryCard>
                      {image ? <CategoryImage source={{ uri: optimizeImage(image, 'h_300,c_limit') }} /> : <View style={{ height: 112 }} />}
                      <CategoryCaption>
                        <CategoryCopy>
                          <OText size={14} weight="bold" color={theme.colors.black} numberOfLines={1}>{category.name}</OText>
                          <OText size={12} color={theme.colors.black} mTop={2}>
                            {`${count} ${t('PRODUCTS', 'Products')}`}
                          </OText>
                        </CategoryCopy>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.black} />
                      </CategoryCaption>
                    </CategoryCard>
                  </PressableScale>
                )
              })}
            </Grid>
          </>
        )}

        {activeCategory && (
          <>
            <ProductHeader>
              <HeaderBack testID="maweja-products-back" onPress={closeCategory}>
                <Ionicons name="chevron-back" size={22} color={theme.colors.textNormal} />
              </HeaderBack>
              <ProductHeaderCopy>
                <OText size={18} weight="bold" numberOfLines={1}>{activeCategory.name}</OText>
                <OText size={13} color={theme.colors.textSecondary} mTop={2}>
                  {`${visibleProducts.length} ${t('PRODUCTS', 'Products')}`}
                </OText>
              </ProductHeaderCopy>
            </ProductHeader>
            {waitingForProducts && (
              <Placeholder Animation={Fade}>
                <View testID="maweja-product-skeleton">
                  {PRODUCT_SKELETONS.map((item) => (
                    <SkeletonProduct key={item}>
                      <PlaceholderMedia style={{ width: 72, height: 72, borderRadius: 14 }} />
                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <PlaceholderLine width={70} height={12} style={{ marginBottom: 8, borderRadius: 6 }} />
                        <PlaceholderLine width={28} height={12} style={{ marginBottom: 0, borderRadius: 6 }} />
                      </View>
                    </SkeletonProduct>
                  ))}
                </View>
              </Placeholder>
            )}
            {visibleProducts.map((product) => {
              const productDescription = truncateDescription(product?.description)
              return (
              <PressableScale
                key={String(product.id)}
                testID={`maweja-product-${product.id}`}
                onPress={() => onProductClick(product)}
              >
                <ProductCard>
                  {product?.images ? (
                    <ProductImage source={{ uri: optimizeImage(product.images, 'h_160,c_limit') }} />
                  ) : (
                    <View style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: theme.colors.backgroundGray200 }} />
                  )}
                  <ProductCopy>
                    <OText size={14} weight="bold" numberOfLines={2}>{product.name}</OText>
                    {productDescription ? (
                      <OText
                        testID={`maweja-product-description-${product.id}`}
                        size={12}
                        color={theme.colors.textSecondary}
                        mTop={2}
                      >
                        {productDescription}
                      </OText>
                    ) : null}
                    <OText size={14} weight="bold" color={brand} mTop={4}>{parsePrice(product.price)}</OText>
                  </ProductCopy>
                  <PressableScale testID={`maweja-add-${product.id}`} onPress={() => onProductClick(product)}>
                    <AddButton style={{ backgroundColor: brand }}>
                      <Ionicons name="add" size={22} color={theme.colors.white} />
                    </AddButton>
                  </PressableScale>
                </ProductCard>
              </PressableScale>
              )
            })}
            {!categoryState?.loading && visibleProducts.length === 0 && (
              <Section>
                <OText size={14} color={theme.colors.textSecondary}>{t('NO_PRODUCTS', 'No products')}</OText>
              </Section>
            )}
          </>
        )}
      </ScrollView>

      {viewOrderButtonVisible && (
        <FloatingButton
          text={
            openUpselling
              ? t('LOADING', 'Loading')
              : hasNoReservation
                ? t('MISSING_RESERVATION', 'Missing Reservation')
                : !belowMinimum
                  ? `${t('VIEW_ORDER', 'View Order')} · ${parsePrice(currentCart?.total)}`
                  : `${t('MINIMUN_SUBTOTAL_ORDER', 'Minimum subtotal order:')} ${parsePrice(currentCart?.minimum)}`
          }
          disabled={belowMinimum || openUpselling || hasNoReservation}
          handleClick={onOrderPress}
          btnProps={{ style: { borderRadius: 16 } }}
        />
      )}
      {openUpselling && (
        <UpsellingRedirect
          businessId={currentCart?.business_id}
          business={currentCart?.business}
          cartProducts={currentCart?.products}
          cart={currentCart}
          setOpenUpselling={setOpenUpselling}
          handleUpsellingPage={() => {
            setOpenUpselling(false)
            setCanOpenUpselling(false)
            props.onNavigationRedirect?.('CheckoutPage', {
              cartUuid: currentCart?.uuid,
              businessLogo: currentCart?.business?.logo,
              businessName: currentCart?.business?.name,
              cartTotal: currentCart?.total,
              fromProductsList: true
            })
          }}
          openUpselling={openUpselling}
          canOpenUpselling={canOpenUpselling}
          setCanOpenUpselling={setCanOpenUpselling}
          onRedirect={(route: string, params?: any) => {
            if ((props as any).route?.params?.fromCheckout) {
              openFromCheckout(navigation, (props as any).route, route, params)
              return
            }
            navigation?.navigate(route, params)
          }}
        />
      )}
      <Alert
        open={alertState?.open || false}
        title=""
        content={alertState?.content || [t('NOT_AVAILABLE_PRODUCTS', 'These products are not available.')]}
        onAccept={() => setAlertState?.({ open: false, content: [] })}
        onClose={() => setAlertState?.({ open: false, content: [] })}
      />
      <OModal open={openService} onClose={() => setOpenService(false)}>
        <ServiceForm
          navigation={navigation}
          product={currentProduct}
          businessSlug={business?.slug}
          businessId={business?.id}
          professionalList={business?.professionals}
          professionalSelected={professionalSelected}
          handleChangeProfessional={handleChangeProfessionalSelected}
          handleUpdateProfessionals={handleUpdateProfessionals}
          onSave={() => setOpenService(false)}
          onClose={() => setOpenService(false)}
        />
      </OModal>
    </Screen>
  )
}
