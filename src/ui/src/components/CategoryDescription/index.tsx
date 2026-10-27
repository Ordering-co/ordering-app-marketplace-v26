import React from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUtils } from '@components'
import { OModal, OText, OIcon } from '@ui'
import { Container } from './styles'
interface CategoryDescriptionParams {
  openDescription?: { name: string, image: string, description: string } | null,
  setOpenDescription: any;
}

function categoryDescriptionPropsAreEqual(prev: any, next: any) {
  return prev.openDescription === next.openDescription
}

const CategoryDescription = (props: CategoryDescriptionParams) => {
  const [{ optimizeImage }] = useUtils()
  const { height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  return (
    <OModal
      open={!!props.openDescription}
      onClose={() => props.setOpenDescription(null)}
      title={props.openDescription?.name}
    >
      <Container height={(height - top - bottom - 60)}>
        <OText size={20} style={{ paddingRight: 20, marginTop: 10, marginBottom: 10 }}>{props.openDescription?.name}</OText>
        <ScrollView>
          {!!props.openDescription?.image && (
            <OIcon
              url={optimizeImage(props.openDescription?.image, 'h_100,c_limit')}
              width={240}
              height={240}
              style={{ borderRadius: 7.6, alignSelf: 'center' }}
            />
          )}
          <OText mBottom={60} style={{ marginTop: 10 }}>{props.openDescription?.description}</OText>
        </ScrollView>
      </Container>
    </OModal>
  )
}

export const CategoryDescriptionMemoized = React.memo(CategoryDescription, categoryDescriptionPropsAreEqual)
