import React, { useState, useEffect } from 'react'
import { View, BackHandler } from 'react-native'
import { useTheme } from 'styled-components/native';
import { useFocusEffect } from '@react-navigation/native'

import {
  Placeholder,
  PlaceholderLine,
  Fade
} from "rn-placeholder";

import { MessageListingWrapper } from './styles';
import { getOrderStatus } from '../../utils'
import { MessageListingParams, OrdersOptionParams } from '../../types'

import { useLanguage, OrderList, OrderDetails as OrderDetailsConTableoller, useBusiness } from '@components'
import {
  OModal,
  NotFoundSource,
  ActiveOrders,
  Messages,
} from '@ui'

const OrdersOptionUI = (props: OrdersOptionParams) => {
  const {
    navigation,
    activeOrders,
    orderList,
    pagination,
    customArray,
    onNavigationRedirect,
    orderStatus,
    loadMoreOrders,
    loadOrders,
    setOrderListState,
    setRefreshOrders,
    refreshOrders,
    onClickOrder
  } = props

  const theme = useTheme();
  const [, t] = useLanguage()
  const { loading, error, orders: values } = orderList
  const orders = customArray || values || []

  const [seletedOrder, setSeletedOrder] = useState<any>()

  useFocusEffect(
    React.useCallback(() => {
      loadOrders()
    }, [navigation])
  )

  useEffect(() => {
    if (loading) return
    setOrderListState(orderList)
  }, [orderList, loading])

  useEffect(() => {
    if (refreshOrders) {
      const fetchOrders = async () => {
        await loadOrders(false, false, false, true)
        setRefreshOrders && setRefreshOrders(false)
      }
      fetchOrders()
    }
  }, [refreshOrders])

  return (
    <>
      {!loading && orders.length === 0 && (
        <NotFoundSource
          srcImage={theme.images.general.notFound}
          content={t('NO_RESULTS_FOUND', 'Sorry, no results found')}
        />
      )}

      {loading && (
        <View style={{ gap: 10 }}>
          {[...Array(6)].map((_, i) => (
            <Placeholder key={i} Animation={Fade}>
              <View style={{ width: '100%', flexDirection: 'row', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10 }}>
                <PlaceholderLine width={20} height={70} style={{ marginRight: 20, marginBottom: 0 }} />
                <Placeholder>
                  <PlaceholderLine width={30} style={{ marginTop: 5, marginBottom: 10 }} />
                  <PlaceholderLine width={50} />
                  <PlaceholderLine width={20} style={{ marginBottom: 0 }} />
                </Placeholder>
              </View>
            </Placeholder>
          ))}
        </View>
      )}

      {!loading && !error && orders.length > 0 && (
        <ActiveOrders
          orders={orders.filter((order: any) => orderStatus.includes(order.status) && order.business_id)}
          pagination={pagination}
          loadMoreOrders={loadMoreOrders}
          customArray={customArray}
          getOrderStatus={getOrderStatus}
          onNavigationRedirect={onNavigationRedirect}
          isMessageView
          handleClickOrder={onClickOrder}
        />
      )}

      {!!seletedOrder?.id && (
        <OModal
          open={!!seletedOrder?.id}
          onClose={() => setSeletedOrder(null)}
        >
          <MessagesView
            order={seletedOrder}
            orderId={seletedOrder?.id}
            onClose={() => setSeletedOrder(null)}
          />
        </OModal>
      )}
    </>
  )
}

const OrderMessageUI = (props: any) => {
  const {
    navigation,
    messages,
    setMessages,
    readMessages,
    messagesReadList,
  } = props;

  const [openMessages, setOpenMessages] = useState({ business: true, driver: false });
  const [unreadAlert, setUnreadAlert] = useState({
    business: false,
    driver: false,
  });
  const [, t] = useLanguage()
  const { order } = props.order;
  const handleArrowBack: any = () => {
    navigation.navigate('BottomTab');
  };

  const handleClose = () => {
    props.onClose?.()
  }

  useEffect(() => {
    if (messagesReadList?.length) {
      openMessages.business
        ? setUnreadAlert({ ...unreadAlert, business: false })
        : setUnreadAlert({ ...unreadAlert, driver: false });
    }
  }, [messagesReadList]);

  useEffect(() => {
    readMessages && readMessages()
  }, [order?.id])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleArrowBack);
    return () => {
      backHandler.remove();
    };
  }, []);

  return (
    <Messages
      orderId={order?.id}
      messages={messages}
      order={order}
      setMessages={setMessages}
      readMessages={readMessages}
      business={openMessages.business}
      driver={openMessages.driver}
      isMeesageListing
      onClose={() => handleClose()}
    />
  )
}

export const OrderListing = (props: OrdersOptionParams) => {
  const [businessState] = useBusiness();
  const OrderListingProps = {
    ...props,
    UIComponent: OrdersOptionUI,
    orderStatus: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    useDefualtSessionManager: true,
    paginationSettings: {
      initialPage: 1,
      pageSize: 10,
      controlType: 'infinity'
    },
    businessId: businessState?.business?.id,
    profileMessages: true,
    orderBy: 'last_direct_message_at',
    orderDirection: 'asc'
  }
  return <OrderList {...OrderListingProps} />
}

export const MessagesView = (props: any) => {
  const orderDetailsProps = {
    ...props,
    UIComponent: OrderMessageUI,
  };
  return <OrderDetailsConTableoller {...orderDetailsProps} />;
};


export const MessageListing = (props: MessageListingParams) => {
  const { setRefreshOrders, onNavigationRedirect, refreshOrders } = props

  const [orderListStatus, setOrderListStatus] = useState({
    error: null,
    loading: false,
    orders: []
  })

  return (
    <MessageListingWrapper>
      <OrderListing
        ordersLength={{ activeOrdersLength: 0, previousOrdersLength: 0 }}
        setOrderListState={setOrderListStatus}
        franchiseId={props.franchiseId}
        setRefreshOrders={setRefreshOrders}
        refreshOrders={refreshOrders}
        onClickOrder={(id: string) => onNavigationRedirect('MessageView', {
          order: orderListStatus?.orders?.find?.((order: any) => order?.uuid === id),
          orderId: id
        })}
      />
    </MessageListingWrapper>
  )
}
