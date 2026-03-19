'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * @fileOverview Panggung Galeri Seni telah dinonaktifkan.
 */
export default function GalleryPage() {
  useEffect(() => {
    redirect('/');
  }, []);

  return null;
}
