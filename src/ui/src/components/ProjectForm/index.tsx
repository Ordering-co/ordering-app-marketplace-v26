import React, { useEffect, useState } from 'react'
import { StyleSheet, useWindowDimensions, View, Keyboard } from 'react-native'
import { useTheme } from 'styled-components/native';
import { Controller, useForm } from 'react-hook-form';
import { FormInput, Container } from './styles'
import {
  ProjectForm as ProjectFormController,
  useApi,
  useLanguage
} from '@components'
import { OButton, OIcon, OInput, OText, ProjectFormParams } from '@ui'

export const ProjectFormUI = (props: ProjectFormParams) => {
  const {
    navigation,
    onNavigationRedirect,
    onSubmit,
    projectState,
    setProjectState
  } = props

  const theme = useTheme()

  const [ordering] = useApi()
  const [, t] = useLanguage()
  const [isKeyboardShow, setIsKeyboardShow] = useState(false);

  const { width } = useWindowDimensions();
  const { control, handleSubmit, errors } = useForm();

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setProjectState?.({ data: null, loading: false })
    }
  }, [errors])

  useEffect(() => {
    if (ordering?.project === projectState?.data?.project_name && !isKeyboardShow) {
      setProjectState?.({ ...projectState, loading: false })
      navigation?.canGoBack() ? navigation?.goBack() : onNavigationRedirect('Home', {})
    }
  }, [ordering, isKeyboardShow])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardShow(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardShow(false);
      },
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Container>
      <View style={{
        alignItems: 'center',
      }}>
        <OIcon
          src={theme.images.logos.logotype}
          style={{
            ...styles.logo,
            resizeMode: 'contain',
            width: width / 2,
            height: (width / 2) * 0.25,
          }}
        />
      </View>
      <FormInput>
        <OText size={20} mBottom={20}>
          {t('PROJECT', 'Project')}
        </OText>
        <Controller
          control={control}
          name='project_name'
          rules={{ required: t(`VALIDATION_ERROR_PROJECT_NAME_REQUIRED`, 'The field project name is required') }}
          defaultValue=""
          render={({ onChange, value }: any) => (
            <OInput
              name='project_name'
              placeholderTextColor={theme.colors.arrowColor}
              placeholder={t('PROJECT_NAME', 'Project Name')}
              icon={theme.images.general.arrow_bar_right}
              iconColor={theme.colors.arrowColor}
              iconStyle={{
                bottom: 2
              }}
              onChange={(e: any) => {
                const project = e?.target?.value?.replace(/\s/g, '')
                onChange(project)
              }}
              selectionColor={theme.colors.primary}
              value={value}
              style={{
                ...styles.input,
                borderColor: Object.keys(errors).length > 0 ? theme.colors.error : theme.colors.inputSignup,
                backgroundColor: theme.colors.transparent,
              }}
              returnKeyType='done'
              autoCorrect={false}
              autoCapitalize='none'
              blurOnSubmit={false}
              onSubmitEditing={() => {
                Keyboard.dismiss()
                handleSubmit(onSubmit)()
              }}
              isValueSync
            />
          )}
        />
      {Object.keys(errors).length > 0 && (
        <OText
          style={{ alignSelf: 'center', marginTop: 5 }}
        >
          {errors['project_name'].message}
        </OText>
      )}
      </FormInput>
      <View style={styles.wrapperBtn}>
        <OButton
          text={t('CONTINUE', 'Continue')}
          textStyle={{
            ...styles.btnText,
            color: theme.colors.inputTextColor,
          }}
          loading={projectState?.loading}
          style={styles.btn}
          onClick={() => {
            Keyboard.dismiss()
            handleSubmit(onSubmit)()
          }}
        />
      </View>
    </Container>
  )
}

export const ProjectForm = (props: ProjectFormParams) => {
  const projectFormProps = {
    ...props,
    UIComponent: ProjectFormUI
  }

  return <ProjectFormController {...projectFormProps} />
}

const styles = StyleSheet.create({
  logo: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 7.6,
  },
  wrapperBtn: {
    marginBottom: 20,
    padding: 20,
  },
  btn: {
    borderRadius: 7.6,
    marginTop: 20,
  },
  btnText: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: 18,
  },
})
