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
import { Customer } from '../types';
import { INITIAL_CUSTOMERS } from '../data/mockData';
import { parseDateToMillis } from '../utils/dateUtils';

const CUSTOMERS_COLLECTION = 'customers';

export async function initializeCustomersIfEmpty(): Promise<Customer[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    const customers: Customer[] = [];
    querySnapshot.forEach((doc) => {
      customers.push({ ...doc.data(), id: doc.id } as Customer);
    });
    return customers;
  } catch (error) {
    console.error('Error initializing customers in Firestore:', error);
    return [];
  }
}

export function subscribeCustomers(
  onUpdate: (customers: Customer[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, CUSTOMERS_COLLECTION);
  
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            ...data,
            id: docSnap.id,
            totalSpent: isNaN(Number(data.totalSpent)) ? 0 : Number(data.totalSpent || 0),
            orderCount: isNaN(Number(data.orderCount)) ? 0 : Number(data.orderCount || 0),
            debt: isNaN(Number(data.debt)) ? 0 : Number(data.debt || 0),
            points: isNaN(Number(data.points)) ? 0 : Number(data.points || 0),
          } as Customer);
        });
        list.sort((a, b) => {
          const timeA = parseDateToMillis((a as any).createdAt || (a as any).updatedAt);
          const timeB = parseDateToMillis((b as any).createdAt || (b as any).updatedAt);
          if (timeA !== timeB) return timeB - timeA;
          return (b.code || '').localeCompare(a.code || '');
        });
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Error listening to customers:', err);
      if (onError) onError(err);
    }
  );
}

export async function addCustomer(newCustomer: Omit<Customer, 'id'>): Promise<Customer> {
  const docRef = doc(collection(db, CUSTOMERS_COLLECTION));
  const created: Customer = {
    ...newCustomer,
    id: docRef.id,
  };
  await setDoc(docRef, created);
  return created;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const docRef = doc(db, CUSTOMERS_COLLECTION, id);
  await updateDoc(docRef, updates);
}

export async function deleteCustomer(id: string): Promise<void> {
  const docRef = doc(db, CUSTOMERS_COLLECTION, id);
  await deleteDoc(docRef);
}
