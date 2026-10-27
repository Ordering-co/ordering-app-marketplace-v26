import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from 'styled-components/native';
import SelectDropdown, { SelectDropdownProps } from 'react-native-select-dropdown';
import IconAntDesign from 'react-native-vector-icons/AntDesign'

import { Block, IconControl } from './styles'
import { ReservationDateTimePicker } from './ReservationDateTimePicker'
import { BusinessReservation as BusinessReservationController, useConfig, useCustomer, useLanguage, useOrder, useSession } from '@components'
import { OButton, OIcon, OText, UserDetails } from '@ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BusinessReservationUI = (props: any) => {
  const {
    navigation,
    cart,
    checkoutFieldsState,
    orderingMethod,
    setOrderingMethod,
    handleAddReservation,
    reservationSetting,
    reservationState,
    setReservationState,
    hoursList,
    reserveDate,
    setReserveDate,
    datesList,
    setOpenReservations,
    isCheckout
  } = props

  const theme = useTheme()
  const [{ options }] = useOrder()
  const [, t] = useLanguage()
  const [{ user, loading: userLoading }] = useSession()
  const [{ configs }] = useConfig()
  const [customerState] = useCustomer()
  const { top } = useSafeAreaInsets()
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [personsList, setPersonsList] = useState<{ value: number; text: string }[]>([])
  const [phoneUpdate, setPhoneUpdate] = useState(false);
  const dropdownRef = useRef<any>(null)

  const hidePlaceReservationButton = isCheckout &&
    !((reservationState?.changes?.guests_reservation !== cart?.reservation?.guests_reservation) ||
      (reservationState?.changes?.reserve_date !== cart?.reservation?.reserve_date)) ||
    (!!cart?.products?.length && !reservationSetting?.allow_preorder_reservation)
  const notFields = ['coupon', 'driver_tip', 'mobile_phone', 'address', 'zipcode', 'address_notes', 'comments']
  const checkoutFields = useMemo(() => checkoutFieldsState?.fields?.filter((field: any) => field.order_type_id === options?.type), [checkoutFieldsState, options])
  const onPlaceReservation = async () => {
    const result = await handleAddReservation(cart?.products)
    setOpenReservations?.(false)
    if (result?.uuid && orderingMethod === 1) {
      if (!isCheckout && navigation?.navigate) {
        navigation.navigate('CheckoutPage', {
          cartUuid: result.uuid
        })
      }
    }
  }

  const styles = StyleSheet.create({
    selectOption: {
      width: '100%',
      backgroundColor: theme.colors.backgroundGray100,
      paddingVertical: 5,
      paddingHorizontal: 14,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 40,
      marginVertical: 15
    },
    dropDownRow: {
      color: theme.colors.primary,
      fontSize: 14,
      marginHorizontal: 0
    },
  })
  const checkValidationFields = () => {
    const userSelected = user
    const _requiredFields: Array<string> = []
    Object.values(checkoutFieldsState?.fields).map((field: any) => {
      if (options?.type === field?.order_type_id &&
        field?.enabled &&
        field?.required &&
        !notFields.includes(field?.validation_field?.code)
      ) {
        if (userSelected && !userSelected[field?.validation_field?.code]) {
          _requiredFields.push(field?.validation_field?.code)
        }
      }
    })
    const mobilePhoneField: any = Object.values(checkoutFieldsState?.fields)?.find((field: any) => field?.order_type_id === options?.type && field?.validation_field?.code === 'mobile_phone')
    if (
      userSelected &&
      !userSelected?.cellphone &&
      ((mobilePhoneField?.enabled &&
        mobilePhoneField?.required) ||
        configs?.verification_phone_required?.value === '1')
    ) {
      _requiredFields.push('cellphone')
    }
    setRequiredFields(_requiredFields)
  }

  const checkGuestValidationFields = () => {
    const userSelected = user
    const _requiredFields = checkoutFieldsState?.fields
      .filter((field: any) => (field?.order_type_id === options?.type) && field?.enabled && field?.required_with_guest &&
        !notFields.includes(field?.validation_field?.code) &&
        field?.validation_field?.code !== 'email' &&
        userSelected && !userSelected[field?.validation_field?.code])
    const requiredFieldsCode = _requiredFields.map((item: any) => item?.validation_field?.code)
    const guestCheckoutCellPhone = checkoutFieldsState?.fields?.find((field: any) => field.order_type_id === options?.type && field?.validation_field?.code === 'mobile_phone')
    const guestCheckoutEmail = checkoutFieldsState?.fields?.find((field: any) => field.order_type_id === options?.type && field?.validation_field?.code === 'email')
    if (
      userSelected &&
      !userSelected?.guest_cellphone &&
      ((guestCheckoutCellPhone?.enabled &&
        guestCheckoutCellPhone?.required_with_guest) ||
        configs?.verification_phone_required?.value === '1')
    ) {
      requiredFieldsCode.push('cellphone')
    }
    if (
      userSelected &&
      !userSelected?.guest_email &&
      guestCheckoutEmail?.enabled &&
      guestCheckoutEmail?.required_with_guest
    ) {
      requiredFieldsCode.push('email')
    }
    setRequiredFields(requiredFieldsCode)
  }

  const handleChangeDate = (date: string) => {
    setReserveDate({
      ...reserveDate,
      date,
      time: null
    })
  }

  const handleChangeTime = (time: string) => {
    setReserveDate({
      ...reserveDate,
      time
    })
    setReservationState({
      ...reservationState,
      changes: {
        ...reservationState?.changes,
        reserve_date: `${reserveDate.date} ${time}:00`
      }
    })
  }

  const togglePhoneUpdate = (val: boolean) => {
    setPhoneUpdate(val)
  }

  useEffect(() => {
    if (checkoutFieldsState?.loading || customerState.loading || userLoading) return
    if (user?.guest_id) {
      checkGuestValidationFields()
    } else {
      checkValidationFields()
    }
  }, [checkoutFieldsState, user, customerState, options?.type])

  useEffect(() => {
    const _menuList: { value: number; text: string }[] = []
    const minPersons = reservationSetting?.min_guests_reservation
    const maxPersons = reservationSetting?.max_guests_reservation
    for (let i = minPersons; i <= maxPersons; i++) {
      _menuList.push({
        value: i,
        text: `${i} ${t('GUESTS', 'Guests')}`
      })
    }
    setPersonsList(_menuList)
  }, [reservationSetting?.min_time_reserve_minutes, reservationSetting?.max_time_reserve_days])

  const HeaderTitle = (props: any) => {
    const { text } = props
    return (
      <OText
        size={16}
        lineHeight={24}
        weight={'500'}
        mBottom={props.mb ?? 10}
        color={theme.colors.textNormal}
      >
        {text}
      </OText>
    )
  }

  const dropDownIcon = () => {
    return (
      <IconAntDesign
        name='down'
        color={theme.colors.textThird}
        size={12}
      />
    )
  }

  const defaultSelectProps = {
    buttonTextAfterSelection: (selectedItem: any) => {
      return selectedItem.text
    },
    rowTextForSelection: (item: any) => {
      return item.text
    },
    buttonStyle: { borderRadius: 7.6, ...styles.selectOption },
    buttonTextStyle: {
      color: theme.colors.textNormal,
      fontSize: 14,
      textAlign: 'left',
      marginHorizontal: 0
    },
    dropdownStyle: {
      borderRadius: 8,
      borderColor: theme.colors.lightGray,
      marginTop: Platform.OS === 'ios' ? 12 : -top
    },
    rowStyle: {
      borderBottomColor: theme.colors.backgroundGray100,
      backgroundColor: theme.colors.backgroundGray100,
      height: 30,
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingTop: 8,
      paddingHorizontal: 12
    },
    renderCustomizedRowChild: (item: any, index: number) => {
      return (
        <Text style={{ ...styles.dropDownRow }}>
          {item.text}
        </Text>
      )
    },
    renderDropdownIcon: () => dropDownIcon(),
    dropdownOverlayColor: 'transparent'
  } satisfies Omit<SelectDropdownProps, 'data' | 'onSelect'>

  const ViewRender = isCheckout ? View : ScrollView

  return (
    <ViewRender>
      {!isCheckout && (
        <Block>
          <UserDetails
            HeaderTitle={<HeaderTitle text={t('CONTACT', 'Contact')} mb={0} />}
            cartStatus={cart?.status}
            businessId={cart?.business_id}
            useValidationFields
            useDefualtSessionManager
            useSessionUser
            isCheckout
            skipIncompletePhoneChange
            phoneUpdate={phoneUpdate}
            togglePhoneUpdate={togglePhoneUpdate}
            isOrderTypeValidationField
            requiredFields={requiredFields}
            checkoutFields={checkoutFields}
          />
        </Block>
      )}
      {!isCheckout && (
        <Block isCheckout={isCheckout}>
          <OText>{t('ORDERING_METHOD', 'Ordering Method')}</OText>
          {!cart?.products?.length && (
            <IconControl onPress={() => setOrderingMethod(1)}>
              {orderingMethod === 1 ? (
                <OIcon src={theme.images.general.radio_act} color={theme.colors.primary} width={16} />
              ) : (
                <OIcon src={theme.images.general.radio_nor} color={theme.colors.disabled} width={16} />
              )}
              <OText mLeft={20}>{t('TABLE_RESERVATION', 'Table reservation')}</OText>
            </IconControl>
          )}
          {reservationSetting?.allow_preorder_reservation && (
            <IconControl onPress={() => setOrderingMethod(2)}>
              {orderingMethod === 2 ? (
                <OIcon src={theme.images.general.radio_act} color={theme.colors.primary} width={16} />
              ) : (
                <OIcon src={theme.images.general.radio_nor} color={theme.colors.disabled} width={16} />
              )}
              <OText mLeft={20}>{t('TABLE_RESERVATION_AND_PREORDER', 'Table reservation & Preorder')}</OText>
            </IconControl>
          )}
          {(!!cart?.products?.length && !reservationSetting?.allow_preorder_reservation) && (
            <OText color='#E63757'>{t('MISSING_ORDERING_METHODS_ERROR', 'No ordering methods available, please remove the products of the cart to continue')}</OText>
          )}
        </Block>
      )}
      <Block isCheckout={isCheckout}>
        <OText>{t('TABLE_SIZE', 'Table Size')}</OText>
        <View>
          <SelectDropdown
            {...defaultSelectProps}
            defaultValue={{
              value: reservationState?.changes?.guests_reservation,
              text: reservationState?.changes?.guests_reservation ? `${reservationState?.changes?.guests_reservation} ${t('GUESTS', 'Guests')}` : t('GUESTS', 'Guests')
            }}
            ref={dropdownRef}
            data={personsList}
            onSelect={(selectedItem, index) => {
              setReservationState({
                ...reservationState,
                changes: {
                  ...reservationState?.changes,
                  guests_reservation: selectedItem?.value
                }
              })
            }}
            defaultButtonText={t('GUESTS', 'Guests')}
          />
        </View>
      </Block>
      <Block isCheckout={isCheckout}>
        <OText>{t('AVAILABLE_TIME_CHOICE', 'Available time choice')}</OText>
        <ReservationDateTimePicker
          datesList={datesList}
          hoursList={hoursList}
          dateSelected={reserveDate?.date}
          timeSelected={reserveDate?.time}
          handleChangeDate={handleChangeDate}
          handleChangeTime={handleChangeTime}
        />
      </Block>
      {isCheckout && (
        <OText color='#909BA9' mBottom={10}>{t('YOU_HAVE', 'You have')} {reservationSetting?.late_arrival_hold_minutes} {t('MINUTES_TOLERANCE_RESERVATION_INFO', 'min of tolerance after the time of your reservation to avoid being canceled')}</OText>
      )}
      {!hidePlaceReservationButton && (
        <OButton
          disabled={!reservationState?.changes?.guests_reservation || !reserveDate?.time || reservationState?.loading}
          onClick={onPlaceReservation}
          text={isCheckout ? t('UPDATE_RESERVATION', 'Update reservation') : orderingMethod === 1 ? t('PLACE_TABLE_RESERVATION_NOW', 'Place Table Reservation Now') : t('SET_TABLE_AND_CHOOSE_PRODUCTS', 'Set table and choose products')}
          style={{
            marginBottom: 60,
            marginHorizontal: 20,
            borderRadius: 7.6
          }}
        />
      )}
    </ViewRender>
  )
}

export const BusinessReservation = (props: any) => {
  const BusinessReservationProps = {
    ...props,
    UIComponent: BusinessReservationUI
  }

  return <BusinessReservationController {...BusinessReservationProps} />
}
