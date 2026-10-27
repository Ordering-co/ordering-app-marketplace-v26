import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, I18nManager, Keyboard, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form'
import AntDesignIcons from 'react-native-vector-icons/AntDesign'
import { useTheme } from 'styled-components/native'
import Spinner from 'react-native-loading-spinner-overlay'

import {
  BusinessLogo,
  CommentsButtonGroup,
  Content,
  ProductHeader,
  LikeHandsActionContainer,
  LikeHandsButton
} from './styles'

import { reviewCommentList } from '../../utils'
import { ReviewOrderParams } from '../../types'

import { OrderReview as ReviewOrderController, useLanguage, useToast, ToastType } from '@components'
import {
  OButton, OIcon, OInput, OText,
  FloatingBottomContainer
} from '@ui'

export const ReviewOrderUI = (props: ReviewOrderParams) => {
  const {
    stars,
    handleSendReview,
    formState,
    navigation,
    setStars,
    onNavigationRedirect,
    handleReviewState,
    setIsReviewed,
    handleChangeFormState
  } = props

  const theme = useTheme()

  const styles = StyleSheet.create({
    inputTextArea: {
      borderColor: theme.colors.secondaryContrast,
      borderRadius: 15,
      marginTop: 10,
      marginBottom: 40,
      height: 100,
      paddingTop: 0,
      alignItems: 'flex-start'
    },
    reviewedStyle: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: 20
    }
  })

  const [, t] = useLanguage()
  const [, { showToast }] = useToast()
  const { handleSubmit, control, errors } = useForm()
  const scrollref = useRef<ScrollView>(null)

  const [alertState, setAlertState] = useState<{ open: boolean, content: Array<any>, success?: boolean }>({ open: false, content: [], success: false })
  const [comments, setComments] = useState<Array<any>>([])
  const [extraComment, setExtraComment] = useState('')
  const [enableProduct, setEnableProduct] = useState(true)
  const [qualification, setQualification] = useState(5)
  const [currentValue, setCurrentValue] = useState(5)
  const [order, setOrderState] = useState<any>(props.order);

  useEffect(() => {
    setOrderState(props.order)
  }, [props.order])

  const onSubmit = async () => {
    if (Object.values(stars).some((value: any) => value === 0)) {
      setAlertState({
        open: true,
        content: stars.quality === 0 ? [`${t('REVIEW_QUALIFICATION_REQUIRED', 'Review qualification is required')}`] : []
      })
      return
    }
    const res = await handleSendReview()
    if (res) {
      handleReviewState && handleReviewState(order?.id)
      setIsReviewed && setIsReviewed(true)
      setOrderState({ ...order, review: true })
      showToast(ToastType.Success, t('ORDER_REVIEW_SUCCESS_CONTENT', 'Thank you, Order review successfully submitted!'))
      onNavigationRedirect && onNavigationRedirect('ReviewProducts', { order: { ...order, review: null } })
    }
    !enableProduct && navigation?.canGoBack() && navigation.goBack()
  }

  const commentsList = reviewCommentList('order')

  const handleChangeComment = (commentItem: any) => {
    const found = comments.find((comment: any) => comment?.key === commentItem.key)
    if (found) {
      const _comments = comments.filter((comment: any) => comment?.key !== commentItem.key)
      setComments(_comments)
    } else {
      setComments([...comments, commentItem])
    }
  }

  const isSelectedComment = (commentKey: number) => {
    const found = comments.find((comment: any) => comment?.key === commentKey)
    return found
  }

  const handleContinueClick = () => {
    console.log('order', order?.review)
    if (!order?.review) {
      onSubmit()
    } else {
      skipOrderReview()
    }
  }

  const skipOrderReview = () => {
    if (enableProduct) onNavigationRedirect('ReviewProducts', { order: { ...order, review: null } })
    else if (order?.driver && !order?.user_review) {
      onNavigationRedirect('ReviewDriver', { order: { ...order, review: null } })
    } else {
      navigation?.canGoBack() && navigation.goBack()
    }
  }

  const handleChangeQualification = (index: number) => {
    if (qualification === index) return
    setQualification(index)
    setComments([])
  }

  useEffect(() => {
    if (formState.error && !formState.loading) {
      showToast(ToastType.Error, formState.result)
    }
  }, [formState.result])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors)
        .map((item: any) => `- ${item.message}`)
        .join('\n');
      showToast(ToastType.Error, errorMessages);
    }
  }, [errors]);

  useEffect(() => {
    if (alertState.open) {
      alertState.content && showToast(
        ToastType.Error,
        alertState.content
      )
    }
  }, [alertState.content])

  useEffect(() => {
    let _comments = ''
    if (comments.length > 0) {
      comments.map(comment => _comments += comment.content + '. ')
    }
    let _comment
    _comment = _comments + extraComment
    setStars({ ...stars, comments: _comment })
  }, [comments, extraComment])

  useEffect(() => {
    setEnableProduct(!order?.products.every((product: any) => product?.deleted))
  }, [order])

  useEffect(() => {
    const value = qualification ? 5 : 1
    setCurrentValue(value)
    if (value !== currentValue) setComments([])
    if (comments?.length === 0 && !extraComment && formState.changes?.length === 0 && qualification === 5) return
    let _comments = ''
    if (comments.length > 0) {
      comments.map(comment => (_comments += comment.content + '. '))
    }
    const _comment = _comments + extraComment
    let found = false
    const _changes = formState?.changes?.map((item: any) => {
      if (item?.order_id === order?.id) {
        found = true
        return {
          order_id: order?.id,
          comment: _comment,
          qualification: qualification
        }
      }
      return item
    })
    if (!found) {
      _changes.push({
        order_id: order?.id,
        comment: _comment,
        qualification: qualification
      })
    }
    handleChangeFormState && handleChangeFormState(_changes)
  }, [comments, extraComment, qualification])

  useEffect(() => {
    if (scrollref?.current) {
      Keyboard.addListener('keyboardDidShow', () => {
        scrollref?.current?.scrollToEnd && scrollref.current.scrollToEnd()
      })
    }
    return () => {
      Keyboard.removeAllListeners('keyboardDidShow')
    }
  }, [scrollref?.current])

  return (
    <>
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
        ref={scrollref}
      >
        <BusinessLogo>
          <View style={{ maxWidth: '75%' }}>
            <OText
              size={20}
              weight="700"
            >
              {t('RATE_THE_EXPERIENCE', 'Rate the experience')}
            </OText>
            {Boolean(order?.business) && (
              <OText size={14}>{t('HOW_WAS_YOUR_EXPERIENCE_WITH', 'How was your experience with')} {order?.business?.length > 1 ? order?.business?.map((business: any) => business?.name).join(', ') : order?.business[0]?.name || order?.business?.name}?</OText>
            )}
          </View>
          <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            {order?.business?.length > 0 ? order?.business?.map((business: any) => (
              <Logo business={business} key={business?.id} />
            )) : <Logo business={order?.business} />}
          </View>
        </BusinessLogo>
        {order?.review || (formState?.result?.order_id && !formState?.result?.error) ? (
          <View style={styles.reviewedStyle}>
            <OText color={theme.colors.primary}>{t('ORDER_REVIEWED', 'This order has been already reviewed')}</OText>
          </View>
        ) : (
          <>
            <ProductHeader>
              <LikeHandsActionContainer>
                <LikeHandsButton
                  isLike
                  onPress={() => handleChangeQualification(5)}
                >
                  <AntDesignIcons name='like2' size={33} color={qualification === 5 ? theme.colors.primary : theme.colors.lightGray} />
                </LikeHandsButton>
                <LikeHandsButton onPress={() => handleChangeQualification(1)}>
                  <AntDesignIcons name='dislike2' size={33} color={qualification === 1 ? theme.colors.primary : theme.colors.lightGray} />
                </LikeHandsButton>
              </LikeHandsActionContainer>
            </ProductHeader>
            <View style={{ borderWidth: 0.5, borderColor: theme.colors.backgroundGray200, marginTop: 20 }} />
            <OText
              style={{ marginTop: 30 }}
              weight="700"
            >
              {commentsList[qualification]?.title}
            </OText>
            <CommentsButtonGroup>
              {commentsList[qualification]?.list?.map((commentItem: any) => (
                <OButton
                  key={commentItem.key}
                  text={commentItem.content}
                  textStyle={{
                    color: isSelectedComment(commentItem.key) ? theme.colors.active : theme.colors.primary,
                    fontSize: 12,
                  }}
                  style={{
                    height: 40,
                    paddingLeft: 5,
                    paddingRight: 5,
                    marginHorizontal: 3,
                    marginVertical: 10,
                    borderRadius: 15,
                    backgroundColor: isSelectedComment(commentItem.key) ? theme.colors.activeContrast : theme.colors.white,
                    borderColor: isSelectedComment(commentItem.key) ? theme.colors.active : theme.colors.alert
                  }}
                  onClick={() => handleChangeComment(commentItem)}
                />
              ))}
            </CommentsButtonGroup>
            <View style={{ borderWidth: 0.5, borderColor: theme.colors.backgroundGray200, marginTop: 20 }} />
            <OText
              size={16}
              weight="700"
              style={{ marginTop: 30 }}
            >
              {t('REVIEW_COMMENT_QUESTION', 'Do you want to add something?')}
            </OText>
            <OInput
              name='comments'
              placeholder={t('COMMENTS', 'Comments')}
              onChange={(val: any) => setExtraComment(val.target.value)}
              placeholderTextColor={theme.colors.secondaryContrast}
              borderColor={theme.colors.secondaryContrast}
              style={styles.inputTextArea}
              multiline
            />
          </>
        )}
        <Spinner visible={formState.loading} />
      </Content>
      <FloatingBottomContainer>
        <OButton
          textStyle={{ paddingRight: 10 }}
          text={t('CONTINUE', 'Continue')}
          style={{ width: '100%' }}
          parentStyle={{ backgroundColor: theme.colors.primary, borderRadius: 30 }}
          onClick={handleSubmit(handleContinueClick)}
        />
      </FloatingBottomContainer>
    </>
  )
}

const Logo = ({ business }: { business: any }) => {
  const theme = useTheme()

  const styles = StyleSheet.create({
    photoWrapper: {
      shadowColor: theme.colors.black,
      shadowRadius: 3,
      shadowOffset: { width: 1, height: 4 },
      elevation: 3,
      borderRadius: 8,
      shadowOpacity: 0.1,
      overflow: 'hidden'
    },
  })

  return (
    <View
      style={{
        ...styles.photoWrapper,
        backgroundColor: theme.colors.white,
        marginBottom: 5
      }}
      key={business?.id}
    >
      <OIcon
        url={business?.logo}
        width={44}
        height={44}
      />
    </View>
  )
}

export const ReviewOrder = (props: ReviewOrderParams) => {
  const reviewOrderProps = {
    ...props,
    UIComponent: ReviewOrderUI,
    defaultStar: props?.defaultStar || 5
  }
  return <ReviewOrderController {...reviewOrderProps} />
}
