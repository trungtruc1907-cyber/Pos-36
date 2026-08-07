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
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';

const PRODUCTS_COLLECTION = 'products';

/**
 * Seed initial product list into Firestore if collection is empty
 */
export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (querySnapshot.empty) {
      console.log('Firestore products collection is empty. Seeding initial products...');
      const batch = writeBatch(db);
      for (const prod of INITIAL_PRODUCTS) {
        const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
        batch.set(docRef, {
          ...prod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();
      console.log('Seeded initial products successfully into Firestore!');
    }
  } catch (error) {
    console.error('Error seeding products to Firestore:', error);
  }
}

/**
 * Subscribe to real-time changes in products collection
 */
export function subscribeProducts(onData: (products: Product[]) => void, onError?: (err: Error) => void) {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  
  // First check if seeding is needed
  seedProductsIfEmpty().then(() => {
    // Continue listening
  }).catch(err => console.error(err));

  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onData([]);
      return;
    }
    const productsList: Product[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        loaiHang: data.loaiHang || 'Hàng hóa',
        nhomHang: data.nhomHang || data.category || '',
        code: data.code || docSnap.id,
        maVach: data.maVach || '',
        name: data.name || '',
        brand: data.brand || '',
        price: Number(data.price || 0),
        costPrice: Number(data.costPrice || 0),
        stock: Number(data.stock || 0),
        unit: data.unit || 'Cái',
        maDvtCoBan: data.maDvtCoBan || '',
        quyDoi: Number(data.quyDoi || 1),
        imageUrl: data.imageUrl || '',
        tichDiem: data.tichDiem ?? 1,
        dangKinhDoanh: data.dangKinhDoanh ?? 1,
        duocBanTrucTiep: data.duocBanTrucTiep ?? 1,
        description: data.description || '',
        location: data.location || '',
        category: data.nhomHang || data.category || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Product;
    });
    
    // Sort by code or createdAt
    productsList.sort((a, b) => a.code.localeCompare(b.code));
    onData(productsList);
  }, (err) => {
    console.error('Firestore products subscription error:', err);
    if (onError) onError(err);
  });
}

/**
 * Add product to Firestore
 */
export async function addProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<string> {
  const prodId = product.id || product.code || `SP${Date.now()}`;
  const docRef = doc(db, PRODUCTS_COLLECTION, prodId);
  const now = new Date().toISOString();
  
  const payload = {
    ...product,
    id: prodId,
    category: product.nhomHang || product.category || '',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, payload);
  return prodId;
}

/**
 * Update product in Firestore
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...productData,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete product from Firestore
 */
export async function deleteProduct(id: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Force reset/re-seed database
 */
export async function resetAndSeedDatabase(): Promise<void> {
  const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const deleteBatch = writeBatch(db);
  querySnapshot.docs.forEach((d) => {
    deleteBatch.delete(d.ref);
  });
  await deleteBatch.commit();

  const seedBatch = writeBatch(db);
  for (const prod of INITIAL_PRODUCTS) {
    const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
    seedBatch.set(docRef, {
      ...prod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  await seedBatch.commit();
}
