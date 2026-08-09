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
import { Supplier } from '../types';
import { parseDateToMillis } from '../utils/dateUtils';

const SUPPLIERS_COLLECTION = 'suppliers';

export const INITIAL_FIRESTORE_SUPPLIERS: Omit<Supplier, 'id'>[] = [
  {
    code: 'NCC000048',
    name: 'Cường Việt NA',
    phone: '0975325757',
    email: '',
    currentDebt: 3300000,
    totalPurchased: 3300000,
    address: 'Nghệ An',
    note: ''
  },
  {
    code: 'NCC000047',
    name: 'Suny - Hải phòng',
    phone: '0000000000',
    email: '',
    currentDebt: 0,
    totalPurchased: 41000000,
    address: 'Hải Phòng',
    note: ''
  },
  {
    code: 'NCC000046',
    name: 'Anh Hào',
    phone: '1122334455',
    email: '',
    currentDebt: 0,
    totalPurchased: 3000000,
    address: 'Thanh Hóa',
    note: ''
  },
  {
    code: 'NCC000045',
    name: 'Conmik Hà Nội',
    phone: '0936682433',
    email: 'contact@conmik.vn',
    currentDebt: 91205008,
    totalPurchased: 362215860,
    address: 'Hà Nội',
    note: ''
  },
  {
    code: 'NCC000044',
    name: 'Sắt Phong Phú',
    phone: '0987302363',
    email: '',
    currentDebt: 0,
    totalPurchased: 14322000,
    address: 'Thanh Hóa',
    note: ''
  },
  {
    code: 'NCC000043',
    name: 'Nilon Thanh Long',
    phone: '0868 191 268',
    email: '',
    currentDebt: 0,
    totalPurchased: 39100000,
    address: 'Thanh Hóa',
    note: ''
  },
  {
    code: 'NCC000042',
    name: 'Công Ty Phúc Đạt',
    phone: '0943514988',
    email: '',
    currentDebt: 729600,
    totalPurchased: 729600,
    address: 'Hà Nội',
    note: ''
  },
  {
    code: 'NCC000041',
    name: 'CX Men',
    phone: '0983756758',
    email: '',
    currentDebt: 0,
    totalPurchased: 48215000,
    address: 'Đà Nẵng',
    note: ''
  },
  {
    code: 'NCC000040',
    name: 'KINTOP',
    phone: '0943330366',
    email: '',
    currentDebt: 0,
    totalPurchased: 32060000,
    address: 'Hà Nội',
    note: ''
  },
  {
    code: 'NCC000039',
    name: 'CÔNG TY CỔ PHẦN BESTMIX',
    phone: '0942559222',
    email: 'info@bestmix.vn',
    currentDebt: 0,
    totalPurchased: 416907000,
    address: 'TP. Hồ Chí Minh',
    note: ''
  },
  {
    code: 'NCC000038',
    name: 'Công ty Sika Việt Nam',
    phone: '028 3568 1111',
    email: 'sikavietnam@vn.sika.com',
    currentDebt: 669831187,
    totalPurchased: 11611481764,
    address: 'Nhơn Trạch, Đồng Nai',
    note: 'Đối tác chiến lược'
  }
];

/**
 * Seed initial suppliers if collection is empty
 */
export async function seedSuppliersIfEmpty(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, SUPPLIERS_COLLECTION));
    if (querySnapshot.empty) {
      console.log('Suppliers collection is empty. Seeding initial supplier records...');
      const batch = writeBatch(db);
      for (const supp of INITIAL_FIRESTORE_SUPPLIERS) {
        const id = supp.code;
        const docRef = doc(db, SUPPLIERS_COLLECTION, id);
        batch.set(docRef, {
          ...supp,
          id,
          createdAt: new Date().toISOString()
        });
      }
      await batch.commit();
      console.log('Seeded initial suppliers successfully!');
    }
  } catch (error) {
    console.error('Error seeding suppliers:', error);
  }
}

/**
 * Subscribe to real-time changes in suppliers collection
 */
export function subscribeSuppliers(onData: (suppliers: Supplier[]) => void, onError?: (err: Error) => void) {
  const colRef = collection(db, SUPPLIERS_COLLECTION);

  seedSuppliersIfEmpty().then(() => {
    // seeded
  }).catch((err) => console.error(err));

  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onData([]);
      return;
    }

    const suppliersList: Supplier[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        code: data.code || docSnap.id,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        currentDebt: Number(data.currentDebt || 0),
        totalPurchased: Number(data.totalPurchased || 0),
        address: data.address || '',
        note: data.note || '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      };
    });

    // Sort descending by time or code
    suppliersList.sort((a, b) => {
      const timeA = parseDateToMillis((a as any).createdAt || (a as any).updatedAt);
      const timeB = parseDateToMillis((b as any).createdAt || (b as any).updatedAt);
      if (timeA !== timeB) return timeB - timeA;
      return b.code.localeCompare(a.code);
    });

    onData(suppliersList);
  }, (err) => {
    console.error('Firestore suppliers subscription error:', err);
    if (onError) onError(err);
  });
}

/**
 * Add a new supplier to Firestore
 */
export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<string> {
  const id = supplierData.code || `NCC${Date.now()}`;
  const docRef = doc(db, SUPPLIERS_COLLECTION, id);
  const now = new Date().toISOString();

  const payload = {
    ...supplierData,
    id,
    code: id,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, payload);
  return id;
}

/**
 * Update existing supplier
 */
export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
  const docRef = doc(db, SUPPLIERS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a supplier
 */
export async function deleteSupplier(id: string): Promise<void> {
  const docRef = doc(db, SUPPLIERS_COLLECTION, id);
  await deleteDoc(docRef);
}
