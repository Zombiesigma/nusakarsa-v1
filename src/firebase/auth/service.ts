
'use client';

import { initializeFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Layanan Autentikasi Nusakarsa yang Tangguh.
 * Menggunakan inisialisasi malas (lazy injection) untuk mencegah galat network-request-failed.
 */

const getFirebaseAuth = () => initializeFirebase().auth;
const getFirebaseDb = () => initializeFirebase().firestore;

async function createUserProfile(user: User, customPhotoURL?: string, userAgent?: string) {
  const db = getFirebaseDb();
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const baseUsername = user.email?.split('@')[0] || user.uid;
    const normalizedUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');

    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: customPhotoURL || user.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${user.uid}`,
      role: 'pembaca',
      username: normalizedUsername,
      bio: 'Pengguna baru Nusakarsa',
      followers: 0,
      following: 0,
      status: 'online',
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      deviceInfo: userAgent || 'Unknown',
      notificationPreferences: {
        onNewFollower: true,
        onBookComment: true,
        onBookFavorite: true,
      },
    });
  } else {
     await updateDoc(userDocRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
    });
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string, photoURL?: string, userAgent?: string) {
  try {
    const auth = getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await sendEmailVerification(user);

    const finalPhotoURL = photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${user.uid}`;
    await updateProfile(user, { displayName, photoURL: finalPhotoURL });
    
    const userWithProfile = {
      ...user,
      displayName: displayName,
      photoURL: finalPhotoURL
    };

    await createUserProfile(userWithProfile, finalPhotoURL, userAgent);
    return { user: userWithProfile };
  } catch (error) {
    console.error("[Auth Service] Sign Up Error:", error);
    return { error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const auth = getFirebaseAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createUserProfile(userCredential.user);
    return { user: userCredential.user };
  } catch (error) {
    console.error("[Auth Service] Sign In Error:", error);
    return { error };
  }
}

export async function sendPasswordReset(email: string) {
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { error };
  }
}

export async function resendVerificationEmail() {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
        try {
            await sendEmailVerification(auth.currentUser);
            return { success: true };
        } catch (error) {
            return { error };
        }
    }
    return { error: new Error("Tidak ada sesi aktif.") };
}

export async function signInWithGoogle(userAgent?: string) {
  try {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    await createUserProfile(user, undefined, userAgent);
    return { user };
  } catch (error) {
    console.error("[Auth Service] Google Auth Error:", error);
    return { error };
  }
}

export async function signOut() {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const userStatusRef = doc(db, 'users', uid);
        updateDoc(userStatusRef, {
            status: 'offline',
            lastSeen: serverTimestamp(),
        }).catch(err => console.warn("Gagal memperbarui status offline:", err));
    }
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("[Auth Service] Sign Out Error: ", error);
  }
}
