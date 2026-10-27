import '../../../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { useConfig, useOrder } from '@components'

import { MawejaBusinessMenu } from '..'
import { PRODUCT_DESCRIPTION_LIMIT } from '../truncateDescription'
import { renderWithProviders } from '../../../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => {
  const m4 = require('../../../../../../../../jest/helpers/m4MenuComponentsMock')
  return m4.getMock()
})

jest.mock('@ui', () => require('../../../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

jest.mock('../../../../../providers/StoreUtil', () => ({
  _retrieveStoreData: jest.fn().mockResolvedValue(null),
  _removeStoreData: jest.fn(),
  _setStoreData: jest.fn()
}))

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true)
}

const plainProduct = {
  id: 201,
  name: 'Cheese Slice',
  price: 5,
  enabled: true,
  inventoried: false,
  ingredients: [{ id: 1, name: 'Cheese' }],
  extras: [],
  category_id: 10
}

const optionsProduct = {
  ...plainProduct,
  id: 202,
  name: 'Build Your Own',
  extras: [{ id: 9, name: 'Size' }]
}

const inventoriedProduct = {
  ...plainProduct,
  id: 203,
  name: 'Limited Slice',
  inventoried: true,
  ingredients: [],
  extras: []
}

const menuProps = (products: any[], configValue: unknown) => {
  const d = require('../../../../../../../../jest/helpers/m4MenuDefaults')
  return {
    navigation,
    businessState: {
      loading: false,
      error: null,
      business: {
        ...d.sampleBusiness,
        categories: [{
          id: 10,
          name: 'Pizzas',
          rank: 1,
          products
        }]
      }
    },
    categoryState: {
      loading: false,
      error: null,
      pagination: { currentPage: 1, totalPages: 1 },
      products: []
    },
    configValue
  }
}

const renderMenu = (products: any[], configValue: unknown) => {
  const d = require('../../../../../../../../jest/helpers/m4MenuDefaults')
  const addProduct = jest.fn().mockResolvedValue({})
  const updateProduct = jest.fn().mockResolvedValue({})
  ;(useConfig as jest.Mock).mockReturnValue([{
    loading: false,
    configs: {
      add_product_with_one_click: { value: configValue }
    }
  }])
  ;(useOrder as jest.Mock).mockReturnValue([{
    loading: false,
    options: { type: 1 },
    carts: {
      'businessId:1': {
        ...d.sampleCart,
        products: []
      }
    }
  }, { addProduct, updateProduct }])

  const props = menuProps(products, configValue)
  const view = renderWithProviders(<MawejaBusinessMenu {...props} />)
  fireEvent.press(view.getByTestId('maweja-category-10'))
  return { ...view, addProduct, updateProduct }
}

describe('MawejaBusinessMenu quick add', () => {
  beforeEach(() => {
    navigation.navigate.mockClear()
  })

  it('adds a product that lists ingredients but has no options', async () => {
    const { getByTestId, addProduct } = renderMenu([plainProduct], '1')
    await act(async () => {
      fireEvent.press(getByTestId('maweja-product-201'))
    })
    expect(addProduct).toHaveBeenCalled()
    expect(navigation.navigate).not.toHaveBeenCalledWith('ProductDetails', expect.anything())
  })

  it('adds a product when the config value is numeric 1', async () => {
    const { getByTestId, addProduct } = renderMenu([{ ...plainProduct, ingredients: [] }], 1)
    await act(async () => {
      fireEvent.press(getByTestId('maweja-add-201'))
    })
    expect(addProduct).toHaveBeenCalled()
  })

  it('opens the detail when the product has options', async () => {
    const { getByTestId, addProduct } = renderMenu([optionsProduct], '1')
    await act(async () => {
      fireEvent.press(getByTestId('maweja-product-202'))
    })
    expect(addProduct).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetails', expect.objectContaining({
      productId: 202
    }))
  })

  it('opens the detail when quick add is off', async () => {
    const { getByTestId, addProduct } = renderMenu([{ ...plainProduct, ingredients: [], extras: [] }], '0')
    await act(async () => {
      fireEvent.press(getByTestId('maweja-product-201'))
    })
    expect(addProduct).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetails', expect.objectContaining({
      productId: 201
    }))
  })

  it('does not quick-add a service', async () => {
    const { getByTestId, addProduct } = renderMenu([{
      ...plainProduct,
      id: 204,
      name: 'Haircut',
      type: 'service'
    }], '1')
    await act(async () => {
      fireEvent.press(getByTestId('maweja-product-204'))
    })
    expect(addProduct).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetails', expect.objectContaining({
      productId: 204
    }))
  })

  it('shows a short description in full and cuts a long one after 150 characters', () => {
    const short = 'Fresh slice.'
    const long = `${'a'.repeat(PRODUCT_DESCRIPTION_LIMIT)}!`
    const { getByTestId, queryByTestId } = renderMenu([
      { ...plainProduct, description: short },
      { ...plainProduct, id: 205, name: 'Long Slice', description: long },
      { ...plainProduct, id: 206, name: 'Plain Slice' }
    ], '0')

    const textOf = (id: string) => getByTestId(id).props.children[0]
    expect(textOf('maweja-product-description-201')).toBe(short)
    expect(textOf('maweja-product-description-205')).toBe(`${'a'.repeat(PRODUCT_DESCRIPTION_LIMIT)}…`)
    expect(queryByTestId('maweja-product-description-206')).toBeNull()
  })

  it('opens the detail for an inventoried product', async () => {
    const { getByTestId, addProduct } = renderMenu([inventoriedProduct], true)
    await act(async () => {
      fireEvent.press(getByTestId('maweja-product-203'))
    })
    expect(addProduct).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetails', expect.objectContaining({
      productId: 203
    }))
  })
})
