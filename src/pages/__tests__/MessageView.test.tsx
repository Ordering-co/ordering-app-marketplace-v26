import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'

import { useBusiness, useSession } from '@components'
import { renderPage } from '../../../jest/helpers/renderPage'

jest.mock('@ui', () => require('../../../jest/helpers/mockUi'))

jest.mock('../../config.js', () => ({
  __esModule: true,
  default: {
    franchiseSlug: 'demo-franchise'
  }
}))

const mockReadMessages = jest.fn()

jest.mock('@components', () => {
  const mockOrdering = require('../../../jest/helpers/mockOrdering')
  const React = require('react')
  const { View } = require('react-native')
  return {
    ...mockOrdering,
    OrderDetails: (props: any) => {
      const UI = props.UIComponent
      const order = props.order ?? {
        id: 5,
        business: { name: 'Test Business' },
        driver: { name: 'Test Driver' }
      }
      return (
        <View testID="message-view-order-details">
          <UI
            navigation={props.navigation}
            order={{ order }}
            messages={props.messages ?? []}
            setMessages={jest.fn()}
            readMessages={mockReadMessages}
            messagesReadList={props.messagesReadList ?? []}
            business={props.business}
            driver={props.driver}
            goToBack={props.goToBack}
          />
        </View>
      )
    }
  }
})


import MessageView from '../MessageView'


let backHandlerCallback: (() => boolean) | null = null
  const removeBackHandler = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    backHandlerCallback = null
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'hardwareBackPress') {
        backHandlerCallback = handler as () => boolean
      }
      return { remove: removeBackHandler }
    })
    ;(useBusiness as jest.Mock).mockReturnValue([
      { business: { id: 12 } }
    ])
    ;(useSession as jest.Mock).mockReturnValue([
      { auth: true },
      {}
    ])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

describe('MessageView', () => {
  it.each(['ios', 'android'])('keeps the whole chat above the keyboard on %s without double resizing', async (platform) => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', { configurable: true, value: platform })
    const listeners: Record<string, Function> = {}
    const remove = jest.fn()
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
      listeners[event] = listener
      return { remove }
    })
    try {
      const { getByTestId, UNSAFE_getByType, unmount } = renderPage(MessageView, {
        route: { params: { orderId: 10 } }
      })
      const layout = async (height: number) => {
        await act(async () => {
          fireEvent(getByTestId('chat-keyboard-screen'), 'layout', {
            persist: jest.fn(),
            nativeEvent: { layout: { x: 0, y: 0, width: 390, height } }
          })
        })
      }
      const padding = () => StyleSheet.flatten(getByTestId('chat-keyboard-screen').props.style).paddingBottom
      expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding')
      await layout(800)
      await act(async () => {
        listeners[platform === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow']({
          duration: 0,
          endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 300 }
        })
      })
      expect(padding()).toBe(300)
      // adjustResize can consume the entire overlap before JavaScript handles it.
      await layout(500)
      expect(padding()).toBe(0)
      await act(async () => {
        listeners[platform === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide']({
          duration: 0,
          endCoordinates: { screenX: 0, screenY: 800, width: 390, height: 0 }
        })
      })
      await layout(800)
      expect(padding()).toBe(0)
      unmount()
      expect(remove).toHaveBeenCalledTimes(2)
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS })
    }
  })

  it('renders business chat with navbar and close handler', () => {
        const { getByTestId, navigation } = renderPage(MessageView, {
          route: {
            params: {
              order: { id: 8, business: { name: 'Pizza Place' }, driver: { name: 'Sam' } },
              business: true,
              driver: false
            }
          }
        })
        expect(getByTestId('message-view-order-details')).toBeTruthy()
        expect(getByTestId('navbar-title').props.children).toBe('Pizza Place')
        fireEvent.press(getByTestId('navbar-back'))
        expect(navigation.goBack).toHaveBeenCalled()
        fireEvent.press(getByTestId('messages-close'))
        expect(navigation.goBack).toHaveBeenCalledTimes(2)
      })
  
      it('renders driver chat when driver tab is active', () => {
        const { getByTestId } = renderPage(MessageView, {
          route: {
            params: {
              order: { id: 9, business: { name: 'Burger Co' }, driver: { name: 'Alex' } },
              business: false,
              driver: true
            }
          }
        })
        expect(getByTestId('navbar-title').props.children).toBe('Alex')
        expect(getByTestId('navbar-subtitle').props.children).toBe('Driver')
      })
  
      it('reads messages when order changes and handles hardware back', () => {
        const { unmount, navigation } = renderPage(MessageView, {
          route: {
            params: {
              orderId: 10,
              order: { id: 10, business: { name: 'Cafe' }, driver: { name: 'Lee' } }
            }
          }
        })
        expect(mockReadMessages).toHaveBeenCalled()
        expect(backHandlerCallback).toBeTruthy()
        backHandlerCallback?.()
        expect(navigation.navigate).toHaveBeenCalledWith('BottomTab')
        unmount()
        expect(removeBackHandler).toHaveBeenCalled()
      })
})
