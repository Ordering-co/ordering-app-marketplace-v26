import '../../../../../../jest/helpers/registerM7NativeMocks'

import React from 'react'
import { GiftedChat } from 'react-native-gifted-chat'

import { Messages } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m7ReviewsComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m7ReviewsUiMock').getUiMock())

describe('Messages', () => {
  const m7 = require('../../../../../../jest/helpers/m7ReviewsComponentsMock')
  const d = require('../../../../../../jest/helpers/m7ReviewsDefaults')

  beforeEach(() => {
    m7.resetMockState()
  })

  it('renders chat composer for active orders', () => {
    const d = require('../../../../../../jest/helpers/m7ReviewsDefaults')
    const { getByText, getByTestId, UNSAFE_getByType } = renderWithProviders(
      <Messages orderId={43} messages={d.messagesDefaults.messages} />
    )
    expect(getByText('Write message')).toBeTruthy()
    expect(getByTestId('gifted-chat')).toBeTruthy()
    expect(UNSAFE_getByType(GiftedChat).props.isKeyboardInternallyHandled).toBe(false)
    // GiftedChat reserves accessory height only when it owns this render prop.
    expect(UNSAFE_getByType(GiftedChat).props.renderAccessory).toEqual(expect.any(Function))
  })

  it('shows disabled chat message when order has ended', () => {
    m7.setMockState({ messagesDefaults: d.messagesEndedDefaults })
    const { getByText, UNSAFE_getByType } = renderWithProviders(
      <Messages orderId={41} messages={d.messagesEndedDefaults.messages} />
    )
    expect(getByText(/can't send messages/i)).toBeTruthy()
    expect(UNSAFE_getByType(GiftedChat).props.renderAccessory).toBeUndefined()
  })
})
