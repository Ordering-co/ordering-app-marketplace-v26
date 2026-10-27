import React, { useEffect, useState } from 'react'
import { TouchableOpacity, ActivityIndicator, StyleSheet, View, Platform, Keyboard } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard';
import { useTheme } from 'styled-components/native';
import { launchImageLibrary } from 'react-native-image-picker'
import { GiftedChat, Actions, InputToolbar, Composer, Send, Bubble, MessageImage, ComposerProps } from 'react-native-gifted-chat'
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import 'dayjs/locale/es';

import { USER_TYPE } from '../../config/constants'
import { MessagesParams } from '../../types'
import { getLogisticTag, chatLanguagesAvailable } from '../../utils'

import { Container, QuickMessageContainer } from './styles'

import {
  Messages as MessagesController,
  useSession,
  useUtils,
  useLanguage,
  ToastType,
  useToast
} from '@components'

import { OIconButton, OText, ORDER_STATUS } from '@ui'

const filterSpecialStatus = ['prepared_in', 'delivered_in', 'delivery_datetime']

const MessagesUI = (props: MessagesParams) => {
  const {
    type,
    order,
    messages,
    image,
    message,
    sendMessage,
    setCanRead,
    setMessage,
    handleSend,
    setImage,
    readMessages,
    business,
    driver
  } = props

  const theme = useTheme()
  const { bottom } = useSafeAreaInsets()
  const [{ user }] = useSession()
  const [{ parseDate }] = useUtils()
  const [languageState, t] = useLanguage()
  const [, { showToast }] = useToast()

  const [formattedMessages, setFormattedMessages] = useState<Array<any>>([])
  const [isKeyboardShow, setIsKeyboardShow] = useState(false)
  const previousStatus = [1, 2, 5, 6, 10, 11, 12, 15, 16, 17]
  const chatDisabled = previousStatus.includes(order?.status)

  const quickMessageList = [
    { key: 'customer_message_1', text: t('CUSTOMER_MESSAGE_1', 'Lorem ipsum 1') },
    { key: 'customer_message_2', text: t('CUSTOMER_MESSAGE_2', 'Lorem ipsum 2') },
    { key: 'customer_message_3', text: t('CUSTOMER_MESSAGE_3', 'Lorem ipsum 3') },
    { key: 'customer_message_4', text: t('CUSTOMER_MESSAGE_4', 'Lorem ipsum 4') }
  ]

  const handleClickQuickMessage = (text: string) => {
    setMessage && setMessage(`${message}${text}`)
  }

  const onChangeMessage = (val: string) => {
    setMessage && setMessage(val)
  }

  const removeImage = () => {
    setImage && setImage(null)
  }

  const handleImagePicker = () => {
    launchImageLibrary({ mediaType: 'photo', maxHeight: 2048, maxWidth: 2048, includeBase64: true }, (response: any) => {
      if (response?.didCancel) {
        return
      } else if (response?.errorMessage) {
        showToast(ToastType.Error, response.errorMessage);
      } else {
        if (response?.assets?.length > 0) {
          const image = response?.assets[0]
          const url = `data:${image.type};base64,${image.base64}`
          setImage && setImage(url);
        } else {
          showToast(ToastType.Error, t('IMAGE_NOT_FOUND', 'Image not found'));
        }
      }
    });
  };

  const onSubmit = (values: any) => {
    handleSend && handleSend()
    setImage && setImage(null)
    setMessage && setMessage('')
  }

  const messageConsole = (message: any) => {
    return message.change?.attribute !== 'driver_id'
      ?
      `${t('ORDER', 'Order')} ${t(message.change.attribute.toUpperCase(), message.change.attribute.replace(/_/g, ' '))} ${t('CHANGED_FROM', 'Changed from')} ${filterSpecialStatus.includes(message.change.attribute)
        ? `${message.change.old === null ? '0' : message.change.old} ${t('TO', 'to')} ${message.change.new} ${t('MINUTES', 'Minutes')}`
        : `${message.change?.attribute !== 'logistic_status'
          ? message.change.old !== null && (ORDER_STATUS[parseInt(message.change.old, 10)] ? t(ORDER_STATUS[parseInt(message.change.old, 10)]) : message.change.old)
          : message.change.old !== null && getLogisticTag(message.change.old, t)} ${t('TO', 'to')} ${message.change?.attribute !== 'logistic_status'
            ? ORDER_STATUS[parseInt(message.change.new, 10)] ? t(ORDER_STATUS[parseInt(message.change.new, 10)]) : message.change.new
            : getLogisticTag(message.change.new, t)}`
      }`
      : message.change.new
        ?
        `${message.driver?.name} ${message.driver?.lastname !== null ? message.driver.lastname : ''} ${t('WAS_ASSIGNED_AS_DRIVER', 'Was assigned as driver')} ${message.comment ? message.comment.length : ''}`
        :
        `${t('DRIVER_UNASSIGNED', 'Driver unassigned')}`
  }

  const styles = StyleSheet.create({
    toolbarStyle: {
      paddingHorizontal: 10,
      flexDirection: 'column-reverse',
      backgroundColor: theme.colors.white,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    composerContainer: {
      flexDirection: 'row',
      height: 44,
      width: '85%',
      backgroundColor: theme.colors.inputChat,
      borderRadius: 15,
      alignItems: 'center',
      paddingRight: 10,
    },
    disabledChatContainer: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
    },
    containerActions: {
      width: 44,
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 0,
    },
    containerSend: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: theme.colors.clear,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 0,
    },
    quickMessageChip: {
      borderRadius: 50,
      backgroundColor: theme.colors.white,
      marginRight: 10,
      height: 32,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeImageButton: {
      position: 'absolute',
      top: -5,
      right: -5,
      borderColor: theme.colors.backgroundDark,
      backgroundColor: theme.colors.white,
      borderRadius: 25,
    },
  })

  const RenderActions = (props: any) => (
    <Actions
      {...props}
      containerStyle={styles.containerActions}
      icon={() => (
        <>
          <OIconButton
            borderColor={theme.colors.clear}
            style={{ width: 28, height: 28, backgroundColor: theme.colors.clear, borderColor: theme.colors.clear }}
            icon={image ? { uri: image } : theme.images.general.image}
            iconStyle={{
              borderRadius: image ? 10 : 0,
              width: image ? 32 : 28,
              height: image ? 32 : 28,
              tintColor: theme.colors.textNormal,
            }}
            onClick={handleImagePicker}
            iconCover
          />
          {!!image && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeImage}
            >
              <MaterialCommunityIcon name='close-circle-outline' color={theme.colors.backgroundDark} size={24} />
            </TouchableOpacity>
          )}
        </>
      )}
    />
  )

  const renderAccessory = () => (
    !chatDisabled &&
    <QuickMessageContainer
      horizontal
      contentContainerStyle={{ alignItems: 'center' }}
      showsHorizontalScrollIndicator={false}
    >
      {quickMessageList.map((quickMessage) => (
        <TouchableOpacity
          key={quickMessage.key}
          style={styles.quickMessageChip}
          onPress={() => handleClickQuickMessage(
            (message?.length ?? 0) > 0 ? ` ${quickMessage.text}` : quickMessage.text
          )}
        >
          <OText size={14} color={theme.colors.textNormal}>
            {quickMessage.text}
          </OText>
        </TouchableOpacity>
      ))}
    </QuickMessageContainer>
  )

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={{
        ...styles.toolbarStyle,
        paddingBottom: isKeyboardShow ? 0 : bottom,
      }}
      primaryStyle={{ alignItems: 'center', justifyContent: 'space-between' }}
    />
  )

  const renderComposer = (props: ComposerProps) => (
    chatDisabled ? (
      <View style={styles.disabledChatContainer}>
        <MaterialCommunityIcon
          name='close-octagon-outline'
          size={24}
          color={theme.colors.black}
        />
        <OText size={14} style={{ textAlign: 'center' }}>
          {t('NOT_SEND_MESSAGES', 'You can\'t send messages because the order has ended')}
        </OText>
      </View>
    ) : (
      <View style={styles.composerContainer}>
        <Composer
          {...props}
          textInputStyle={{
            borderRadius: 15,
            borderColor: theme.colors.clear,
            borderWidth: 0,
            color: theme.colors.textNormal,
            flex: 1,
            backgroundColor: theme.colors.inputChat,
          }}
          textInputProps={{
            value: message,
            onSubmitEditing: onSubmit,
            returnKeyType: message ? 'send' : 'done',
            blurOnSubmit: true,
            multiline: false,
            numberOfLines: 1,
            autoCorrect: false,
            enablesReturnKeyAutomatically: false,
          }}
          placeholder={t('WRITE_MESSAGE', 'Write message')}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <RenderActions {...props} />
      </View>
    )
  )

  const renderSend = (props: any) => {
    const isDisabled = (sendMessage?.loading || (message === '' && !image) || messages?.loading)
    return (
      !chatDisabled &&
      <Send
        {...props}
        alwaysShowSend
        disabled={isDisabled}
        containerStyle={styles.containerSend}
      >
        <OIconButton
          onClick={onSubmit}
          style={{
            height: 44,
            width: 44,
            borderRadius: 15,
            borderWidth: 0,
            opacity: isDisabled ? 0.6 : 1,
            borderColor: theme.colors.clear,
            backgroundColor: theme.colors.primary,
          }}
          icon={theme.images.general.send}
          iconStyle={{ top: 1 }}
          iconColor={theme.colors.white}
          disabled={isDisabled}
          disabledColor={theme.colors.white}
        />
      </Send>
    )
  }

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      textStyle={{
        left: {},
        right: { color: theme.colors.white }
      }}
      containerStyle={{
        left: { marginVertical: 5, borderBottomRightRadius: theme.utils.radius.l },
        right: { marginVertical: 5, borderBottomRightRadius: theme.utils.radius.l }
      }}
      wrapperStyle={{
        left: { backgroundColor: theme.colors.inputDisabled, padding: 5, borderBottomLeftRadius: 0 },
        right: { backgroundColor: theme.colors.active, padding: 5, borderBottomRightRadius: 0 }
      }}
    />
  )

  const renderMessageImage = (props: any) => <MessageImage {...props} />

  const renderScrollToBottomComponent = () => <MaterialCommunityIcon name='chevron-double-down' size={32} />

  const onLongPress = (context: any, message: any) => {
    const options = [
      t('COPY_TEXT', 'Copy text'),
      t('CANCEL', 'Cancel'),
    ];
    const cancelButtonIndex = options.length - 1;
    context.actionSheet().showActionSheetWithOptions({
      options,
      cancelButtonIndex
    }, (buttonIndex: any) => buttonIndex === 0 && Clipboard.setString(message.text)
    )
  }

  useEffect(() => {
    const newMessages: Array<any> = []
    const _console = `${t('ORDER_PLACED_FOR', 'Order placed for')} ${parseDate(order?.created_at)} ${t('VIA', 'Via')} ${order?.app_id ? t(order?.app_id.toUpperCase(), order?.app_id) : t('OTHER', 'Other')}`
    const firstMessage = {
      _id: 0,
      type: 1,
      text: _console,
      createdAt: parseDate(order?.created_at, { outputFormat: 'YYYY-MM-DD HH:mm:ss' }),
      user: {
        _id: 0,
        name: t('SYSTEM', 'System'),
        avatar: null
      }
    }
    messages.messages.map((message: any) => {
      if (message.change?.attribute === 'driver_group_id') return
      if (business && message.type !== 0 && (props?.messagesToShow?.messages?.length || message?.can_see?.includes('2'))) {
        newMessages.push({
          _id: message?.id,
          text: message.type === 1 ? messageConsole(message) : message.comment,
          createdAt: message.type !== 0 && parseDate(message?.created_at, { outputFormat: 'YYYY-MM-DD HH:mm:ss' }),
          image: message.source,
          type: message.type,
          user: {
            _id: message.author && message.author.id,
            name: message.author && message.author.name,
            avatar: message.author && (message.author.id !== user.id && type === USER_TYPE.DRIVER ? order?.driver?.photo : order?.business?.logo)
          }
        });
      }

      if (driver && message.type !== 0 && (props?.messagesToShow?.messages?.length || message?.can_see?.includes('4'))) {
        newMessages.push({
          _id: message?.id,
          text: message.type === 1 ? messageConsole(message) : message.comment,
          createdAt: message.type !== 0 && parseDate(message?.created_at, { outputFormat: 'YYYY-MM-DD HH:mm:ss' }),
          image: message.source,
          type: message.type,
          user: {
            _id: message.author && message.author.id,
            name: message.author && message.author.name,
            avatar: message.author && (message.author.id !== user.id && type === USER_TYPE.DRIVER ? order?.driver?.photo : order?.business?.logo)
          }
        });
      }

      if (message.type === 0) {
        newMessages.push(firstMessage);
      }
    })
    let _arrayMessages = [...newMessages.reverse()]

    setFormattedMessages(_arrayMessages);
  }, [messages.messages.length, business, driver])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setIsKeyboardShow(true)
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardShow(false)
    })
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardShow(false)
    })
    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
      keyboardWillHideListener.remove()
    }
  }, [])

  useEffect(() => {
    if (driver) {
      setCanRead({ business: false, administrator: true, customer: true, driver: true })
    } else {
      setCanRead({ business: true, administrator: true, customer: true, driver: false })
    }
  }, [business, driver])

  useEffect(() => {
    if (!order?.id || messages?.loading) return
    readMessages && readMessages()
  }, [order?.id, messages?.loading])

  return (
    <Container>
      <GiftedChat
        isKeyboardInternallyHandled={false}
        alignTop
        scrollToBottom
        locale={chatLanguagesAvailable(languageState?.language?.code)}
        messages={formattedMessages}
        keyboardShouldPersistTaps='handled'
        user={{ _id: user.id, name: user.name, avatar: user.photo }}
        onLongPress={(context: any, message: any) => onLongPress(context, message)}
        isLoadingEarlier={messages.loading}
        renderInputToolbar={renderInputToolbar}
        renderAccessory={!chatDisabled ? renderAccessory : undefined}
        renderComposer={renderComposer}
        renderSend={renderSend}
        renderBubble={renderBubble}
        renderMessageImage={renderMessageImage}
        scrollToBottomStyle={{
          right: 20,
          bottom: 56 + bottom,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
        listViewProps={{
          showsVerticalScrollIndicator: false,
          style: { flex: 1 },
          contentContainerStyle: {
            flexGrow: 1,
            paddingTop: 60,
            paddingBottom: 16,
            paddingHorizontal: theme.utils.margins.horizontal,
            backgroundColor: theme.colors.backgroundPage
          }
        }}
        scrollToBottomComponent={() => renderScrollToBottomComponent()}
        onInputTextChanged={onChangeMessage}
        onSend={onSubmit}
        renderLoading={() => <ActivityIndicator size="small" color="#000" />}
        messagesContainerStyle={{
          backgroundColor: theme.colors.backgroundPage,
          paddingBottom: 24,
        }}
      />
    </Container>
  )
}

export const Messages = (props: MessagesParams) => {
  const [allMessages, setAllMessages] = useState(props.messages)

  useEffect(() => {
    setAllMessages(props.messages)
  }, [props.messages])

  const MessagesProps = {
    ...props,
    UIComponent: MessagesUI,
    messages: allMessages,
    setMessages: (values: any) => {
      props.setMessages && props.setMessages(values)
      setAllMessages(values)
    }
  }
  return <MessagesController {...MessagesProps} />
}
