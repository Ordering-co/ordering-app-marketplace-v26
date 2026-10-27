import React from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { ActiveOrdersContainer } from './styles';

import { ActiveOrdersParams } from '../../types';

import { useConfig, useLanguage } from '@components';
import { SingleOrderCard, OButton } from '@ui';

export const ActiveOrders = (props: ActiveOrdersParams) => {
  const {
    onNavigationRedirect,
    orders,
    pagination,
    loadMoreOrders,
    loading,
    getOrderStatus,
    isMessageView,
    handleClickOrder,
    handleUpdateOrderList
  } = props;

  const theme = useTheme();
  const [{ configs }] = useConfig();
  const [, t] = useLanguage();

  const hasMorePages = pagination?.totalPages && pagination?.currentPage < pagination?.totalPages;
  const showLoadMore = hasMorePages || (loading && orders.length > 0);

  return (
    <>
      <ActiveOrdersContainer isMiniCards={configs?.google_maps_api_key?.value} style={showLoadMore ? { marginBottom: 0 } : {}}>
        {orders.length > 0 &&
          orders.map((order: any, index: any) => (
            <SingleOrderCard
              key={index}
              order={order}
              handleClickOrder={handleClickOrder}
              isMessageView={isMessageView}
              getOrderStatus={getOrderStatus}
              onNavigationRedirect={onNavigationRedirect}
              handleUpdateOrderList={handleUpdateOrderList}
            />
          ))}
      </ActiveOrdersContainer>
      {showLoadMore && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <OButton
            onClick={loadMoreOrders}
            text={t('LOAD_MORE_ORDERS', 'Load more orders')}
            loading={loading}
            style={{ borderRadius: 7.6, shadowOpacity: 0 }}
          />
        </View>
      )}
      {!isMessageView && (
        <View
          style={{
            height: 8,
            backgroundColor: theme.colors.backgroundGray100,
            marginHorizontal: -40,
          }}
        />
      )}
    </>
  );
};
