'use client';

import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  PenTool, 
  Users, 
  ShieldCheck, 
  HelpCircle,
  MessageCircle,
  Share2,
  Maximize2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function GuidePage() {
  const sections = [
    {
      id: "reader",
      icon: BookOpen,
      title: "Panduan Untuk Pembaca",
      description: "Jelajahi ribuan imajinasi dengan kenyamanan maksimal.",
      color: "text-blue-500",
      bg: "bg-blue-500/5",
      content: [
        { 
          q: "Bagaimana cara menemukan mahakarya baru?", 
          a: "Gunakan bilah pencarian di bagian atas untuk mencari judul, penulis, atau genre spesifik. Halaman utama juga menampilkan karya-karya terbaru dan terpopuler untuk inspirasi Anda." 
        },
        { 
          q: "Apa itu 'Mode Baca' dan bagaimana cara mengaturnya?", 
          a: "Saat membaca sebuah karya, klik ikon gerigi (Pengaturan) di pojok kanan atas. Anda bisa mengubah tema (terang, gelap, sepia, bahkan tekstur kertas), jenis font, dan ukuran huruf untuk pengalaman membaca yang paling nyaman." 
        },
        { 
          q: "Bagaimana cara menyimpan karya favorit saya?", 
          a: "Pada halaman detail buku, klik ikon hati untuk menambahkan karya ke 'Pustaka Saya'. Semua karya favorit Anda akan tersimpan rapi di sana untuk diakses kembali kapan saja." 
        },
        { 
          q: "Apa fungsi dari fitur 'Soundtrack'?", 
          a: "Beberapa penulis menyertakan daftar putar musik untuk menemani Anda saat membaca. Klik ikon headphone di halaman baca untuk memutar, mengontrol volume, atau bahkan mencari musik lain dari YouTube untuk membangun suasana yang sempurna." 
        }
      ]
    },
    {
      id: "author",
      icon: PenTool,
      title: "Panduan Karir Penulis",
      description: "Dari draf pertama hingga menjadi pujangga ternama.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/5",
      content: [
        { 
          q: "Bagaimana cara mulai menulis di Nusakarsa?", 
          a: "Pertama, Anda harus menjadi penulis terverifikasi. Kunjungi halaman 'Jadi Penulis' dan isi formulir pengajuan. Setelah disetujui, Anda dapat mulai membuat karya baru melalui menu 'Studio'." 
        },
        { 
          q: "Apa itu Studio Penulis?", 
          a: "Studio adalah ruang kerja digital Anda. Di sini Anda bisa mengelola semua draf, menambahkan bab baru, mengatur identitas karya (sampul, sinopsis), dan menyematkan playlist musik untuk pembaca." 
        },
        { 
          q: "Bagaimana proses publikasi karya?", 
          a: "Setelah naskah Anda selesai, klik tombol 'Terbitkan' di dalam editor. Karya Anda akan masuk ke antrean moderasi. Tim kurasi kami akan meninjaunya untuk memastikan kualitas sebelum resmi diterbitkan ke seluruh pembaca." 
        },
        {
          q: "Apakah saya bisa mengimpor naskah yang sudah ada?",
          a: "Tentu! Saat membuat karya baru, pilih metode 'Impor Berkas'. Nusakarsa mendukung format .docx, .txt, dan .pdf. Sistem akan secara otomatis mengekstrak teksnya menjadi draf bab pertama Anda, menghemat waktu penulisan ulang."
        }
      ]
    },
    {
      id: "community",
      icon: Users,
      title: "Etiket Komunitas",
      description: "Menjaga ekosistem sastra yang sehat dan suportif.",
      color: "text-purple-500",
      bg: "bg-purple-500/5",
      content: [
        { 
          q: "Bagaimana cara berinteraksi yang baik?", 
          a: "Tinggalkan ulasan yang konstruktif dan apresiatif. Hargai karya setiap penulis. Hindari komentar yang mengandung ujaran kebencian, spam, atau promosi tidak relevan. Setiap interaksi adalah cerminan dari komunitas kita." 
        },
        { 
          q: "Apa itu plagiarisme dan bagaimana Nusakarsa menanganinya?", 
          a: "Plagiarisme adalah mengambil karya orang lain dan mengklaimnya sebagai milik sendiri. Nusakarsa memiliki kebijakan nol toleransi terhadap plagiarisme. Akun yang terbukti melakukan plagiarisme akan ditangguhkan secara permanen untuk melindungi integritas karya." 
        },
        {
          q: "Bagaimana cara mengikuti penulis lain?",
          a: "Kunjungi halaman profil seorang penulis, lalu klik tombol 'Mulai Ikuti'. Anda akan mendapatkan notifikasi setiap kali mereka menerbitkan karya baru, membantu Anda tetap terhubung dengan penulis favorit Anda."
        }
      ]
    }
  ];

  const features = [
      { icon: Maximize2, label: "Studio Fokus", desc: "Editor bebas distraksi untuk aliran kreativitas maksimal.", color: "text-indigo-500", bg: "bg-indigo-500/5" },
      { icon: ShieldCheck, label: "Hak Cipta Terlindungi", desc: "Anda memegang penuh hak atas karya yang Anda terbitkan.", color: "text-emerald-500", bg: "bg-emerald-500/5" },
      { icon: Share2, label: "Ekspor PDF Profesional", desc: "Bagikan naskah Anda dalam format PDF yang elegan.", color: "text-blue-500", bg: "bg-blue-500/5" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 pb-32 overflow-x-hidden">
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-6 px-4"
      >
        <div className="mx-auto relative mb-6">
            <div className="relative bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl text-primary w-fit mx-auto ring-1 ring-primary/10">
                <HelpCircle className="h-10 w-10 md:h-12 md:w-12" />
            </div>
        </div>
        <div className="space-y-3">
            <h1 className="text-3xl md:text-6xl font-headline font-black tracking-tight leading-tight">
                Pusat <span className="text-primary italic underline decoration-primary/20">Bantuan</span> Nusakarsa
            </h1>
            <p className="text-muted-foreground font-medium max-w-2xl mx-auto text-sm md:text-lg leading-relaxed px-2">
                Panduan lengkap untuk menavigasi ekosistem literasi digital modern—dari teks puitis hingga buku.
            </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 px-4">
        {features.map((item, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
            >
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm rounded-[1.5rem] p-4 md:p-6 flex flex-col items-center gap-3 group h-full">
                    <div className={cn("p-3 rounded-xl md:rounded-2xl", item.bg, item.color)}>
                        <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">{item.desc}</p>
                    </div>
                </Card>
            </motion.div>
        ))}
      </div>

      <section className="space-y-8 md:space-y-10">
        <div className="flex items-center gap-4 px-6">
            <h2 className="text-lg md:text-2xl font-headline font-black tracking-tight whitespace-nowrap">Tanya <span className="text-primary">Jawab</span></h2>
            <div className="h-px bg-border flex-1" />
        </div>

        <div className="grid gap-6 px-4">
            {sections.map((section, idx) => (
            <motion.div 
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
            >
                <Card className="border-none shadow-2xl overflow-hidden rounded-[2rem] bg-card/50 backdrop-blur-md border border-white/10">
                    <CardHeader className="p-5 md:p-8 bg-muted/20 border-b">
                        <div className="flex items-center gap-4 md:gap-5">
                            <div className={cn("p-3.5 md:p-4 rounded-[1.25rem] shadow-xl shrink-0", section.bg, section.color)}>
                                <section.icon className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                            <div>
                                <CardTitle className="font-headline text-lg md:text-2xl font-black">{section.title}</CardTitle>
                                <CardDescription className="font-medium text-[11px] md:text-sm mt-0.5">{section.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-10">
                        <Accordion type="single" collapsible className="w-full">
                            {section.content.map((item, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border-b-border/30 last:border-0">
                                    <AccordionTrigger className="text-left font-black text-sm md:text-lg hover:no-underline group py-4 px-2">
                                        <span className="group-hover:text-primary transition-colors flex items-center gap-2.5">
                                            <div className="h-1 w-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors shrink-0" />
                                            {item.q}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed text-[13px] md:text-base font-medium pt-2 pb-6 pl-5 border-l-2 border-primary/10 ml-2 italic">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </motion.div>
            ))}
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="px-4"
      >
        <Card className="bg-background border-2 border-primary/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-16 text-center space-y-8 md:space-y-10 overflow-hidden relative shadow-2xl">
            <div className="relative z-10 space-y-4">
                <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-4 md:mb-6">
                    <MessageCircle className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-headline text-2xl md:text-4xl font-black leading-tight">Masih Punya Pertanyaan?</h3>
                <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-lg font-medium px-2">Tim moderasi kami selalu siap sedia membantu perjalanan sastra Anda setiap harinya.</p>
            </div>

            <div className="relative z-10 flex justify-center items-center">
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 md:px-10 h-12 md:h-14 font-black text-[11px] md:text-sm uppercase tracking-widest border-2 hover:bg-primary/5 w-full sm:w-auto">
                    <Link href="/about"><Users className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Hubungi Tim</Link>
                </Button>
            </div>
        </Card>
      </motion.div>
    </div>
  );
}
