import React from 'react'
import { View } from 'react-native'
import { OText } from '@ui'
import { AddressSuggestContainer } from './styles'

interface MapboxSuggestion {
  mapbox_id?: string;
  full_address?: string;
  name: string;
}

interface Props {
  mapBoxSuggests?: MapboxSuggestion[];
  retrieveSuggestResult: (id: string | undefined, onRetrieve: (address: unknown) => void) => void;
  handleChangeAddressMapbox: (address: unknown) => void;
  onBlurInput: () => void;
  handleChangeInputAddress: (address: string) => void;
}

export const AddressMapBoxList = (props: Props) => {
  const {
    mapBoxSuggests,
    retrieveSuggestResult,
    handleChangeAddressMapbox,
    onBlurInput,
    handleChangeInputAddress
  } = props

  const handleClick = (suggest: MapboxSuggestion) => {
    retrieveSuggestResult(suggest?.mapbox_id, handleChangeAddressMapbox)
    handleChangeInputAddress(suggest?.full_address || suggest?.name)
    onBlurInput()
  }

  return (
    <View>
      {mapBoxSuggests?.map((suggest: MapboxSuggestion) => (
        <AddressSuggestContainer
          key={suggest?.mapbox_id}
          onPress={() => handleClick(suggest)}
        >
          <OText
            color='#959595'
          >
            {suggest?.full_address || suggest?.name}
          </OText>
        </AddressSuggestContainer>
      ))}
    </View>
  )
}
