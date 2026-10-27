import { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useTheme } from 'styled-components/native';

import { AccordionSection, Accordion, ContentInfo, ProductImage, ProductImageIcon, EditImageButton } from './styles'
import { useLanguage, useUtils } from '@components'
import { OAlert, OIcon, OText } from '@ui';

export const CartProductCard = (props: any) => {
  const {
    product,
    isDisabledEdit,
    isCartProduct,
    isCartPending,
    onEditProduct,
    onDeleteProduct,
    handleEditProduct,
    changeQuantity
  } = props

  const theme = useTheme();
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils()
  const canEdit = !isDisabledEdit && onEditProduct && isCartProduct && !isCartPending && product?.valid_menu
  const hasImage = !!product?.images
  const [isUpdating, setIsUpdating] = useState(false)
  const [optimisticQuantity, setOptimisticQuantity] = useState(product?.quantity)
  const otherLinesQuantity = (product?.balance ?? product?.quantity ?? 0) - (product?.quantity ?? 0)
  const isMaximumReached = !!product?.maximum_per_order && otherLinesQuantity + optimisticQuantity >= product?.maximum_per_order
  const isIncrementDisabled = isUpdating || isMaximumReached

  const handleChangeQuantity = async (newQuantity: number) => {
    if (isUpdating) return

    setIsUpdating(true)
    setOptimisticQuantity(newQuantity)

    try {
      await changeQuantity?.(product, newQuantity)
    } catch (error) {
      setOptimisticQuantity(product?.quantity)
    }
  }

  useEffect(() => {
    setOptimisticQuantity(product?.quantity)
    setIsUpdating(false)
  }, [product?.quantity])

  return (
    <View style={{
      flexDirection: 'row',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    }}>
      <AccordionSection>
        <Accordion
          activeOpacity={1}
          isValid={product?.valid ?? true}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <ContentInfo>
              <TouchableOpacity
                onPress={() => {
                  if (!isDisabledEdit && onEditProduct && isCartProduct && !isCartPending && product?.valid_menu) {
                    handleEditProduct(product)
                  }
                }}
                disabled={isDisabledEdit || !onEditProduct || !isCartProduct || isCartPending || !product?.valid_menu}
                style={{ position: 'relative' }}
              >
                {hasImage ? (
                  <>
                    <ProductImageIcon
                      source={{
                        uri: product?.images,
                        priority: FastImage.priority.normal,
                      }}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                    {canEdit && (
                      <>
                        <View style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: 20
                        }} />
                        <View style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: [{ translateX: -15 }, { translateY: -20 }],
                          borderRadius: 15,
                          width: 30,
                          height: 30,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <MaterialCommunityIcon
                            name='pencil-outline'
                            size={30}
                            color={theme.colors.white}
                          />
                        </View>
                      </>
                    )}
                  </>
                ) : (
                  canEdit && (
                    <EditImageButton>
                      <MaterialCommunityIcon
                        name='pencil-outline'
                        size={28}
                        color={theme.colors.primary}
                      />
                    </EditImageButton>
                  )
                )}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <OText size={16} weight={'500'} numberOfLines={2} ellipsizeMode='tail'>{product.name}</OText>
                  <OText size={16} weight={'bold'} numberOfLines={1} ellipsizeMode='tail'>{parsePrice(product.total || product.price)}</OText>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 15 }}>
                  {onDeleteProduct && isCartProduct && !isCartPending && (
                    optimisticQuantity > 1 ? (
                      <TouchableOpacity
                        onPress={() => handleChangeQuantity(optimisticQuantity - 1)}
                        disabled={isUpdating || !changeQuantity}
                        style={{ borderRadius: 8, overflow: 'hidden', opacity: isUpdating ? 0.5 : 1 }}
                      >
                        <MaterialCommunityIcon
                          name='minus-box'
                          size={38}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    ) : (
                      <OAlert
                        title={t('DELETE_PRODUCT', 'Delete Product')}
                        message={t('QUESTION_DELETE_PRODUCT', 'Are you sure that you want to delete the product?')}
                        onAccept={() => isUpdating ? null : onDeleteProduct(product)}
                      >
                        <OIcon
                          src={theme.images.general.trash}
                          width={30}
                          height={30}
                          color={theme.colors.danger}
                          style={{ borderRadius: 8 }}
                        />
                      </OAlert>
                    )
                  )}
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ width: 12 }} />
                  ) : (
                    <OText size={20} weight={'bold'}>
                      {optimisticQuantity}
                    </OText>
                  )}
                  {!isDisabledEdit && onEditProduct && isCartProduct && !isCartPending && product?.valid_menu && (
                    <TouchableOpacity
                      onPress={() => handleChangeQuantity(optimisticQuantity + 1)}
                      disabled={isIncrementDisabled}
                      style={{ opacity: isIncrementDisabled ? 0.5 : 1 }}
                    >
                      <OIcon
                        src={theme.images.general.tag_plus}
                        width={20}
                        height={20}
                        color={theme.colors.white}
                        style={{ borderRadius: 8 }}
                        wrapStyle={{ backgroundColor: theme.colors.black, padding: 5 }}
                      />
                    </TouchableOpacity>
                  )}

                </View>
              </View>

            </ContentInfo>
          </View>
          {((isCartProduct && !isCartPending && product?.valid_menu && !product?.valid_quantity) ||
            (!product?.valid_menu && isCartProduct && !isCartPending)) && (
              <View style={{ alignItems: 'flex-end', width: '100%', }}>
                <OText size={14} color={theme.colors.danger} style={{ textAlign: 'right', marginTop: 5 }}>
                  {t('NOT_AVAILABLE', 'Not available')}
                </OText>
              </View>
            )}
        </Accordion>
      </AccordionSection>
    </View>
  );
};
