'use server';

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { generateBookPdf } from './pdf-generator';

export async function republishBook(bookId: string): Promise<{ success: boolean; error?: string }> {
    const { firestore } = initializeFirebase();
    if (!firestore) {
        return { success: false, error: 'Koneksi database gagal.' };
    }

    try {
        const pdfUrl = await generateBookPdf(bookId);

        const bookRef = doc(firestore, 'books', bookId);
        await updateDoc(bookRef, {
            fileUrl: pdfUrl,
            updatedAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error republishing book:", error);
        return { success: false, error: error.message || 'Gagal menerbitkan ulang karya.' };
    }
}
