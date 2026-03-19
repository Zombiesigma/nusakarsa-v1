
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch, limit } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Upload, 
  User as UserIcon, 
  Palette, 
  Bell, 
  Shield, 
  Check, 
  Monitor, 
  Moon, 
  Sun, 
  ChevronRight,
  Camera,
  AtSign,
  Heart,
  Pencil
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';
import { uploadProfilePhoto } from '@/lib/uploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const profileFormSchema = z.object({
  username: z.string()
    .min(3, { message: "Nama pengguna minimal 3 karakter." })
    .max(20, { message: "Nama pengguna maksimal 20 karakter." })
    .regex(/^[a-z0-9_]+$/, 'Hanya boleh berisi huruf kecil, angka, dan garis bawah.'),
  displayName: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
  photoURL: z.string().url({ message: "URL foto profil tidak valid." }).optional().or(z.literal('')),
  bio: z.string().max(160, { message: "Bio tidak boleh lebih dari 160 karakter." }).optional(),
});

const notificationFormSchema = z.object({
  onNewFollower: z.boolean().default(true),
  onBookComment: z.boolean().default(true),
  onBookFavorite: z.boolean().default(true),
});

type SettingsTab = 'profile' | 'notifications';

export default function SettingsPage() {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const userProfileRef = (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      displayName: '',
      photoURL: '',
      bio: '',
    },
  });

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
  });

  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        username: userProfile.username,
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL || '',
        bio: userProfile.bio || '',
      });
      notificationForm.reset({
        onNewFollower: userProfile.notificationPreferences?.onNewFollower ?? true,
        onBookComment: userProfile.notificationPreferences?.onBookComment ?? true,
        onBookFavorite: userProfile.notificationPreferences?.onBookFavorite ?? true,
      });
    }
  }, [userProfile, profileForm, notificationForm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File Terlalu Besar' });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadProfilePhoto(file, userProfile.displayName);
      profileForm.setValue('photoURL', url, { shouldDirty: true });
      toast({ variant: 'success', title: "Foto Diunggah" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Upload Gagal" });
    } finally {
      setIsUploading(false);
    }
  };

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userProfileRef || !currentUser || !firestore || !userProfile) return;
    
    setIsSavingProfile(true);
    try {
      const normalizedUsername = values.username.toLowerCase();
      
      if (normalizedUsername !== userProfile.username) {
        const usernameQuery = query(collection(firestore, 'users'), where('username', '==', normalizedUsername), limit(1));
        const usernameSnap = await getDocs(usernameQuery);
        if (!usernameSnap.empty) {
          toast({ variant: 'destructive', title: "Username Sudah Digunakan" });
          setIsSavingProfile(false);
          return;
        }
      }

      await updateProfile(currentUser, {
        displayName: values.displayName,
        photoURL: values.photoURL || userProfile.photoURL,
      });

      const batch = writeBatch(firestore);
      batch.update(userProfileRef, {
        username: normalizedUsername,
        displayName: values.displayName,
        bio: values.bio || '',
        photoURL: values.photoURL || userProfile.photoURL,
      });

      await batch.commit();
      toast({ variant: 'success', title: "Profil Diperbarui" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan" });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onNotificationSubmit(values: z.infer<typeof notificationFormSchema>) {
    if (!userProfileRef) return;
    setIsSavingNotifications(true);
    try {
        await updateDoc(userProfileRef, { notificationPreferences: values });
        toast({ variant: 'success', title: "Preferensi Diperbarui" });
    } catch (error) {
        toast({ variant: "destructive", title: "Gagal Menyimpan" });
    } finally {
        setIsSavingNotifications(false);
    }
  }

  const isLoading = isUserLoading || isProfileLoading;

  const NavItem = ({ tab, icon: Icon, label }: { tab: SettingsTab, icon: any, label: string }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={cn(
            "flex items-center justify-between w-full p-5 rounded-[1.75rem] transition-all",
            activeTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-muted/50 text-muted-foreground"
        )}
    >
        <div className="flex items-center gap-4">
            <Icon className="h-5 w-5" />
            <span className="font-black text-sm uppercase tracking-wider">{label}</span>
        </div>
        <ChevronRight className="h-4 w-4" />
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 pt-6">
      <div className="px-4">
        <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-none italic">
            Pengaturan <span className="text-primary">Akun.</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        <aside className="lg:col-span-4 space-y-6">
            <div className="bg-card/50 backdrop-blur-md border rounded-[2.5rem] p-3 space-y-2 shadow-xl border-white/10">
                <NavItem tab="profile" icon={UserIcon} label="Profil" />
                <NavItem tab="notifications" icon={Bell} label="Notifikasi" />
            </div>
        </aside>

        <main className="lg:col-span-8">
            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card className="border-none shadow-xl bg-card rounded-[3rem] overflow-hidden">
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                                    <CardHeader className="bg-primary/5 p-8 md:p-12 border-b border-primary/10">
                                        <CardTitle className="font-headline text-2xl md:text-3xl font-black">Profil Publik</CardTitle>
                                        <CardDescription>Informasi ini akan ditampilkan di halaman profil Anda.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 md:p-12 space-y-12">
                                        <div className="flex flex-col md:flex-row items-center gap-10">
                                            <div className="relative">
                                                <div className="absolute -inset-2 rounded-full bg-primary/10 blur-2xl animate-pulse" />
                                                <Avatar className="relative h-36 w-36 md:h-44 md:w-44 border-4 border-background shadow-2xl ring-1 ring-border/50">
                                                    <AvatarImage src={profileForm.watch('photoURL')} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-5xl font-black">{profileForm.watch('displayName')?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <button 
                                                    type="button"
                                                    onClick={() => document.getElementById('photo-upload')?.click()}
                                                    className="absolute bottom-2 right-2 bg-primary text-white p-3 rounded-2xl shadow-xl border-4 border-background hover:scale-110 transition-transform"
                                                >
                                                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                                                </button>
                                                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                            </div>
                                            <div className="flex-1 space-y-2 text-center md:text-left">
                                                <h4 className="font-black text-xl tracking-tight uppercase">Citra Visual</h4>
                                                <p className="text-sm text-muted-foreground">Bagaimana pujangga lain mengenali karsa Anda.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FormField control={profileForm.control} name="username" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary/60">Username</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            <Input {...field} className="h-14 rounded-2xl bg-muted/30 border-none font-bold pl-12" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary/60">Nama Panggung</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            <Input {...field} className="h-14 rounded-2xl bg-muted/30 border-none font-bold pl-12" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={profileForm.control} name="bio" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary/60">Biografi</FormLabel>
                                                <FormControl><Textarea {...field} rows={5} className="rounded-[2rem] bg-muted/30 border-none font-medium resize-none p-5" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </CardContent>
                                    <CardFooter className="p-8 md:p-12 flex justify-end">
                                        <Button type="submit" disabled={isSavingProfile || isLoading || !profileForm.formState.isDirty} className="rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                                            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Profil
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'notifications' && (
                    <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card className="border-none shadow-xl bg-card rounded-[3rem] overflow-hidden">
                            <Form {...notificationForm}>
                                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                                    <CardHeader className="bg-primary/5 p-8 border-b">
                                        <CardTitle className="font-headline text-2xl font-black">Pusat Kabar</CardTitle>
                                        <CardDescription>Atur pemberitahuan mana yang ingin Anda terima.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-2">
                                        {[
                                            { name: 'onNewFollower', label: 'Pengikut Baru', description: 'Saat pujangga lain mulai mengikuti Anda.', icon: UserIcon },
                                            { name: 'onBookComment', label: 'Ulasan Karya', description: 'Saat ada ulasan baru pada karya Anda.', icon: Pencil },
                                            { name: 'onBookFavorite', label: 'Koleksi Favorit', description: 'Saat karya Anda ditambahkan ke favorit.', icon: Heart }
                                        ].map((item) => (
                                            <FormField
                                              key={item.name}
                                              control={notificationForm.control}
                                              name={item.name as 'onNewFollower' | 'onBookComment' | 'onBookFavorite'}
                                              render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between p-5 rounded-[2rem] hover:bg-muted/30 transition-all border border-transparent hover:border-border/50">
                                                  <div className="flex items-center gap-4">
                                                    <div className={cn("p-2.5 rounded-xl bg-primary/5 text-primary", field.value && "bg-primary text-white")}>
                                                        <item.icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                      <FormLabel className="font-black text-sm uppercase tracking-wider">
                                                        {item.label}
                                                      </FormLabel>
                                                      <FormDescription className="text-[10px] text-muted-foreground font-medium">
                                                        {item.description}
                                                      </FormDescription>
                                                    </div>
                                                  </div>
                                                  <FormControl>
                                                    <Switch
                                                      checked={field.value}
                                                      onCheckedChange={field.onChange}
                                                    />
                                                  </FormControl>
                                                </FormItem>
                                              )}
                                            />
                                        ))}
                                    </CardContent>
                                    <CardFooter className="p-8 flex justify-end">
                                        <Button type="submit" disabled={isSavingNotifications || isLoading || !notificationForm.formState.isDirty} className="rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                                            {isSavingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
