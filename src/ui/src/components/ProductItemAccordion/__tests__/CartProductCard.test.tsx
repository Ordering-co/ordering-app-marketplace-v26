import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { CartProductCard } from '../CartProductCard'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

describe('CartProductCard', () => {
  const renderCard = (product: any) => {
    const changeQuantity = jest.fn().mockResolvedValue(undefined)
    const utils = renderWithProviders(
      <CartProductCard
        product={{ id: 1, name: 'Soy', price: 7, total: 7, valid_menu: true, ...product }}
        isCartProduct
        onEditProduct={jest.fn()}
        onDeleteProduct={jest.fn()}
        handleEditProduct={jest.fn()}
        changeQuantity={changeQuantity}
      />
    )
    const { TouchableOpacity } = require('react-native')
    const buttons = utils.UNSAFE_getAllByType(TouchableOpacity)
    const plusButton = buttons[buttons.length - 1]
    return { changeQuantity, plusButton }
  }

  it('disables increment when the cart already holds maximum_per_order', () => {
    const { plusButton } = renderCard({ quantity: 1, balance: 1, maximum_per_order: 1 })
    expect(plusButton.props.disabled).toBe(true)
  })

  it('counts other cart lines of the same product against maximum_per_order', () => {
    const { plusButton } = renderCard({ quantity: 1, balance: 2, maximum_per_order: 2 })
    expect(plusButton.props.disabled).toBe(true)
  })

  it('increments while below maximum_per_order', () => {
    const { changeQuantity, plusButton } = renderCard({ quantity: 1, balance: 1, maximum_per_order: 2 })
    expect(plusButton.props.disabled).toBe(false)
    fireEvent.press(plusButton)
    expect(changeQuantity).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 2)
  })

  it('increments without limit when maximum_per_order is not set', () => {
    const { changeQuantity, plusButton } = renderCard({ quantity: 5, balance: 5, maximum_per_order: null })
    fireEvent.press(plusButton)
    expect(changeQuantity).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 6)
  })
})
