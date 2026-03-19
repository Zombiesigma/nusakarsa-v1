import Link from 'next/link';
import Image from 'next/image';
import type { Book } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Layers, Heart, CheckCircle2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type BookCardProps = {
  book: Book;
};

export function BookCard({ book }: BookCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderStars = () => {
    const rating = book.averageRating || 0;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
        ))}
        {halfStar && <Star key="half" className="h-3.5 w-3.5 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-gray-300/70" />
        ))}
      </div>
    );
  };

  return (
    <Link href={`/books/${book.id}`} className="group block h-full w-full">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out active:scale-[0.98] border-none shadow-lg hover:shadow-primary/20 rounded-3xl h-full flex flex-col bg-card relative">
        <div className="aspect-[10/16] relative overflow-hidden">
          <Image
            src={book.coverUrl}
            alt={`Sampul ${book.title}`}
            fill
            className="object-cover bg-muted transition-transform duration-500 ease-in-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 20vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Author Avatar on Hover */}
          <div className="absolute top-4 left-4 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
            <Avatar className="h-10 w-10 border-2 border-white/50 shadow-xl">
              <AvatarImage src={book.authorAvatarUrl} alt={book.authorName} className="object-cover" />
              <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">{book.authorName?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>

          {/* Floating info at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-center gap-2 mb-1.5">
                {renderStars()}
                {book.ratingCount > 0 && 
                    <p className="text-[10px] font-bold text-white/70">({book.ratingCount})</p>
                }
            </div>
            <h3 className="font-headline text-lg font-black leading-tight line-clamp-2 italic">
              {book.title}
            </h3>
          </div>
        </div>
        
        <CardContent className="p-4 flex flex-col flex-grow space-y-3 bg-card/50 backdrop-blur-sm border-t border-white/5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            <p className="line-clamp-1">Oleh {book.authorName}</p>
            <div className="flex items-center gap-1.5">
                <Heart className="h-3 w-3 text-rose-500/70" />
                <span>{isMounted ? new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(book.favoriteCount) : '...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/60 pt-2 mt-auto border-t border-dashed border-border/20">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{isMounted ? new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(book.viewCount) : '...'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                <span>{isMounted ? book.chapterCount ?? 0 : '...'} Bab</span>
              </div>
               {book.isCompleted && (
                <div className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold">Tamat</span>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
