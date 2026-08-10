import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

const COLLECTIONS = [
  'products',
  'orders',
  'suppliers',
  'customers',
  'purchases',
  'stock_checks'
];

async function clearAllData() {
  console.log('Starting deletion of all demo data from Firestore...');
  for (const colName of COLLECTIONS) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        console.log(`Collection "${colName}" is already empty.`);
        continue;
      }

      console.log(`Deleting ${snapshot.docs.length} documents from "${colName}"...`);
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`Successfully cleared collection "${colName}".`);
    } catch (err) {
      console.error(`Error clearing collection "${colName}":`, err);
    }
  }
  console.log('All collections cleared successfully!');
  process.exit(0);
}

clearAllData();
