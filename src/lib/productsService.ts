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
  // Demo auto-seeding disabled to keep database empty
  return;
}

/**
 * Subscribe to real-time changes in products collection
 */
export function subscribeProducts(onData: (products: Product[]) => void, onError?: (err: Error) => void) {
  const colRef = collection(db, PRODUCTS_COLLECTION);

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
        price: isNaN(Number(data.price)) ? 0 : Number(data.price || 0),
        costPrice: isNaN(Number(data.costPrice)) ? 0 : Number(data.costPrice || 0),
        stock: isNaN(Number(data.stock)) ? 0 : Number(data.stock || 0),
        unit: data.unit || 'Cái',
        maDvtCoBan: data.maDvtCoBan || '',
        quyDoi: isNaN(Number(data.quyDoi)) ? 1 : Number(data.quyDoi || 1),
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
 * Bulk import multiple products using Firestore writeBatch (handles > 500 items in chunks)
 */
export async function importProductsBatch(
  productsList: Product[],
  updateExisting = true
): Promise<{ added: number; updated: number }> {
  let addedCount = 0;
  let updatedCount = 0;

  // Get current products to check existence
  const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const existingMap = new Map<string, string>(); // code/id -> docId
  querySnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    existingMap.set(docSnap.id, docSnap.id);
    if (data.code) existingMap.set(String(data.code).trim().toUpperCase(), docSnap.id);
  });

  // Process in batches of 450 items
  const BATCH_SIZE = 450;
  for (let i = 0; i < productsList.length; i += BATCH_SIZE) {
    const chunk = productsList.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const prod of chunk) {
      const codeKey = (prod.code || `SP${Date.now()}`).trim().toUpperCase();
      const existingDocId = existingMap.get(codeKey) || existingMap.get(prod.id);

      if (existingDocId) {
        if (updateExisting) {
          const docRef = doc(db, PRODUCTS_COLLECTION, existingDocId);
          batch.update(docRef, {
            ...prod,
            category: prod.nhomHang || prod.category || '',
            updatedAt: now,
          });
          updatedCount++;
        }
      } else {
        const prodId = prod.id || prod.code || `SP${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const docRef = doc(db, PRODUCTS_COLLECTION, prodId);
        batch.set(docRef, {
          ...prod,
          id: prodId,
          category: prod.nhomHang || prod.category || '',
          createdAt: now,
          updatedAt: now,
        });
        existingMap.set(codeKey, prodId);
        addedCount++;
      }
    }

    await batch.commit();
  }

  return { added: addedCount, updated: updatedCount };
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
}
