import React from 'react'
import { Text } from 'react-native'
import PickerSelect from 'react-native-picker-select'

export const icon: React.ComponentProps<typeof PickerSelect>['Icon'] = () => <Text>Choose</Text>
// @ts-expect-error PickerSelect renders Icon as a component, not an element.
export const invalidIcon: React.ComponentProps<typeof PickerSelect>['Icon'] = <Text>Choose</Text>
