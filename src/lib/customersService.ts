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
    if (querySnapshot.empty) {
      console.log('Seeding initial customers to Firestore...');
      const batch = writeBatch(db);
      const seeded: Customer[] = [];

      for (const cust of INITIAL_CUSTOMERS) {
        const docRef = doc(collection(db, CUSTOMERS_COLLECTION));
        const newCustomer: Customer = {
          ...cust,
          id: docRef.id,
        };
        batch.set(docRef, newCustomer);
        seeded.push(newCustomer);
      }

      await batch.commit();
      return seeded;
    } else {
      const customers: Customer[] = [];
      querySnapshot.forEach((doc) => {
        customers.push({ ...doc.data(), id: doc.id } as Customer);
      });
      return customers;
    }
  } catch (error) {
    console.error('Error initializing customers in Firestore:', error);
    return INITIAL_CUSTOMERS;
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
        const seeded = await initializeCustomersIfEmpty();
        onUpdate(seeded);
      } else {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Customer);
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
