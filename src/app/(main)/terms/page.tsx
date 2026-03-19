'use client';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { FileText, User, Upload, Ban, Copyright, Scale, Info, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "Akun Pengguna & Tanggung Jawab",
      icon: User,
      items: [
        { heading: "Pendaftaran Akun", text: "Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda, termasuk kata sandi. Anda setuju untuk bertanggung jawab penuh atas semua aktivitas yang terjadi di bawah akun Anda." },
        { heading: "Konten Pengguna", text: "Anda mempertahankan hak cipta atas semua karya (teks, gambar, dll.) yang Anda unggah ke Nusakarsa. Namun, dengan mengunggahnya, Anda memberikan Nusakarsa lisensi non-eksklusif, bebas royalti, di seluruh dunia untuk menampilkan, mendistribusikan, dan mempromosikan karya Anda di dalam platform." },
        { heading: "Perilaku yang Dilarang", text: "Anda dilarang mengunggah konten yang ilegal, melanggar hak cipta, mengandung ujaran kebencian, bersifat pornografi, atau melakukan spamming. Nusakarsa berhak menghapus konten atau menangguhkan akun yang melanggar ketentuan ini." }
      ]
    },
    {
      title: "Hak Kekayaan Intelektual",
      icon: Copyright,
      items: [
        { heading: "Platform Nusakarsa", text: "Semua aspek platform Nusakarsa, termasuk logo, desain, kode, dan fitur adalah milik Nusakarsa dan dilindungi oleh hukum hak cipta. Anda tidak diizinkan untuk menyalin, memodifikasi, atau mendistribusikan ulang bagian mana pun dari platform tanpa izin tertulis." },
        { heading: "Penghapusan Konten", text: "Kami menghormati hak cipta. Jika Anda yakin karya Anda telah disalin dengan cara yang merupakan pelanggaran hak cipta, silakan hubungi kami dengan bukti kepemilikan." }
      ]
    },
    {
      title: "Batasan & Penghentian",
      icon: Ban,
      items: [
        { heading: "Batasan Tanggung Jawab", text: "Nusakarsa disediakan 'sebagaimana adanya'. Kami tidak memberikan jaminan bahwa platform akan selalu bebas dari kesalahan. Kami tidak bertanggung jawab atas kerugian tidak langsung yang mungkin timbul dari penggunaan platform kami." },
        { heading: "Penghentian Akun", text: "Kami berhak menangguhkan atau menghentikan akun Anda kapan saja, dengan atau tanpa alasan, terutama jika terjadi pelanggaran terhadap Ketentuan Layanan ini." },
        { heading: "Perubahan Layanan", text: "Kami dapat mengubah atau menghentikan bagian mana pun dari layanan kami kapan saja. Kami akan berusaha memberikan pemberitahuan yang wajar tentang perubahan signifikan." }
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
                <FileText className="h-10 w-10 md:h-12 md:w-12" />
            </div>
        </div>
        <div className="space-y-3">
            <h1 className="text-3xl md:text-6xl font-headline font-black tracking-tight leading-tight">
                Ketentuan <span className="text-primary italic underline decoration-primary/20">Layanan</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-2xl mx-auto text-sm md:text-lg leading-relaxed px-2">
                Dengan menggunakan platform Nusakarsa, Anda setuju untuk mematuhi aturan dan pedoman yang berlaku untuk menjaga ekosistem kreatif yang sehat dan aman.
            </p>
            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider">Terakhir diperbarui: 1 Agustus 2024</p>
        </div>
      </motion.section>

      <div className="space-y-10 px-4">
        {sections.map((section, idx) => (
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
