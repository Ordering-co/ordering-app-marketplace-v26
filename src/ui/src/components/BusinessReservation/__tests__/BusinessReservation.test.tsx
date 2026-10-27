import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { useOrder } from '@components'

import { BusinessReservation } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => ({
  ...require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock(),
  OButton: require('../../shared/OButton').default
}))

const reservationOrderState = {
  loading: false,
  options: { type: 9 },
  carts: {}
}

describe('BusinessReservation', () => {
  beforeEach(() => {
    ;(useOrder as jest.Mock).mockReturnValue([reservationOrderState, {}])
  })

  it('renders reservation shell without crashing', () => {
    const { toJSON, getAllByTestId } = renderWithProviders(
      <BusinessReservation cart={require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart} />
    )
    expect(toJSON()).toBeTruthy()
    expect(getAllByTestId('select-dropdown').length).toBeGreaterThan(0)
  })

  it('renders checkout reservation mode', () => {
    const { toJSON } = renderWithProviders(
      <BusinessReservation
        cart={require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart}
        isCheckout
      />
    )
    expect(toJSON()).toBeTruthy()
  })

  it('selects guest count and continues', () => {
    const { getAllByTestId, toJSON } = renderWithProviders(
      <BusinessReservation cart={require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart} />
    )
    expect(toJSON()).toBeTruthy()
    const items = getAllByTestId(/select-dropdown-item/)
    if (items.length) fireEvent.press(items[0])
  })

  it.each([
    ['without guests', { changes: { guests_reservation: null }, loading: false }, { time: '12:00' }],
    ['without a time', { changes: { guests_reservation: 2 }, loading: false }, { time: null }],
    ['while loading', { changes: { guests_reservation: 2 }, loading: true }, { time: '12:00' }]
  ])('blocks reservation submission %s', async (_label, reservationState, reserveDate) => {
    const handleAddReservation = jest.fn().mockResolvedValue({ uuid: 'synthetic-reservation' })
    const { getByText } = renderWithProviders(
      <BusinessReservation
        cart={{ products: [] }}
        orderingMethod={1}
        reservationState={reservationState}
        reserveDate={reserveDate}
        handleAddReservation={handleAddReservation}
      />
    )
    await act(async () => {
      fireEvent.press(getByText('Place Table Reservation Now'))
    })
    expect(handleAddReservation).not.toHaveBeenCalled()
  })

  it('submits a complete reservation once', async () => {
    const handleAddReservation = jest.fn().mockResolvedValue({ uuid: 'synthetic-reservation' })
    const { getByText } = renderWithProviders(
      <BusinessReservation
        cart={{ products: [] }}
        orderingMethod={1}
        reservationState={{ changes: { guests_reservation: 2 }, loading: false }}
        reserveDate={{ time: '12:00' }}
        handleAddReservation={handleAddReservation}
      />
    )
    await act(async () => {
      fireEvent.press(getByText('Place Table Reservation Now'))
    })
    expect(handleAddReservation).toHaveBeenCalledTimes(1)
  })

})
