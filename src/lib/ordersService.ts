import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Order } from '../types';

import { parseDateToMillis } from '../utils/dateUtils';

const ORDERS_COLLECTION = 'orders';

export const INITIAL_FIRESTORE_ORDERS: Omit<Order, 'id'>[] = [
  {
    orderCode: 'HD009721',
    date: '07/08/2026 10:03:12',
    returnCode: '',
    customerCode: 'KH000009',
    customerName: 'Khách lẻ',
    subtotal: 1150000,
    discount: 0,
    totalAmount: 1150000,
    amountPaid: 1150000,
    itemsCount: 2,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009720',
    date: '07/08/2026 10:02:40',
    returnCode: '',
    customerCode: 'KH000009',
    customerName: 'Khách lẻ',
    subtotal: 180000,
    discount: 0,
    totalAmount: 180000,
    amountPaid: 180000,
    itemsCount: 1,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009723.01',
    date: '06/08/2026 10:07:21',
    returnCode: '',
    customerCode: 'KH000189',
    customerName: 'A Khanh',
    subtotal: 3332000,
    discount: 0,
    totalAmount: 3332000,
    amountPaid: 0,
    itemsCount: 3,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009719',
    date: '06/08/2026 08:03:55',
    returnCode: '',
    customerCode: 'KH000298',
    customerName: 'Đăng Anh',
    subtotal: 1560000,
    discount: 0,
    totalAmount: 1560000,
    amountPaid: 0,
    itemsCount: 2,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009718',
    date: '06/08/2026 08:01:18',
    returnCode: '',
    customerCode: 'KH000090',
    customerName: 'Thắng Bôn',
    subtotal: 550000,
    discount: 0,
    totalAmount: 550000,
    amountPaid: 0,
    itemsCount: 1,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009717',
    date: '05/08/2026 08:53:54',
    returnCode: '',
    customerCode: 'KH000046',
    customerName: 'Chị Xoan Diện',
    subtotal: 7000000,
    discount: 0,
    totalAmount: 7000000,
    amountPaid: 0,
    itemsCount: 4,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009716',
    date: '05/08/2026 08:03:49',
    returnCode: '',
    customerCode: 'KH000009',
    customerName: 'Khách lẻ',
    subtotal: 470000,
    discount: 0,
    totalAmount: 470000,
    amountPaid: 470000,
    itemsCount: 1,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009715',
    date: '05/08/2026 06:53:22',
    returnCode: '',
    customerCode: 'TS',
    customerName: 'TRƯỜNG SƠN',
    subtotal: 1000000,
    discount: 0,
    totalAmount: 1000000,
    amountPaid: 0,
    itemsCount: 2,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009714',
    date: '04/08/2026 09:53:01',
    returnCode: '',
    customerCode: 'KH000049',
    customerName: 'A Tài - Nông Cống',
    subtotal: 2675000,
    discount: 0,
    totalAmount: 2675000,
    amountPaid: 0,
    itemsCount: 3,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009713',
    date: '04/08/2026 07:14:07',
    returnCode: '',
    customerCode: 'TS',
    customerName: 'TRƯỜNG SƠN',
    subtotal: 2470000,
    discount: 0,
    totalAmount: 2470000,
    amountPaid: 0,
    itemsCount: 2,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009711',
    date: '03/08/2026 17:56:27',
    returnCode: '',
    customerCode: 'KH000009',
    customerName: 'Khách lẻ',
    subtotal: 870000,
    discount: 0,
    totalAmount: 870000,
    amountPaid: 870000,
    itemsCount: 1,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009710',
    date: '03/08/2026 17:55:49',
    returnCode: '',
    customerCode: 'KH000279',
    customerName: 'Anh Nội - Thiệu Trung',
    subtotal: 2320000,
    discount: 0,
    totalAmount: 2320000,
    amountPaid: 2320000,
    itemsCount: 2,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009709',
    date: '03/08/2026 09:04:23',
    returnCode: '',
    customerCode: 'KH000090',
    customerName: 'Thắng Bôn',
    subtotal: 1225000,
    discount: 0,
    totalAmount: 1225000,
    amountPaid: 0,
    itemsCount: 1,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009708.01',
    date: '03/08/2026 08:43:34',
    returnCode: '',
    customerCode: 'KH000300',
    customerName: 'Anh Linh - Jappont',
    subtotal: 2940000,
    discount: 0,
    totalAmount: 2940000,
    amountPaid: 0,
    itemsCount: 2,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009707.01',
    date: '03/08/2026 08:41:25',
    returnCode: '',
    customerCode: 'KH000049',
    customerName: 'A Tài - Nông Cống',
    subtotal: 8425000,
    discount: 0,
    totalAmount: 8425000,
    amountPaid: 0,
    itemsCount: 5,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009706.01',
    date: '03/08/2026 07:01:04',
    returnCode: '',
    customerCode: 'TS',
    customerName: 'TRƯỜNG SƠN',
    subtotal: 3060000,
    discount: 0,
    totalAmount: 3060000,
    amountPaid: 0,
    itemsCount: 3,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009705',
    date: '02/08/2026 11:38:32',
    returnCode: '',
    customerCode: 'KH000009',
    customerName: 'Khách lẻ',
    subtotal: 70000,
    discount: 0,
    totalAmount: 70000,
    amountPaid: 70000,
    itemsCount: 1,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009704.01',
    date: '02/08/2026 09:10:19',
    returnCode: '',
    customerCode: 'KH000006',
    customerName: 'Linh - Nga Sơn',
    subtotal: 1740000,
    discount: 0,
    totalAmount: 1740000,
    amountPaid: 0,
    itemsCount: 2,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009703',
    date: '01/08/2026 17:33:41',
    returnCode: '',
    customerCode: 'KH000299',
    customerName: 'Công ty Khải Hoàn',
    subtotal: 1800000,
    discount: 0,
    totalAmount: 1800000,
    amountPaid: 1800000,
    itemsCount: 1,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009701',
    date: '01/08/2026 15:46:26',
    returnCode: '',
    customerCode: 'KH000009',
    customerName: 'Khách lẻ',
    subtotal: 20000,
    discount: 0,
    totalAmount: 20000,
    amountPaid: 20000,
    itemsCount: 1,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009700',
    date: '01/08/2026 14:12:37',
    returnCode: '',
    customerCode: 'KH000108',
    customerName: 'Điệp Thạch Thành',
    subtotal: 470000,
    discount: 0,
    totalAmount: 470000,
    amountPaid: 0,
    itemsCount: 1,
    paymentMethod: 'cash',
    status: 'Đã thanh toán',
    items: [],
  },
  {
    orderCode: 'HD009699',
    date: '01/08/2026 14:11:59',
    returnCode: '',
    customerCode: 'TS',
    customerName: 'TRƯỜNG SƠN',
    subtotal: 19500000,
    discount: 0,
    totalAmount: 19500000,
    amountPaid: 0,
    itemsCount: 10,
    paymentMethod: 'transfer',
    status: 'Đã thanh toán',
    items: [],
  },
];

/**
 * Seed initial orders if collection is empty
 */
export async function seedOrdersIfEmpty(): Promise<void> {
  // Demo auto-seeding disabled
  return;
}

/**
 * Subscribe to real-time changes in orders collection
 */
export function subscribeOrders(onData: (orders: Order[]) => void, onError?: (err: Error) => void) {
  const colRef = collection(db, ORDERS_COLLECTION);

  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onData([]);
      return;
    }

    const ordersList: Order[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const subtotalRaw = Number(data.subtotal ?? data.totalAmount ?? 0);
      const subtotal = isNaN(subtotalRaw) ? 0 : subtotalRaw;
      const discountRaw = Number(data.discount ?? 0);
      const discount = isNaN(discountRaw) ? 0 : discountRaw;
      const totalAmountRaw = Number(data.totalAmount ?? (subtotal - discount));
      const totalAmount = isNaN(totalAmountRaw) ? 0 : totalAmountRaw;
      const amountPaidRaw = Number(data.amountPaid ?? totalAmount);
      const amountPaid = isNaN(amountPaidRaw) ? 0 : amountPaidRaw;
      const itemsCountRaw = Number(data.itemsCount || (data.items ? data.items.length : 1));
      const itemsCount = isNaN(itemsCountRaw) ? 1 : itemsCountRaw;

      return {
        id: docSnap.id,
        orderCode: data.orderCode || docSnap.id,
        date: data.date || '',
        returnCode: data.returnCode || '',
        customerCode: data.customerCode || 'KH000009',
        customerName: data.customerName || 'Khách lẻ',
        subtotal: subtotal,
        discount: discount,
        totalAmount: totalAmount,
        amountPaid: amountPaid,
        itemsCount: itemsCount,
        paymentMethod: data.paymentMethod || 'cash',
        status: data.status || 'Đã thanh toán',
        items: data.items || [],
        note: data.note || '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      };
    });

    // Sort by date / createdAt descending so newest orders appear first
    ordersList.sort((a, b) => {
      const timeA = parseDateToMillis(a.date, a.createdAt);
      const timeB = parseDateToMillis(b.date, b.createdAt);
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.orderCode.localeCompare(a.orderCode);
    });

    onData(ordersList);
  }, (err) => {
    console.error('Firestore orders subscription error:', err);
    if (onError) onError(err);
  });
}

/**
 * Add a new order to Firestore
 */
export async function addOrder(orderData: Omit<Order, 'id'>): Promise<string> {
  const orderId = `ord_${Date.now()}`;
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const now = new Date().toISOString();

  const payload = {
    ...orderData,
    id: orderId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, payload);
  return orderId;
}

/**
 * Update an existing order in Firestore
 */
export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
