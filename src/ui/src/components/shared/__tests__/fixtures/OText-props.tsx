import React from 'react'
import OText from '../../OText'

export const labelledText = <OText testID="product-description">Description</OText>
// @ts-expect-error Native Text identifiers are strings.
export const invalidIdentifier = <OText testID={123}>Description</OText>

export const numericText = <OText>{5}</OText>
// @ts-expect-error Native Text does not render a callback as its child.
export const invalidChildren = <OText>{() => 'Description'}</OText>
