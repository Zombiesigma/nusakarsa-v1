'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

/**
 * FirebaseErrorListener memantau galat izin Firestore.
 * Diperbarui untuk tidak menghentikan jalannya aplikasi (hard crash) 
 * guna menjaga pengalaman pengguna tetap mulus kawan.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Kita catat galat di konsol pengembang saja kawan,
      // jangan biarkan ia merusak antarmuka puitis kita.
      console.warn("[Otoritas Ditunda]", error.context.path);
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
