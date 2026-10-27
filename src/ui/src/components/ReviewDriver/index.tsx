import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, I18nManager, Keyboard, ScrollView } from 'react-native'
import Spinner from 'react-native-loading-spinner-overlay'
import { useTheme } from 'styled-components/native'
import { useForm } from 'react-hook-form'
import AntDesignIcons from 'react-native-vector-icons/AntDesign'

import { ReviewDriverParams } from '../../types'
import { reviewCommentList } from '../../utils'

import {
  CommentsButtonGroup,
  Content,
  ProductHeader,
  LikeHandsActionContainer,
  LikeHandsButton,
  DriverLogo,
} from './styles'

import { useLanguage, useToast, ToastType, ReviewDriver as ReviewDriverController } from '@components'

import {
  FloatingBottomContainer,
  OText, OIcon, OButton, OInput,
  NavBar
} from '@ui'

const ReviewDriverUI = (props: ReviewDriverParams) => {
  const {
    order,
    formState,
    dirverReviews,
    setDriverReviews,
    handleSendDriverReview,
    onNavigationRedirect,
  } = props

  const [, t] = useLanguage()
  const theme = useTheme()
  const { handleSubmit, errors } = useForm()
  const [, { showToast }] = useToast()
  const scrollref = useRef<ScrollView>(null)

  const [isDriverReviewed, setIsDriverReviewed] = useState(false)
  const [qualification, setQualification] = useState(5)

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
    inputTextArea: {
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      marginTop: 10,
      marginBottom: 40,
      height: 100,
      alignItems: 'flex-start'
    },
    statusBar: {
      transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
      height: 10,
      borderRadius: 5,
      marginTop: 5
    },
    ratingItemContainer: {
      position: 'absolute',
      top: -20
    },
    ratingItem: {
      left: '-50%',
      flexDirection: 'column',
      alignItems: 'center'
    },
    ratingLineStyle: {
      height: 10,
      width: 1,
      marginBottom: 10,
      backgroundColor: theme.colors.dusk
    },
    reviewedStyle: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: 20
    },
  })

  const [comments, setComments] = useState<Array<any>>([])
  const [extraComment, setExtraComment] = useState('')
  const [alertState, setAlertState] = useState<{ open: boolean, content: Array<any>, success?: boolean }>({ open: false, content: [], success: false })

  const commentsList = reviewCommentList('driver')

  const onSubmit = () => {
    if (dirverReviews?.qualification === 0) {
      setAlertState({
        open: true,
        content: dirverReviews?.qualification === 0 ? [`${t('REVIEW_QUALIFICATION_REQUIRED', 'Review qualification is required')}`] : []
      })
      return
    }
    handleSendDriverReview()
    setAlertState({ ...alertState, success: true })
  }

  const isSelectedComment = (commentKey: number) => {
    const found = comments.find((comment: any) => comment?.key === commentKey)
    return found
  }

  const handleChangeComment = (commentItem: any) => {
    const found = comments.find((comment: any) => comment?.key === commentItem.key)
    if (found) {
      const _comments = comments.filter((comment: any) => comment?.key !== commentItem.key)
      setComments(_comments)
    } else {
      setComments([...comments, commentItem])
    }
  }

  const handleChangeQualification = (qualification: number) => {
    if (qualification) setDriverReviews({ ...dirverReviews, qualification: qualification, comment: '' })
    setComments([])
    setQualification(qualification)
  }

  const handleSendReviewClick = () => {
    if (!order?.user_review && !isDriverReviewed) {
      onSubmit()
    } else {
      onNavigationRedirect('BottomTab', { screen: 'MyOrders' })
    }
  }

  const Logo = ({ driver }: { driver: any }) => {
    return (
      <View
        style={{
          ...styles.photoWrapper,
          backgroundColor: theme.colors.white,
          marginBottom: 5
        }}
      >
        <OIcon
          url={driver?.photo}
          width={44}
          height={44}
        />
      </View>
    )
  }

  useEffect(() => {
    if (!formState.loading && formState.result?.error) {
      setAlertState({
        open: true,
        success: false,
        content: formState.result?.result || [t('ERROR', 'Error')]
      })
    }
    if (!formState.loading && !formState.result?.error && alertState.success) {
      setIsDriverReviewed && setIsDriverReviewed(true)
      onNavigationRedirect('BottomTab', { screen: 'MyOrders' })
    }
  }, [formState])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Convert all errors in one string to show in toast provider
      const list = Object.values(errors);
      let stringError = '';
      list.map((item: any, i: number) => {
        stringError +=
          i + 1 === list.length ? `- ${item.message}` : `- ${item.message}\n`;
      });
      showToast(ToastType.Error, stringError);
    }
  }, [errors])

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
      comments.map((comment: any) => (_comments += comment.content + '. '))
    }
    const _comment = _comments + extraComment
    setDriverReviews({ ...dirverReviews, comment: _comment })
  }, [comments, extraComment])

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

  useEffect(() => {
    if (!formState?.result?.result) {
      setDriverReviews({ ...dirverReviews, qualification: qualification })
    }
  }, [qualification])

  return (
    <>
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
        ref={scrollref}
      >
        <DriverLogo>
          <View style={{ maxWidth: '75%' }}>
            <OText
              size={20}
              weight="700"
            >
              {t('RATE_THE_EXPERIENCE', 'Rate the experience')}
            </OText>
            {Boolean(order?.driver) && (
              <OText size={14}>{t('HOW_WAS_YOUR_EXPERIENCE_WITH', 'How was your experience with')} {order?.driver?.name}?</OText>
            )}
          </View>
          <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <Logo driver={order?.driver} />
          </View>
        </DriverLogo>
        {order?.review || (formState?.result?.result && !formState?.result?.error) ? (
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
          onClick={handleSubmit(handleSendReviewClick)}
        />
      </FloatingBottomContainer>
    </>
  )
}

export const ReviewDriver = (props: any) => {
  const reviewDriverProps = {
    ...props,
    UIComponent: ReviewDriverUI,
    isToast: true
  }
  return <ReviewDriverController {...reviewDriverProps} />
}
