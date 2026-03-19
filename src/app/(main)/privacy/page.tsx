'use client';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { ShieldCheck, Database, User, Info, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PrivacyPolicyPage() {
  const policySections = [
    {
      title: "Informasi yang Kami Kumpulkan",
      icon: Database,
      items: [
        {
          heading: "Informasi Akun",
          text: "Saat Anda mendaftar, kami mengumpulkan informasi seperti nama, email, dan kata sandi Anda (yang di-hash)."
        },
        {
          heading: "Data Penggunaan",
          text: "Kami mengumpulkan informasi tentang bagaimana Anda menggunakan Aplikasi, seperti fitur yang Anda akses, konten yang Anda lihat, dan interaksi yang Anda lakukan."
        },
        {
          heading: "Informasi Perangkat",
          text: "Kami dapat mengumpulkan informasi dasar tentang perangkat yang Anda gunakan untuk mengakses Aplikasi (misalnya tipe browser) untuk optimasi."
        }
      ]
    },
    {
      title: "Bagaimana Kami Menggunakan Informasi Anda",
      icon: Info,
      items: [
        {
          heading: "Menyediakan & Memelihara Aplikasi",
          text: "Informasi Anda digunakan untuk mengoperasikan, memelihara, dan menyediakan fitur-fitur aplikasi kepada Anda."
        },
        {
          heading: "Memperbaiki & Personalisasi",
          text: "Kami menganalisis data penggunaan untuk memperbaiki bug, meningkatkan pengalaman, dan mempersonalisasi konten yang Anda lihat."
        },
        {
          heading: "Komunikasi Penting",
          text: "Kami dapat menggunakan email Anda untuk berkomunikasi tentang pembaruan penting, notifikasi keamanan, atau penawaran yang relevan."
        }
      ]
    },
    {
      title: "Berbagi & Keamanan Informasi",
      icon: Wifi,
      items: [
        {
          heading: "Pembagian Informasi",
          text: "Kami tidak akan pernah menjual atau membagikan informasi pribadi Anda kepada pihak ketiga tanpa persetujuan eksplisit dari Anda, kecuali diwajibkan oleh hukum."
        },
        {
          heading: "Keamanan Data",
          text: "Kami mengambil langkah-langkah keamanan standar industri, termasuk enkripsi dan aturan keamanan server yang ketat, untuk melindungi informasi Anda dari akses atau pengungkapan yang tidak sah."
        },
        {
          heading: "Perubahan Kebijakan",
          text: "Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan apa pun dengan memposting kebijakan baru di halaman ini dan mengirimkan notifikasi."
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 md:space-y-16 pb-32 overflow-x-hidden">
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-6 px-4"
      >
        <div className="mx-auto relative mb-6">
            <div className="relative bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl text-primary w-fit mx-auto ring-1 ring-primary/10">
                <ShieldCheck className="h-10 w-10 md:h-12 md:w-12" />
            </div>
        </div>
        <div className="space-y-3">
            <h1 className="text-3xl md:text-6xl font-headline font-black tracking-tight leading-tight">
                Kebijakan <span className="text-primary italic underline decoration-primary/20">Privasi</span> Nusakarsa
            </h1>
            <p className="text-muted-foreground font-medium max-w-2xl mx-auto text-sm md:text-lg leading-relaxed px-2">
                Privasi Anda adalah prioritas kami. Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.
            </p>
            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider">Terakhir diperbarui: 1 Agustus 2024</p>
        </div>
      </motion.section>

      <div className="space-y-10 px-4">
        {policySections.map((section, idx) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.15 }}
          >
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-6 md:p-8 bg-muted/20 border-b">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-md text-primary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-headline font-bold text-lg md:text-xl tracking-tight">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 grid gap-6">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm md:text-base text-foreground/90">{item.heading}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">{item.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
