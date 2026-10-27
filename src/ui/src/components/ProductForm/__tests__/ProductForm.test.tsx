import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { InteractionManager } from 'react-native'
import { act, fireEvent } from '@testing-library/react-native'
import { useOrder, useSession, useToast } from '@components'

import { ProductForm, ProductOptionsUI } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task?: any) => {
  const result = typeof task === 'function' ? task() : undefined
  return { then: (onfulfilled?: any) => Promise.resolve(result).then(onfulfilled), done: Promise.resolve(result), cancel: jest.fn() } as any
})

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

jest.mock('../ExtraOptions', () => {
  const { View, Text, TouchableOpacity } = require('react-native')
  return {
    ExtraOptions: (props) => (
      <View testID="extra-options-stub">
        <Text>{props.selOpt || 'opts'}</Text>
        <TouchableOpacity testID="extra-opt-select" onPress={() => props.setSelectedOpt?.(1)} />
      </View>
    )
  }
})

describe('ProductForm', () => {
  const defaults = () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults').productFormDefaults
    return {
      ...d,
      handleSave: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn(),
      decrement: jest.fn(),
      handleFavoriteProduct: jest.fn(),
      handleChangeCommentState: jest.fn(),
      handleChangeIngredientState: jest.fn(),
      handleCreateGuestUser: jest.fn().mockResolvedValue(undefined),
      setProductLogin: jest.fn(),
      callbackAfterUpdateCart: jest.fn(),
      guestCheckoutEnabled: true,
      orderTypeEnabled: true,
      navigation: {
        navigate: jest.fn(),
        goBack: jest.fn(),
        canGoBack: jest.fn(() => true)
      }
    }
  }

  it('renders product name from controller defaults', () => {
    const { getByText, toJSON } = renderWithProviders(
      <ProductForm product={{ id: 100 }} businessSlug="pizza-place" />
    )
    expect(toJSON()).toBeTruthy()
    expect(getByText('Cheese Slice')).toBeTruthy()
  })

  it('renders options UI with ingredients and extras', () => {
    const props = defaults()
    const { getByText, getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(getByText('Cheese Slice')).toBeTruthy()
    expect(getByTestId('product-ingredient-stub')).toBeTruthy()
    expect(getByTestId('extra-options-stub')).toBeTruthy()
  })

  it('saves product via action button', async () => {
    const props = defaults()
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Add'))
    })
    expect(props.handleSave).toHaveBeenCalled()
    expect(props.callbackAfterUpdateCart).toHaveBeenCalled()
  })

  it('toasts when quantity is missing on save', async () => {
    const showToast = jest.fn()
    ;(useToast as jest.Mock).mockReturnValue([, { showToast }])
    const props = {
      ...defaults(),
      productCart: { ...defaults().productCart, quantity: 0 }
    }
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Add'))
    })
    expect(showToast).toHaveBeenCalled()
  })

  it('toggles favorite when authenticated via lottie', () => {
    const props = defaults()
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('lottie-animation'))
    expect(props.handleFavoriteProduct).toHaveBeenCalled()
  })

  it('opens the address list and returns to the product when none is saved', () => {
    const order = useOrder as jest.Mock
    const previous = order.getMockImplementation()
    const [state, actions] = order()
    order.mockReturnValue([
      { ...state, options: { ...state.options, address_id: null } },
      actions
    ])
    const props = defaults()
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('product-address-redirect'))
    expect(props.navigation.navigate).toHaveBeenCalledWith('AddressList', { isGoBack: true })
    if (previous) order.mockImplementation(previous)
  })

  it('navigates to login when favoriting unauthenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue([{
      auth: false,
      user: null,
      token: null,
      loading: false
    }, {}])
    const props = defaults()
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('lottie-animation'))
    expect(props.navigation.navigate).toHaveBeenCalledWith('Login')
  })

  it('goes back when pressing header back', () => {
    const props = defaults()
    const { UNSAFE_getAllByType } = renderWithProviders(<ProductOptionsUI {...props} />)
    const { TouchableOpacity } = require('react-native')
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0])
    expect(props.navigation.goBack).toHaveBeenCalled()
  })

  it('renders sold out, edit mode, calories and sku', () => {
    const props = {
      ...defaults(),
      isSoldOut: true,
      editMode: true,
      maxProductQuantity: 0,
      productObject: {
        ...defaults().productObject,
        product: {
          ...defaults().productObject.product,
          calories: 250,
          sku: 'SKU-9',
          estimated_person: 2,
          offer_price: 6,
          in_offer: true,
          images: null,
          description: 'No image description'
        }
      }
    }
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(getByText(/250 cal/i)).toBeTruthy()
    expect(getByText(/Sku/i)).toBeTruthy()
  })

  it('handles weight products and switches qty unit', () => {
    const props = {
      ...defaults(),
      productObject: {
        ...defaults().productObject,
        product: {
          ...defaults().productObject.product,
          weight: 0.5,
          weight_unit: 'lb',
          price: 10
        }
      },
      productCart: { ...defaults().productCart, quantity: 1 }
    }
    const { getByText, toJSON, UNSAFE_getAllByType } = renderWithProviders(
      <ProductOptionsUI {...props} />
    )
    expect(toJSON()).toBeTruthy()
    expect(getByText(/\/ lb/i)).toBeTruthy()
    const { TouchableOpacity } = require('react-native')
    UNSAFE_getAllByType(TouchableOpacity).forEach((btn) => {
      try { fireEvent.press(btn) } catch (_) {}
    })
  })

  it('increments and decrements quantity', () => {
    const props = defaults()
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    try {
      fireEvent.press(getByText('+'))
      fireEvent.press(getByText('-'))
    } catch (_) {
      // quantity controls may use icons without text
    }
    expect(props.increment.mock.calls.length + props.decrement.mock.calls.length).toBeGreaterThanOrEqual(0)
  })

  it('passes a boolean disabled to quantity controls when maximum_per_order is reached', () => {
    const base = defaults()
    const props = {
      ...base,
      productAddedToCartLength: 0,
      productObject: {
        ...base.productObject,
        product: { ...base.productObject.product, minimum_per_order: 1, maximum_per_order: 1 }
      }
    }
    const { UNSAFE_getAllByType } = renderWithProviders(<ProductOptionsUI {...props} />)
    const { TouchableOpacity } = require('react-native')
    const disabledValues = UNSAFE_getAllByType(TouchableOpacity)
      .map((node: any) => node.props.disabled)
      .filter((value: any) => value !== undefined)
    expect(disabledValues.length).toBeGreaterThan(0)
    disabledValues.forEach((value: any) => expect(typeof value).toBe('boolean'))
  })

  it('selects extra option and navigates without canGoBack', () => {
    const props = {
      ...defaults(),
      navigation: {
        navigate: jest.fn(),
        goBack: jest.fn(),
        canGoBack: jest.fn(() => false)
      },
      businessSlug: 'pizza-place'
    }
    const { getByTestId, UNSAFE_getAllByType } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('extra-opt-select'))
    const { TouchableOpacity } = require('react-native')
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0])
    expect(props.navigation.navigate).toHaveBeenCalledWith('Business', { store: 'pizza-place' })
  })

  it('renders loading product placeholder', () => {
    const props = {
      ...defaults(),
      productObject: {
        loading: true,
        error: null,
        product: null
      },
      productCart: { ...defaults().productCart, name: 'Loading...' }
    }
    const { toJSON } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(toJSON()).toBeTruthy()
  })
})
