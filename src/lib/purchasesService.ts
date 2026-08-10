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
import { db, auth } from './firebase';
import { PurchaseOrder } from '../types';
import { INITIAL_PURCHASES } from '../data/mockData';
import { parseDateToMillis } from '../utils/dateUtils';

const PURCHASES_COLLECTION = 'purchases';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Seed initial purchases if collection is empty
 */
export async function seedPurchasesIfEmpty(): Promise<void> {
  // Demo auto-seeding disabled
  return;
}

/**
 * Subscribe to real-time changes in purchases collection
 */
export function subscribePurchases(
  onData: (purchases: PurchaseOrder[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PURCHASES_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }

      const purchasesList: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          code: data.code || docSnap.id,
          supplierName: data.supplierName || 'Chưa chọn nhà cung cấp',
          date: data.date || '',
          totalAmount: isNaN(Number(data.totalAmount)) ? 0 : Number(data.totalAmount || 0),
          paidAmount: isNaN(Number(data.paidAmount)) ? 0 : Number(data.paidAmount || 0),
          itemsCount: isNaN(Number(data.itemsCount)) ? (data.items ? data.items.length : 1) : Number(data.itemsCount || 1),
          status: data.status || 'Đã nhập hàng',
          creator: data.creator || 'Chống Thấm 36',
          buyer: data.buyer || 'Chống Thấm 36',
          note: data.note || '',
          discount: isNaN(Number(data.discount)) ? 0 : Number(data.discount || 0),
          items: data.items || [],
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
        };
      });

      // Sort by date / createdAt descending so newest purchases appear first
      purchasesList.sort((a, b) => {
        const timeA = parseDateToMillis(a.date, a.createdAt);
        const timeB = parseDateToMillis(b.date, b.createdAt);
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        return b.code.localeCompare(a.code);
      });

      onData(purchasesList);
    },
    (err) => {
      console.error('Firestore purchases subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, PURCHASES_COLLECTION);
    }
  );
}

/**
 * Add a new purchase order to Firestore
 */
export async function addPurchase(purchaseData: Omit<PurchaseOrder, 'id'> | PurchaseOrder): Promise<PurchaseOrder> {
  const docId = 'id' in purchaseData && purchaseData.id ? purchaseData.id : `po_${Date.now()}`;
  const docRef = doc(db, PURCHASES_COLLECTION, docId);
  const now = new Date().toISOString();

  const payload: PurchaseOrder = {
    ...purchaseData,
    id: docId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, payload);
    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PURCHASES_COLLECTION}/${docId}`);
    return payload;
  }
}

/**
 * Update an existing purchase order in Firestore
 */
export async function updatePurchase(id: string, updates: Partial<PurchaseOrder>): Promise<void> {
  const docRef = doc(db, PURCHASES_COLLECTION, id);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${PURCHASES_COLLECTION}/${id}`);
  }
}

/**
 * Delete a purchase order from Firestore
 */
export async function deletePurchase(id: string): Promise<void> {
  const docRef = doc(db, PURCHASES_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PURCHASES_COLLECTION}/${id}`);
  }
}
