import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { StockCheck } from '../types';
import { parseDateToMillis } from '../utils/dateUtils';

const STOCK_CHECKS_COLLECTION = 'stock_checks';

export const INITIAL_STOCK_CHECKS: StockCheck[] = [
  {
    id: 'sc-656',
    code: 'KK000656',
    time: '04/08/2026 09:52',
    balancedDate: '04/08/2026 09:52',
    actualQty: 10,
    totalActualValue: 650000,
    totalDiff: 7,
    increaseDiffQty: 7,
    decreaseDiffQty: 0,
    status: 'Đã cân bằng',
    note: 'Kiểm kho định kỳ đầu tháng 8',
    items: [
      { productCode: 'SP000001', productName: 'Sơn chống thấm Kova CT-11A 20kg', systemQty: 3, actualQty: 10, diffQty: 7, costPrice: 65000 }
    ],
    starred: false,
    createdAt: '2026-08-04T09:52:00.000Z'
  },
  {
    id: 'sc-655',
    code: 'KK000655',
    time: '03/08/2026 08:42',
    balancedDate: '03/08/2026 08:42',
    actualQty: 3,
    totalActualValue: 195000,
    totalDiff: 3,
    increaseDiffQty: 3,
    decreaseDiffQty: 0,
    status: 'Đã cân bằng',
    note: 'Kiểm kê đột xuất khu vực kho A',
    items: [
      { productCode: 'SP000002', productName: 'Keo chà ron Crocodile White 1kg', systemQty: 0, actualQty: 3, diffQty: 3, costPrice: 65000 }
    ],
    starred: false,
    createdAt: '2026-08-03T08:42:00.000Z'
  },
  {
    id: 'sc-654',
    code: 'KK000654',
    time: '03/08/2026 08:40',
    balancedDate: '03/08/2026 08:40',
    actualQty: 2,
    totalActualValue: 130000,
    totalDiff: 2,
    increaseDiffQty: 2,
    decreaseDiffQty: 0,
    status: 'Đã cân bằng',
    note: 'Kiểm kho cân bằng lẻ',
    items: [
      { productCode: 'SP000003', productName: 'Chất chống thấm Sika Latex TH 5L', systemQty: 0, actualQty: 2, diffQty: 2, costPrice: 65000 }
    ],
    starred: false,
    createdAt: '2026-08-03T08:40:00.000Z'
  }
];

export async function initializeStockChecksIfEmpty(): Promise<StockCheck[]> {
  try {
    const querySnapshot = await getDocs(collection(db, STOCK_CHECKS_COLLECTION));
    const stockChecks: StockCheck[] = [];
    querySnapshot.forEach((docSnap) => {
      stockChecks.push({ ...docSnap.data(), id: docSnap.id } as StockCheck);
    });
    return stockChecks;
  } catch (error) {
    console.error('Error initializing stock checks in Firestore:', error);
    return [];
  }
}

export function subscribeStockChecks(
  onUpdate: (stockChecks: StockCheck[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, STOCK_CHECKS_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const list: StockCheck[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as StockCheck);
        });
        list.sort((a, b) => {
          const timeA = parseDateToMillis(a.time, a.createdAt);
          const timeB = parseDateToMillis(b.time, b.createdAt);
          if (timeA !== timeB) return timeB - timeA;
          return b.code.localeCompare(a.code);
        });
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Error in stock checks snapshot:', err);
      if (onError) onError(err);
      onUpdate([]);
    }
  );
}

export async function addStockCheck(sc: Omit<StockCheck, 'id'>): Promise<string> {
  const docRef = doc(collection(db, STOCK_CHECKS_COLLECTION));
  const newStockCheck: StockCheck = {
    ...sc,
    id: docRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, newStockCheck);
  return docRef.id;
}

export async function updateStockCheck(id: string, updates: Partial<StockCheck>): Promise<void> {
  const docRef = doc(db, STOCK_CHECKS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteStockCheck(id: string): Promise<void> {
  const docRef = doc(db, STOCK_CHECKS_COLLECTION, id);
  await deleteDoc(docRef);
}
