'use client';

import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import Image from 'next/image';
import { Logo } from '@/components/Logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthRedirect();

  const authGraphic = PlaceHolderImages.find(img => img.id === 'auth-graphic')?.imageUrl || 'https://picsum.photos/seed/auth/1080/1920';

  return (
    <div className="relative min-h-screen w-full">
      {/* Universal Background */}
      <div className="absolute inset-0">
        <Image
          src={authGraphic}
          alt="Auth background graphic"
          data-ai-hint="library bookshelf"
          fill
          sizes="100vw"
          className="object-cover blur-sm brightness-[.6] saturate-150"
          priority
        />
        <div className="absolute inset-0 bg-black/60 lg:bg-gradient-to-br from-primary/30 via-transparent to-black/50" />
      </div>

      {/* Content Grid */}
      <div className="relative z-10 min-h-screen w-full lg:grid lg:grid-cols-2">
        {/* Left Side - Desktop Text */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12">
          <div className="relative text-white text-center space-y-8 max-w-md">
            <div className="flex justify-center">
              <Logo className="h-20 w-20 rounded-3xl shadow-2xl ring-2 ring-white/10" />
            </div>
            <div className="space-y-4">
              <h1 className="font-headline text-5xl font-black tracking-tight leading-tight drop-shadow-xl">
                Gerbang Menuju <br /><span className="italic">Semesta Karsa.</span>
              </h1>
              <p className="text-lg leading-relaxed text-white/80 font-medium drop-shadow-lg">
                "Setiap kata adalah dunia baru yang menunggu untuk dijelajahi. Mari mulai petualangan Anda di sini."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center p-4 py-12 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
