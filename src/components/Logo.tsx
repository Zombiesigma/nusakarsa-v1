import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ className, style }: LogoProps) {
  return (
    <div 
      className={cn("relative overflow-hidden rounded-lg shrink-0 aspect-square flex items-center justify-center", className)} 
      style={style}
    >
      <Image
        src="https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/download.webp"
        alt="Nusakarsa Logo"
        fill
        sizes="(max-width: 768px) 40px, 60px"
        className="object-cover"
        priority
      />
    </div>
  );
}
