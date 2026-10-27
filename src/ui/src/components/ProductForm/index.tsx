import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  InteractionManager,
  View,
  Keyboard,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  I18nManager,
  Platform,
  ScrollView,
} from 'react-native';
import { Placeholder, PlaceholderLine, Fade } from 'rn-placeholder';
import uuid from 'react-native-uuid';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FeatherIcon from 'react-native-vector-icons/Feather'

import { MAX_AUTO_SCROLL_PRODUCT_SUBOPTIONS } from '../../config/constants';

import {
  ProductTitle,
  ProductDescription,
  ProductEditions,
  SectionTitle,
  WrapperIngredients,
  WrapperSubOption,
  ProductComment,
  ProductActions,
  ExtraOptionWrap,
  ProductSummary,
  BackgroundImage,
  Line,
  WrapperHeaderActions,
  WrappAction,
  Divider,
  QuantityControl
} from './styles';

import {
  ProductForm as ProductOptions,
  useLanguage,
  useOrder,
  useUtils,
  ToastType,
  useToast,
  useConfig,
  useEvent,
  useSession,
  useSelectedStudent
} from '@components';

import { isGuestCheckoutAllowed } from '../../../../utils/guestCheckout'
import { ActionButton } from './ActionButton'
import { ExtraOptions } from './ExtraOptions'

import {
  OIcon, OInput, OText,
  ProductOptionSubOption,
  NotFoundSource,
  ProductIngredient,
  ProductOption,
  LottieAnimation,
  StudentOnboardingPopup
} from '@ui'

const HEIGHT = Dimensions.get('screen').height
// Top padding so the product summary clears the sticky header when there is no hero image.
const STICKY_HEADER_CLEARANCE = 56

export const ProductOptionsUI = (props: any) => {
  const {
    navigation,
    editMode,
    isSoldOut,
    productCart,
    increment,
    decrement,
    handleChangeProductCartQuantity,
    showOption,
    maxProductQuantity,
    errors,
    handleSave,
    handleChangeIngredientState,
    handleChangeSuboptionState,
    handleChangeCommentState,
    productObject,
    productAddedToCartLength,
    actionStatus,
    setProductLogin,
    handleCreateGuestUser,
    callbackAfterUpdateCart,
    handleFavoriteProduct
  } = props;
  const theme = useTheme();
  const [, { showToast }] = useToast()
  const [events] = useEvent()
  const commentRef = useRef<TextInput>(null)

  const styles = StyleSheet.create({
    comment: {
      borderWidth: 1,
      borderRadius: 8,
      borderColor: theme.colors.border,
      height: 100,
      alignItems: 'flex-start',
    },
    extraItem: {
      paddingHorizontal: 7,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      justifyContent: 'center',
    },
    slide1: {
      flex: 1,
      alignItems: 'center',
      width: '100%'
    },
    mainSwiper: {
      height: 258,
    },
    swiperButton: {
      marginHorizontal: 25,
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(208,208,208,0.5)'
    },
    unitItem: {
      fontSize: 12
    },
    productTagWrapper: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    productTagImageStyle: {
      width: 32,
      height: 32,
      borderRadius: 8,
      resizeMode: 'cover'
    },
    productTagNameStyle: {
      paddingHorizontal: 6,
      marginRight: 5
    },
    actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 10
    },
    actionContainerColumn: {
      justifyContent: 'center',
      marginTop: 0,
      marginBottom: 16
    },
  });

  const [{ parsePrice, optimizeImage }] = useUtils();
  const [, t] = useLanguage();
  const [orderState] = useOrder();
  const [{ configs }] = useConfig()
  const [{ auth }] = useSession()
  const { studentId: selectedStudent } = useSelectedStudent(props.business?.slug || props.businessSlug)
  const [studentPickerOpen, setStudentPickerOpen] = useState(false)
  const isSchoolProduct = configs?.school_module_enabled?.value === '1' && props.business?.vertical === 'school'
  const needsStudent = isSchoolProduct && auth && !selectedStudent

  const { product, loading, error } = productObject;
  const [detailsReady, setDetailsReady] = useState(false)

  useEffect(() => {
    setDetailsReady(false)
    const task = InteractionManager.runAfterInteractions(() => setDetailsReady(true))
    return () => task.cancel()
  }, [product?.id])

  const [gallery, setGallery] = useState([])
  const [thumbsSwiper, setThumbsSwiper] = useState(0)
  const [indexGallery, setIndexGallery] = useState(0)
  const [selOpt, setSelectedOpt] = useState(-1);
  const [isHaveWeight, setIsHaveWeight] = useState(false)
  const [playing, setPlaying] = useState(false);
  const [qtyBy, setQtyBy] = useState<any>({
    weight_unit: false,
    pieces: true
  })
  const [pricePerWeightUnit, setPricePerWeightUnit] = useState<any>(null)
  const scrollViewRef = useRef<any>(null);
  const swiperRef: any = useRef(null)
  const scrollAttemptRef = useRef<any>(null)
  const [optionLayout, setOptionLayout] = useState<any>({})
  const [headerRefHeight, setHeaderRefHeight] = useState(0)
  const [summaryRefHeight, setSummaryRefHeight] = useState(0)
  const [isScrollAvailable, setIsScrollAvailable] = useState(null)
  const [editionsLayoutY, setEditionsLayoutY] = useState(null)
  const [viewedProduct, setViewedProduct] = useState<any>(null)
  const [showProductNameInHeader, setShowProductNameInHeader] = useState(false)
  const [productTitleLayout, setProductTitleLayout] = useState<any>(null)
  const guestCheckoutEnabled = isGuestCheckoutAllowed(configs, orderState?.options?.type)
  const orderTypeEnabled = guestCheckoutEnabled

  const optionsLength = product?.extras?.reduce((acc: number, extras: any) => acc + extras?.options?.length, 0) + (!!product?.ingredients?.length ? 1 : 0)

  const vibrateApp = (impact?: string | any) => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    ReactNativeHapticFeedback.trigger(impact || 'impactLight', options);
  }

  const isError = ({
    id,
    errors,
    maxProductQuantity,
    isSoldOut
  }: any) => {
    let bgColor = theme.colors.white;
    if (errors[`id:${id}`]) {
      bgColor = 'rgba(255, 0, 0, 0.05)';
    }
    if (maxProductQuantity <= 0) {
      bgColor = 'hsl(0, 0%, 72%)';
    }
    if (isSoldOut) {
      bgColor = theme.colors.white;
    }
    return bgColor;
  }

  const handleSaveProduct = async () => {
    vibrateApp()
    if (!productCart.quantity) {
      showToast(ToastType.Error, t('VALIDATION_ERROR_REQUIRED', 'The quantity field is required').replace('_attribute_', t('PRODUCT_POTIONS_QUANTITY', 'Quantity')))
      return
    }
    const isErrors = Object.values(errors)?.length > 0;
    if (!isErrors) {
      await handleSave && handleSave();
      callbackAfterUpdateCart && callbackAfterUpdateCart()
      return;
    }
  };

  const handleChangeMainIndex = (index: number) => {
    if (index < 0 || index > gallery?.length - 1) {
      setThumbsSwiper(0)
      return
    }
    setThumbsSwiper(index)
  }

  const handleClickThumb = (index: number) => {
    if (index !== indexGallery) {
      swiperRef?.current.scrollBy(index - thumbsSwiper, true);
      setIndexGallery(index)
    }
  }

  const handleRedirectLogin = () => {
    navigation.navigate('Login', {
      store_slug: props.businessSlug
    });
  };

  const handleUpdateGuest = async () => {
    if (!isGuestCheckoutAllowed(configs, orderState?.options?.type)) return
    const guestToken = uuid.v4()
    if (guestToken) {
      await handleCreateGuestUser({ guest_token: guestToken })
      setProductLogin?.({ ...product, store_slug: props.businessSlug })
    }
  };

  const handleSwitchQtyUnit = (val: string | any) => {
    setQtyBy({
      pieces: val === 'pieces',
      weight_unit: val === 'weight_unit'
    })
  }

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev: any) => !prev);
  }, []);

  const onChangeProductCartQuantity = (quantity: number) => {
    if (quantity > maxProductQuantity) {
      showToast(ToastType.Error, t('MAX_QUANTITY', 'The max quantity is _number_').replace('_number_', maxProductQuantity))
      return
    }
    handleChangeProductCartQuantity(quantity)
  }

  const scrollDown = (id: any) => {
    const isErrors = Object.values(errors)?.length > 0
    if (!isErrors) {
      return
    }
    const targetOptionId = Object.getOwnPropertyNames(errors).filter(item => !item.includes(id))[0]

    if (optionLayout[targetOptionId] && scrollViewRef.current) {
      const imageHeight = product?.images ? HEIGHT * 0.55 : 0
      const targetY = optionLayout[targetOptionId]?.y + imageHeight + summaryRefHeight
      const headerStickyHeight = 70
      const adjustedY = targetY - headerStickyHeight - 20

      scrollViewRef.current.scrollTo({
        y: adjustedY > 0 ? adjustedY : 0,
        animated: true
      })
    }
  }

  const handleOnLayout = (event: any, optionId: any) => {
    if (optionsLength > MAX_AUTO_SCROLL_PRODUCT_SUBOPTIONS) return
    const _optionLayout = { ...optionLayout }
    const optionKey = optionId ? `id:${optionId}` : 'id:0'
    _optionLayout[optionKey] = event.nativeEvent.layout
    setOptionLayout(_optionLayout)
  }

  const handleGoBack = navigation?.canGoBack()
    ? () => navigation.goBack()
    : () => navigation.navigate('Business', { store: props.businessSlug })

  const actionButtonProps = {
    navigation,
    isHaveWeight,
    isSoldOut,
    maxProductQuantity,
    productCart,
    handleSaveProduct,
    editMode,
    product,
    errors,
    productAddedToCartLength,
    handleRedirectLogin,
    guestCheckoutEnabled,
    orderTypeEnabled,
    handleUpdateGuest,
    actionStatus,
    needsStudent,
    onSelectStudent: () => setStudentPickerOpen(true)
  }

  const extraOptionsProps = {
    setSelectedOpt,
    scrollViewRef,
    optionLayout,
    editionsLayoutY,
    styles,
    selOpt
  }

  const suboptionsLength = product?.extras?.reduce((acc: number, extras: any) => acc + extras?.options?.reduce((accSuboptions: number, options: any) => accSuboptions + options?.suboptions?.length, 0), 0)

  const handleChangeFavorite = () => {
    if (auth) {
      handleFavoriteProduct && handleFavoriteProduct(product, product?.favorite)
    } else {
      navigation && navigation.navigate('Login');
    }
  }

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y
    if (productTitleLayout) {
      const heroOffset = product?.images ? HEIGHT * 0.55 : STICKY_HEADER_CLEARANCE
      const titleEndPosition = (productTitleLayout.y + productTitleLayout.height + heroOffset) - 130
      if (scrollY > titleEndPosition) {
        !showProductNameInHeader && setShowProductNameInHeader(true)
      } else {
        showProductNameInHeader && setShowProductNameInHeader(false)
      }
    }
  }

  useEffect(() => {
    if (isScrollAvailable && scrollAttemptRef.current !== isScrollAvailable) {
      const targetOptionId = Object.getOwnPropertyNames(errors).filter(item => !item.includes(isScrollAvailable))[0]
      if (optionLayout[targetOptionId]) {
        scrollAttemptRef.current = isScrollAvailable
        scrollDown(isScrollAvailable)
        setTimeout(() => {
          setIsScrollAvailable(null)
          scrollAttemptRef.current = null
        }, 100)
      }
    }
  }, [errors, optionLayout, isScrollAvailable])

  useEffect(() => {
    const imageList: any = []
    const videoList: any = []
    if (product?.images?.length > 0) {
      imageList.push(product.images)
    }

    if (product?.gallery && product?.gallery?.length > 0) {
      for (const img of product?.gallery) {
        if (img?.file) {
          imageList.push(img?.file)
        }
        if (img?.video) {
          const keys = img?.video.split('/')
          let _videoId = keys[keys?.length - 1]

          if (_videoId.includes('watch')) {
            const __url = _videoId.split('=')[1]
            _videoId = __url
          } else if (_videoId.includes('?')) {
            const __url = _videoId.split('?')[0]
            _videoId = __url
          }

          if (_videoId.search(/&/i) >= 0) {
            _videoId = _videoId.split('&')[0]
          } else if (_videoId.search(/\?/i) >= 0) {
            _videoId = _videoId.split('?')[0]
          }
          if ((_videoId?.length === 11)) {
            videoList.push(_videoId)
          }
        }
      }
    }
    const gallery = imageList.concat(videoList)
    setGallery(gallery)

    if (product?.weight && product?.weight_unit) {
      setIsHaveWeight(true)
      setPricePerWeightUnit(product?.price / product?.weight)
    }
  }, [product])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current.scrollToEnd({ animated: true })
    })
    return () => {
      keyboardDidShowListener.remove()
    }
  }, [])

  useEffect(() => {
    if (!product?.id || product?.id === viewedProduct?.id) return
    setViewedProduct(product)
    events.emit('product_viewed', product)
  }, [product?.id, viewedProduct])

  return (
    <View style={{ flex: 1 }}>
      {!!product?.images && (
        <BackgroundImage
          source={{
            uri: product?.images,
            priority: FastImage.priority.normal
          }}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEIGHT * 0.55, zIndex: 0 }}
        >
        </BackgroundImage>
      )}
      <WrapperHeaderActions isSticky={true} showBackground={showProductNameInHeader}>
        <WrappAction onPress={() => handleGoBack()}>
          <AntDesignIcon
            name="left"
            color={theme.colors.black}
            size={18}
          />
        </WrappAction>
        {showProductNameInHeader && product?.name && (
          <View style={{ flex: 1, paddingHorizontal: 15, alignItems: 'center' }}>
            <OText
              size={16}
              weight={'600'}
              numberOfLines={1}
              style={{ textAlign: 'center' }}
            >
              {product?.name}
            </OText>
          </View>
        )}
        <WrappAction>
          <LottieAnimation
            type='favorite'
            onClick={handleChangeFavorite}
            initialValue={product?.favorite ? 0.5 : 0}
            toValue={product?.favorite ? 0 : 0.5}
            disableAnimation={!auth}
            iconProps={{ color: theme.colors.danger5, size: 18 }}
            isActive={product?.favorite}
          />
        </WrappAction>
      </WrapperHeaderActions>
      {!error && (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            paddingBottom: 80,
            flexDirection: 'column',
            paddingTop: product?.images ? HEIGHT * 0.45 : STICKY_HEADER_CLEARANCE,
            justifyContent: 'space-between',
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          removeClippedSubviews={false}
        >
          <View style={{ flexDirection: 'column' }}>
            <ProductSummary
              ph={20}
              onLayout={(event: any) => setSummaryRefHeight(event.nativeEvent.layout?.height)}
            >
              {!!product?.images && (
                <Line />
              )}
              <ProductTitle
                onLayout={(event: any) => setProductTitleLayout(event.nativeEvent.layout)}
              >
                {loading && !product ? (
                  <Placeholder Animation={Fade}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <PlaceholderLine width={40} height={20} />
                      <PlaceholderLine width={30} height={20} />
                    </View>
                  </Placeholder>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row' }}>
                      <OText
                        size={20}
                        lineHeight={30}
                        weight={'600'}
                        style={{ flex: 1, marginBottom: 10 }}>
                        {product?.name || productCart.name}
                      </OText>
                      {!!product?.calories && (
                        <OText size={16} style={{ color: '#808080' }}>{product?.calories} cal
                        </OText>
                      )}
                    </View>
                    {!product?.images && (product?.description || productCart?.description) && (
                      <ProductDescription>
                        <OText color={theme.colors.textSecondary} size={12} lineHeight={18}>
                          {product?.description || productCart?.description}
                        </OText>
                      </ProductDescription>
                    )}
                    {((!!product?.sku && product?.sku !== '-1' && product?.sku !== '1') || (!!product?.estimated_person)) && (
                      <OText size={14} style={{ flex: I18nManager.isRTL ? 1 : 0 }} color={'#909BA9'} mBottom={7}>
                        {
                          ((product?.sku && product?.sku !== '-1' && product?.sku !== '1') || (productCart?.sku && productCart?.sku !== '-1' && productCart?.sku !== '1'))
                          && <>{t('SKU', 'Sku')}{' '}{product?.sku || productCart?.sku}</>
                        }
                        {product?.sku && product?.sku !== '-1' && product?.sku !== '1' && product?.estimated_person && (
                          <>&nbsp;&#183;&nbsp;</>
                        )}
                        {product?.estimated_person
                          && <>{product?.estimated_person}{' '}{t('ESTIMATED_PERSONS', 'persons')}</>
                        }
                      </OText>
                    )}
                    {isHaveWeight ? (
                      <OText size={16} lineHeight={24} color={theme.colors.primary}>{parsePrice(pricePerWeightUnit)} / {product?.weight_unit}</OText>
                    ) : (
                      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                        <OText size={16} style={{ flex: I18nManager.isRTL ? 1 : 0 }} color={theme.colors.primary}>{productCart.price ? parsePrice(productCart.price) : ''}</OText>
                        {product?.offer_price !== null && product?.in_offer && (
                          <OText style={{
                            fontSize: 14,
                            color: '#808080',
                            textDecorationLine: 'line-through',
                            marginLeft: 7,
                            marginRight: 7
                          }}>{product?.offer_price ? parsePrice(product?.offer_price) : ''}</OText>
                        )}
                      </View>
                    )}
                  </>
                )}
              </ProductTitle>
              {!!product?.images && (product?.description || productCart?.description) && (
                <ProductDescription>
                  <OText color={theme.colors.textSecondary} size={12} lineHeight={18}>
                    {product?.description || productCart?.description}
                  </OText>
                </ProductDescription>
              )}
              {!!product?.tags?.length && (
                <ScrollView
                  horizontal
                  scrollEventThrottle={100}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {product?.tags?.map((tag: any) => (
                    <View
                      key={tag.id}
                      style={styles.productTagWrapper}
                    >
                      {!!tag?.image && (
                        <OIcon
                          url={optimizeImage(tag?.image, 'h_40,c_limit')}
                          style={styles.productTagImageStyle}
                        />
                      )}
                      <OText color={theme.colors.textSecondary} size={12} style={styles.productTagNameStyle}>{tag.name}</OText>
                    </View>
                  ))}
                </ScrollView>
              )}
              {!!product?.images && (
                <Divider />
              )}
            </ProductSummary>
            {(!loading && product && detailsReady) && (
              <ExtraOptionWrap
                horizontal
                scrollEventThrottle={100}
                showsHorizontalScrollIndicator={false}
              >
                {product?.ingredients?.length > 0 && (
                  <TouchableOpacity
                    key={`eopt_key_01`}
                    onPress={() => {
                      setSelectedOpt(0)
                      scrollViewRef?.current?.scrollTo && scrollViewRef.current.scrollTo({
                        y: optionLayout[`id:0`]?.y + editionsLayoutY - 50,
                        animated: true
                      })
                    }}
                    style={[
                      styles.extraItem,
                      {
                        borderBottomColor:
                          selOpt == 0 ? theme.colors.textNormal : theme.colors.backgroundPage,
                      },
                    ]}>
                    <OText
                      color={selOpt == 0 ? theme.colors.textNormal : theme.colors.textSecondary}
                      size={12}
                      weight={selOpt == 0 ? '600' : 'normal'}>
                      {t('INGREDIENTS', 'Ingredients')}
                    </OText>
                  </TouchableOpacity>
                )}
                {suboptionsLength < 200 && product?.extras?.map((extra: any) =>
                  <ExtraOptions key={extra.id} options={extra.options} {...extraOptionsProps} />
                )}
              </ExtraOptionWrap>
            )}
            {!loading && product && detailsReady && (
              <ProductEditions
                onLayout={(event: any) => setEditionsLayoutY(event.nativeEvent?.layout?.y)}
              >
                <>
                  {product?.ingredients?.length > 0 && (
                    <View style={{ paddingHorizontal: 20 }} key={'cat_01'}>
                      <SectionTitle onLayout={(event: any) => handleOnLayout(event, '')}>
                        <OText size={16}>
                          {t('INGREDIENTS', 'Ingredients')}
                        </OText>
                      </SectionTitle>
                      <WrapperIngredients>
                        {product?.ingredients.map((ingredient: any, idx: number) => (
                          <ProductIngredient
                            key={idx}
                            ingredient={ingredient}
                            state={productCart.ingredients[`id:${ingredient.id}`] ?? {}}
                            onChange={handleChangeIngredientState}
                            isSoldOut={isSoldOut}
                          />
                        ))}
                      </WrapperIngredients>
                    </View>
                  )}
                  {product?.extras?.sort((a: any, b: any) => a.rank - b.rank).map((extra: any) =>
                    extra.options?.sort((a: any, b: any) => a.rank - b.rank).map((option: any, i: number) => {
                      const currentState = productCart.options[`id:${option.id}`] || {};
                      return (
                        <React.Fragment key={`cat_${option.id}`}>
                          {showOption(option) && (
                            <View style={{ marginBottom: 20 }} onLayout={((event: any) => handleOnLayout(event, option?.id))}>
                              <ProductOption
                                option={option}
                                currentState={currentState}
                                error={errors[`id:${option.id}`]}
                              >
                                <WrapperSubOption
                                  bgColor={isError({ id: option.id, errors, maxProductQuantity, isSoldOut })}
                                  justifyContent={option?.suboptions?.length > 2 ? 'space-between' : 'space-evenly'}
                                >
                                  {option?.suboptions?.sort((a: any, b: any) => a.rank - b.rank).map(
                                    (suboption: any, index: number) => {
                                      const currentState = productCart.options[`id:${option.id}`]?.suboptions[`id:${suboption.id}`] || {};
                                      const balance = productCart.options[`id:${option.id}`]?.balance || 0;
                                      return (
                                        <ProductOptionSubOption
                                          key={suboption.id}
                                          index={index + 1}
                                          error={errors[`id:${option.id}`]}
                                          isSoldOut={isSoldOut}
                                          balance={balance}
                                          option={option}
                                          suboption={suboption}
                                          image={suboption.image}
                                          state={currentState}
                                          disabled={isSoldOut || maxProductQuantity <= 0}
                                          setIsScrollAvailable={setIsScrollAvailable}
                                          onChange={handleChangeSuboptionState}
                                        />
                                      );
                                    },
                                  )}
                                </WrapperSubOption>
                              </ProductOption>
                            </View>
                          )}
                        </React.Fragment>
                      );
                    }),
                  )}
                </>
                {!product?.hide_special_instructions && (
                  <ProductComment>
                    <SectionTitle>
                      <OText size={16} weight={'600'} lineHeight={24}>
                        {t('COMMENTS', 'Special comment')}
                      </OText>
                    </SectionTitle>
                    <OInput
                      multiline
                      placeholder={t('SPECIAL_COMMENT', 'Special comment')}
                      value={productCart.comment}
                      placeholderTextColor={theme.colors.white}
                      isDisabled={!(productCart && !isSoldOut && maxProductQuantity)}
                      style={styles.comment}
                      forwardRef={commentRef}
                      onChange={(val: string) =>
                        handleChangeCommentState({ target: { value: val } })
                      }
                    />
                  </ProductComment>
                )}
              </ProductEditions>
            )}
            {((loading && !product) || (product && !detailsReady)) && (
              <View style={{ paddingHorizontal: theme.utils.margins.horizontal }}>
                {[...Array(2)].map((_, i) => (
                  <Placeholder
                    key={i}
                    style={{ marginBottom: 20 }}
                    Animation={Fade}>
                    <PlaceholderLine
                      height={40}
                      style={{ flex: 1, marginTop: 10 }}
                    />
                    {[...Array(3)].map((item, i) => (
                      <View
                        key={'place_key_' + i}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <PlaceholderLine
                          height={30}
                          width={10}
                          style={{ marginBottom: 20 }}
                        />
                        <PlaceholderLine
                          height={30}
                          width={50}
                          style={{ marginBottom: 20 }}
                        />
                        <PlaceholderLine
                          height={30}
                          width={30}
                          style={{ marginBottom: 20 }}
                        />
                      </View>
                    ))}
                  </Placeholder>
                ))}
              </View>
            )}
            {!!error && error?.length > 0 && (
              <NotFoundSource content={error[0]?.message || error[0]} />
            )}
          </View>
        </ScrollView>
      )}
      {!loading && !error && product && (
        <ProductActions ios={Platform?.OS === 'ios'} isColumn={isHaveWeight}>
          <View style={[styles.actionContainer, isHaveWeight && styles.actionContainerColumn]}>
            {productCart && !isSoldOut && maxProductQuantity > 0 && (
              <>
                <QuantityControl isCentered={isHaveWeight}>
                  <TouchableOpacity
                    onPress={decrement}
                    disabled={productCart.quantity === 1 || !productCart.quantity || isSoldOut || ((productCart?.quantity + productAddedToCartLength) <= product?.minimum_per_order)}>
                    <FeatherIcon
                      name='minus-square'
                      size={24}
                      color={
                        productCart.quantity === 1 || isSoldOut
                          ? theme.colors.black
                          : theme.colors.active
                      }
                    />
                  </TouchableOpacity>
                  {qtyBy?.pieces && (
                    <TextInput
                      keyboardType='numeric'
                      value={`${productCart?.quantity > 0 ? productCart?.quantity : ''}`}
                      onChangeText={(val: any) => {
                        let num: any = parseInt(val);
                        if (isNaN(num)) num = '';
                        else if (num > 999) num = 999;
                        onChangeProductCartQuantity(num);
                      }}
                      maxLength={3}
                      editable={!orderState.loading}
                      style={{
                        textAlign: 'center',
                        minWidth: 60,
                        borderRadius: 8,
                        height: 44,
                        marginHorizontal: 10,
                        fontSize: 20,
                        top: 2
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={increment}
                    disabled={
                      maxProductQuantity <= 0 ||
                      (productCart?.quantity + productAddedToCartLength) >= maxProductQuantity ||
                      (!!product?.maximum_per_order && (productCart?.quantity + productAddedToCartLength) >= product?.maximum_per_order) ||
                      isSoldOut
                    }>
                    <FeatherIcon
                      name='plus-square'
                      size={24}
                      color={
                        maxProductQuantity <= 0 ||
                          (productCart?.quantity + productAddedToCartLength) >= maxProductQuantity ||
                          (!!product?.maximum_per_order && (productCart?.quantity + productAddedToCartLength) >= product?.maximum_per_order) ||
                          isSoldOut
                          ? theme.colors.black
                          : theme.colors.active
                      }
                    />
                  </TouchableOpacity>
                </QuantityControl>
              </>
            )}
            {!isHaveWeight && <ActionButton {...actionButtonProps} />}
          </View>
          {isHaveWeight && <ActionButton {...actionButtonProps} />}
        </ProductActions>
      )}
      {isSchoolProduct && (
        <StudentOnboardingPopup
          business={props.business}
          navigation={navigation}
          forceOpen={studentPickerOpen}
          onForceClose={() => setStudentPickerOpen(false)}
        />
      )}
    </View>
  );
};

export const ProductForm = (props: any) => {
  const productOptionsProps = {
    ...props,
    productCart: {
      ...props.productCart,
      quantity: props.productCart?.code
        ? props.productCart?.quantity
        : props?.product?.minimum_per_order || 1
    },
    UIComponent: ProductOptionsUI
  }

  return <ProductOptions {...productOptionsProps} />
};

ProductForm.defaultProps = {
  productAddedToCartLength: 0
}
