import { cloudCollections, forCloud } from './cloud-fields.mjs';
import { cloudMetaOperation, cloudRecordKey, planCloudChanges } from './cloud-sync-plan.mjs';

const firebaseConfig = {
  projectId: 'bhurtel-finance-tracker',
  appId: '1:933813388738:web:c1ba834dfa2d4116ba025b',
  storageBucket: 'bhurtel-finance-tracker.firebasestorage.app',
  apiKey: 'AIzaSyBWgSU64aAEJPtONBzaZKFtNgfnNdylNFo',
  authDomain: 'bhurtel-finance-tracker.firebaseapp.com',
  messagingSenderId: '933813388738'
};

const firebase = window.firebase;
if (!firebase) throw new Error('Firebase SDK did not load.');
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let baseline = new Map();
let writeQueue = Promise.resolve();
const droppedFields = new Set();

function cleanRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

function cloudRecord(collectionName, source) {
  const { record, dropped } = forCloud(collectionName, cleanRecord(source));
  dropped.forEach((name) => {
    const key = `${collectionName}.${name}`;
    if (!droppedFields.has(key)) {
      droppedFields.add(key);
      console.info(`Cloud sync keeps ${key} on this Mac only.`);
    }
  });
  return record;
}

function publicUser(user) {
  return user ? { uid: user.uid, displayName: user.displayName || '', email: user.email || '' } : null;
}

function setBaseline(data) {
  baseline = new Map();
  cloudCollections.forEach((collectionName) => {
    (data[collectionName] || []).forEach((record) => {
      baseline.set(cloudRecordKey(collectionName, record.id), JSON.stringify(cloudRecord(collectionName, record)));
    });
  });
}

export async function initializeAccountSession(callback) {
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  return auth.onAuthStateChanged((user) => callback(publicUser(user)));
}

export async function signInWithGoogle() {
  const credential = await auth.signInWithPopup(googleProvider);
  return publicUser(credential.user);
}

export function signOutAccount() {
  return auth.signOut();
}

export async function loadCloudState(uid) {
  const metaSnapshot = await db.doc(`users/${uid}/app/meta`).get();
  const snapshots = await Promise.all(cloudCollections.map(async (collectionName) => {
    const result = await db.collection(`users/${uid}/${collectionName}`).get();
    return [collectionName, result.docs.map((entry) => entry.data())];
  }));
  const data = Object.fromEntries(snapshots);
  data.meta = metaSnapshot.exists ? metaSnapshot.data() : {};
  const exists = metaSnapshot.exists || snapshots.some(([, records]) => records.length > 0);
  setBaseline(data);
  return { exists, data };
}

async function commitCloudState(uid, data) {
  const { operations, nextBaseline } = planCloudChanges(cloudCollections, data, baseline, cloudRecord);
  operations.push(cloudMetaOperation(data));
  for (let start = 0; start < operations.length; start += 450) {
    const batch = db.batch();
    operations.slice(start, start + 450).forEach((operation) => {
      const reference = db.doc(`users/${uid}/${operation.collectionName}/${encodeURIComponent(String(operation.recordId))}`);
      if (operation.type === 'delete') batch.delete(reference);
      else batch.set(reference, operation.data);
    });
    await batch.commit();
  }
  baseline = nextBaseline;
}

export function saveCloudState(uid, data) {
  const snapshot = { meta: cleanRecord(data.meta || {}) };
  cloudCollections.forEach((collectionName) => { snapshot[collectionName] = cleanRecord(data[collectionName] || []); });
  writeQueue = writeQueue.catch(() => {}).then(() => commitCloudState(uid, snapshot));
  return writeQueue;
}

export function resetCloudBaseline() {
  baseline = new Map();
}
