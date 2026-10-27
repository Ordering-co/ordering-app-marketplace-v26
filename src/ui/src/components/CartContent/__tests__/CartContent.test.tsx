import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { useOrder, useConfig } from '@components'

import { CartContent } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

const mockPreview: any = { cartGroup: null, isPending: false, calls: [] }
jest.mock('../../../hooks/useCartGroupPreview', () => ({
  useCartGroupPreview: (options: any) => {
    mockPreview.calls.push(options)
    return { cartGroup: mockPreview.cartGroup, isPending: mockPreview.isPending, loading: mockPreview.isPending }
  }
}))

beforeEach(() => {
  mockPreview.cartGroup = null
  mockPreview.isPending = false
  mockPreview.calls = []
})

const navigation = {
  navigate: jest.fn(),
  addListener: jest.fn((event, cb) => {
    if (event === 'focus') {
      cb?.()
    }
    return jest.fn()
  })
}

describe('CartContent', () => {
  const sampleCart = () => require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart

  it('renders carts from order state', () => {
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: { 'businessId:1': sampleCart() }
    }, { confirmCart: jest.fn() }])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: { checkout_multi_business_enabled: { value: '0' } }
    }])

    const { getByTestId, getByText } = renderWithProviders(
      <CartContent onNavigationRedirect={jest.fn()} navigation={navigation} />
    )
    expect(getByTestId('cart-stub')).toBeTruthy()
    expect(getByText('Pizza Place')).toBeTruthy()
  })

  it('keeps the combined driver tip when a cart has no driver_tip', () => {
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': { ...sampleCart(), driver_tip: undefined },
        'businessId:2': { ...sampleCart(), uuid: 'cart-2', business_id: 2, driver_tip: 3 }
      }
    }, { confirmCart: jest.fn() }])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: {
        checkout_multi_business_enabled: { value: '1' },
        multi_business_checkout_show_combined_driver_tip: { value: '1' }
      }
    }])

    const { getByText } = renderWithProviders(
      <CartContent onNavigationRedirect={jest.fn()} navigation={navigation} />
    )
    expect(getByText('Driver tip')).toBeTruthy()
  })

  it('shows empty cart message when no carts', () => {
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {}
    }, { confirmCart: jest.fn() }])

    const onNavigationRedirect = jest.fn()
    const { getByText } = renderWithProviders(
      <CartContent onNavigationRedirect={onNavigationRedirect} navigation={navigation} />
    )
    expect(getByText("You don't have carts available")).toBeTruthy()
    fireEvent.press(getByText('Start shopping'))
    expect(onNavigationRedirect).toHaveBeenCalledWith('AddressList')
  })

  it('filters by business slug and starts shopping for single business', () => {
    const cart = sampleCart()
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: { 'businessId:1': cart }
    }, { confirmCart: jest.fn() }])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: { checkout_multi_business_enabled: { value: '0' } }
    }])

    const { getByText } = renderWithProviders(
      <CartContent
        onNavigationRedirect={jest.fn()}
        navigation={navigation}
        businessSlug="other-slug"
      />
    )
    expect(getByText("You don't have carts available")).toBeTruthy()

    const onNavigationRedirect = jest.fn()
    const empty = renderWithProviders(
      <CartContent
        onNavigationRedirect={onNavigationRedirect}
        navigation={navigation}
        singleBusiness
        businessSlug="missing"
      />
    )
    fireEvent.press(empty.getByText('Start shopping'))
    expect(onNavigationRedirect).toHaveBeenCalledWith('Business')
  })

  it('renders multi-checkout groups and checkout redirect', () => {
    const cartA = {
      ...sampleCart(),
      uuid: 'cart-a',
      total: 10,
      valid: true,
      status: 0,
      delivery_price_with_discount: 2,
      driver_tip: 1,
      group: { uuid: 'group-1' }
    }
    const cartB = {
      ...sampleCart(),
      uuid: 'cart-b',
      business_id: 2,
      business: { ...sampleCart().business, id: 2, name: 'Burger Place', slug: 'burger-place' },
      total: 12,
      valid: true,
      status: 0,
      delivery_price_with_discount: 3,
      driver_tip: 2,
      group: { uuid: 'group-1' }
    }
    const onNavigationRedirect = jest.fn()
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: { a: cartA, b: cartB }
    }, { confirmCart: jest.fn() }])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: {
        checkout_multi_business_enabled: { value: '1' },
        multi_business_checkout_coupon_input_style: { value: 'group' },
        multi_business_checkout_show_combined_delivery_fee: { value: '1' },
        multi_business_checkout_show_combined_driver_tip: { value: '1' }
      }
    }])

    const { getByText, getAllByText } = renderWithProviders(
      <CartContent onNavigationRedirect={onNavigationRedirect} navigation={navigation} />
    )
    expect(getByText(/Total for all Carts/i)).toBeTruthy()
    expect(getByText(/Total delivery fee/i)).toBeTruthy()
    expect(getByText(/Driver tip/i)).toBeTruthy()
    fireEvent.press(getAllByText('Checkout')[0])
    expect(onNavigationRedirect).toHaveBeenCalled()
  })

  it('renders reservation cart for dine-in and confirms paypal blocked carts', () => {
    const confirmCart = jest.fn().mockResolvedValue({})
    const reservationCart = {
      ...sampleCart(),
      products: [],
      reservation: { id: 1 },
      status: 2,
      paymethod_data: { gateway: 'paypal' }
    }
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 9 },
      carts: { r: reservationCart }
    }, { confirmCart }])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: { checkout_multi_business_enabled: { value: '1' } }
    }])

    const { getByTestId } = renderWithProviders(
      <CartContent onNavigationRedirect={jest.fn()} navigation={navigation} />
    )
    expect(getByTestId('cart-stub')).toBeTruthy()
    expect(confirmCart).toHaveBeenCalledWith('cart-1')
  })

  it('redirects multi-checkout without group uuid', () => {
    const cartA = { ...sampleCart(), uuid: 'a1', valid: true, status: 1, group: null, total: 5 }
    const cartB = {
      ...sampleCart(),
      uuid: 'b1',
      business_id: 2,
      business: { ...sampleCart().business, id: 2, slug: 'b2', name: 'B2' },
      valid: true,
      status: 1,
      group: null,
      total: 6
    }
    const onNavigationRedirect = jest.fn()
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: { a: cartA, b: cartB }
    }, { confirmCart: jest.fn() }])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: {
        checkout_multi_business_enabled: { value: '1' },
        multi_business_checkout_show_combined_delivery_fee: { value: '0' },
        multi_business_checkout_show_combined_driver_tip: { value: '0' }
      }
    }])

    const { getAllByText } = renderWithProviders(
      <CartContent onNavigationRedirect={onNavigationRedirect} navigation={navigation} />
    )
    fireEvent.press(getAllByText('Checkout')[0])
    expect(onNavigationRedirect).toHaveBeenCalledWith('MultiCheckout', { checkCarts: true })
  })

  describe('combined totals with the cart group pricing', () => {
    const multiBusinessConfigs = {
      checkout_multi_business_enabled: { value: '1' },
      multi_business_checkout_show_combined_delivery_fee: { value: '1' },
      multi_business_checkout_show_combined_driver_tip: { value: '1' }
    }
    const buildCarts = () => {
      const salad = { ...sampleCart(), uuid: 'salad', business_id: 100, valid: true, status: 0, total: 69, delivery_price_with_discount: 8.57, driver_tip: 0, group: null }
      const demoCart = {
        ...sampleCart(),
        uuid: 'demoCart',
        business_id: 102,
        business: { ...sampleCart().business, id: 102, name: 'Sample Store Two', slug: 'demoCart' },
        valid: true,
        status: 0,
        total: 105,
        delivery_price_with_discount: 8.57,
        driver_tip: 0,
        group: null
      }
      return { salad, demoCart }
    }

    const renderCarts = () => {
      const { salad, demoCart } = buildCarts()
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1 },
        carts: { 'businessId:100': salad, 'businessId:102': demoCart }
      }, { confirmCart: jest.fn() }])
      ;(useConfig as jest.Mock).mockReturnValue([{ configs: multiBusinessConfigs }])
      return renderWithProviders(<CartContent onNavigationRedirect={jest.fn()} navigation={navigation} />)
    }

    it('sums each cart delivery fee while the group pricing is unavailable', () => {
      const { getByText, getAllByText } = renderCarts()
      expect(getByText('$17.14')).toBeTruthy()
      expect(getAllByText('$174')).toHaveLength(2)
      expect(mockPreview.calls[mockPreview.calls.length - 1]).toEqual({ enabled: true })
    })

    it('shows the group delivery fee and totals once the cart group is priced', () => {
      const { salad, demoCart } = buildCarts()
      mockPreview.cartGroup = { uuid: 'group-1', carts: [salad, { ...demoCart, delivery_price_with_discount: 0, total: 96 }] }
      const { getByText, getAllByText, queryByText } = renderCarts()
      expect(getByText('$8.57')).toBeTruthy()
      expect(getAllByText('$165')).toHaveLength(2)
      expect(queryByText('$17.14')).toBeNull()
    })

    it('shows skeletons instead of the per cart sums while the group pricing loads', () => {
      mockPreview.isPending = true
      const { getByText, queryByText, getAllByTestId } = renderCarts()
      expect(getByText('Total delivery fee')).toBeTruthy()
      expect(queryByText('$17.14')).toBeNull()
      expect(queryByText('$174')).toBeNull()
      expect(getAllByTestId('placeholder')).toHaveLength(3)
    })

    it('checks out the priced cart group even when the carts still carry an older group', () => {
      const { salad, demoCart } = buildCarts()
      mockPreview.cartGroup = { uuid: 'group-1', carts: [salad, demoCart] }
      const stale = { group: { uuid: 'old-group' } }
      const onNavigationRedirect = jest.fn()
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1 },
        carts: { 'businessId:100': { ...salad, ...stale }, 'businessId:102': { ...demoCart, ...stale } }
      }, { confirmCart: jest.fn() }])
      ;(useConfig as jest.Mock).mockReturnValue([{ configs: multiBusinessConfigs }])
      const { getAllByText } = renderWithProviders(<CartContent onNavigationRedirect={onNavigationRedirect} navigation={navigation} />)
      fireEvent.press(getAllByText('Checkout')[0])
      expect(onNavigationRedirect).toHaveBeenCalledWith('MultiCheckout', { cartUuid: 'group-1' })
    })

    it('does not request the group pricing for reservations', () => {
      const reservationCart = { ...sampleCart(), reservation: { id: 1 }, valid: true }
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1 },
        carts: { r: reservationCart }
      }, { confirmCart: jest.fn() }])
      ;(useConfig as jest.Mock).mockReturnValue([{ configs: multiBusinessConfigs }])
      renderWithProviders(<CartContent onNavigationRedirect={jest.fn()} navigation={navigation} />)
      expect(mockPreview.calls[mockPreview.calls.length - 1]).toEqual({ enabled: false })
    })
  })
})
