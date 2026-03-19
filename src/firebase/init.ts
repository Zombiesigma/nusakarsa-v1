import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * @fileOverview Inisialisasi mandiri Firebase dengan pola Singleton yang kokoh.
 * Mencegah dependensi sirkular dan menjamin efisiensi penggunaan sumber daya.
 * Dioptimalkan untuk menghindari 'auth/network-request-failed'.
 */

let cachedApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (!cachedApp) {
    // Inisialisasi App hanya jika belum ada
    cachedApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }

  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }

  if (!cachedDb) {
    cachedDb = getFirestore(cachedApp);
  }

  return { 
    firebaseApp: cachedApp, 
    auth: cachedAuth, 
    firestore: cachedDb 
  };
}
