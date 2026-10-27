import React from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { PreviousOrdersParams } from '../../types';
import {
  WrappButton,
} from './styles';
import { useLanguage } from '@components';
import { OButton, SingleOrderCard } from '@ui';

export const PreviousOrders = (props: PreviousOrdersParams) => {
  const {
    orders,
    pagination,
    onNavigationRedirect,
    loadMoreOrders,
    getOrderStatus,
    handleReorder,
    reorderLoading,
    orderID,
    handleUpdateOrderList,
    loading
  } = props;

  const theme = useTheme();

  const [, t] = useLanguage();

  const pastOrders = [1, 2, 5, 6, 10, 11, 12, 15, 16, 17]

  return (
    <View style={{ marginBottom: 30 }}>
      {orders.map((order: any, i: number) => (
        <SingleOrderCard
          key={i}
          order={order}
          reorderLoading={reorderLoading}
          handleReorder={handleReorder}
          onNavigationRedirect={onNavigationRedirect}
          getOrderStatus={getOrderStatus}
          pastOrders={pastOrders.includes(order?.status)}
          handleUpdateOrderList={handleUpdateOrderList}
        />
      ))}
      {!loading && pagination.totalPages && pagination.currentPage < pagination.totalPages && (
        <WrappButton>
          <OButton
            onClick={loadMoreOrders}
            text={t('LOAD_MORE_ORDERS', 'Load more orders')}
            style={{ borderRadius: 7.6, shadowOpacity: 0, marginTop: 20 }}
          />
        </WrappButton>
      )}
    </View>
  );
};
