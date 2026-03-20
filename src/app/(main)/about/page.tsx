'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/Logo';
import { 
  Globe, 
  PenTool, 
  Cpu, 
  Lightbulb, 
  Mail,
  MapPin,
  Phone,
  Instagram, 
  Twitter, 
  Github, 
  ChevronRight, 
  Quote,
  Rocket,
  Heart,
  Brain,
  Users,
  Shield,
  Send
} from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const technologies = [
    { title: "Next.js", desc: "Kerangka kerja React yang memberikan fondasi kuat untuk aplikasi web modern dengan rendering sisi server.", icon: "https://avatars.githubusercontent.com/u/126103961?s=200&v=4" },
    { title: "React", desc: "Pustaka JavaScript untuk membangun antarmuka pengguna yang interaktif dengan arsitektur berbasis komponen.", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcR5U16C8yXgBpl7-Bc7Itjx3_LRl425zINA&s" },
    { title: "TypeScript", desc: "Bahasa pemrograman dengan sistem tipe yang kuat untuk kode yang lebih aman, cepat, dan terstruktur.", icon: "https://svgl.app/library/typescript.svg" },
    { title: "Firebase", desc: "Infrastruktur Cloud Google yang menjamin keamanan data dan sinkronisasi real-time mahakarya.", icon: "https://svgl.app/library/firebase.svg" },
    { title: "Tailwind CSS", desc: "Sistem desain modern untuk antarmuka yang presisi, elegan, dan sepenuhnya responsif.", icon: "https://svgl.app/library/tailwindcss.svg" }
];

const values = [
  {
    icon: Brain,
    title: "Inovasi Tanpa Henti",
    desc: "Kami terus mendorong batas kreativitas dengan teknologi terbaru untuk pengalaman sastra yang tak terlupakan."
  },
  {
    icon: Heart,
    title: "Cinta pada Cerita",
    desc: "Setiap fitur dirancang dengan hasrat untuk menghormati seni bercerita dan menghargai setiap kata."
  },
  {
    icon: Shield,
    title: "Aman & Terpercaya",
    desc: "Data dan karya Anda dilindungi dengan standar keamanan tertinggi, memberikan ketenangan dalam berkarya."
  },
  {
    icon: Users,
    title: "Komunitas Berkembang",
    desc: "Lebih dari sekadar platform, kami adalah rumah bagi para kreator dan pembaca untuk tumbuh bersama."
  }
];

// Variants untuk animasi section
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);
  const { toast } = useToast();

  // Refs untuk mendeteksi apakah section dalam view
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Pesan terkirim",
        description: "Terima kasih telah menghubungi kami. Kami akan segera merespons.",
      });
      setFormData({ name: '', email: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  const initialArchitects = [
    {
        name: "Khalid Ar-Rahman",
        role: "Security",
        handle: "khalid_ar",
        avatar: "/tim/khalid.png",
        avatarHint: "man portrait",
        quote: "Membangun fondasi digital yang kokoh untuk masa depan literasi.",
    },
    {
        name: "Guntur Padilah",
        role: "Lead Full-stack & Idea",
        handle: "gunturpadilah",
        avatar: "/tim/guntur.jpeg",
        avatarHint: "male developer",
        quote: "Setiap baris kode adalah sebuah puisi yang menunggu untuk dibaca.",
    },
    {
        name: "Nursyifa Aeni",
        role: "Frontend Developer",
        handle: "syifa_aeni",
        avatar: "/tim/syifa.jpeg",
        avatarHint: "woman creative",
        quote: "Desain adalah jembatan sunyi antara imajinasi dan realitas.",
    }
  ];

  return (
    <div className="relative overflow-x-hidden w-full">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-background via-background to-background" />
      
      <div className="max-w-7xl mx-auto space-y-32 md:space-y-40 pb-32 relative px-4 sm:px-6 lg:px-8">
        {/* Hero Section dengan Video Background */}
        <motion.section 
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={isHeroInView ? { opacity: 1 } : {}}
          transition={{ duration: 1 }}
          className="relative min-h-[80vh] flex items-center justify-center text-center pt-20 overflow-hidden rounded-b-[3rem] md:rounded-b-[4rem]"
        >
          {/* Video Background dengan efek zoom pelan saat scroll */}
          <motion.div 
            style={{ scale: useTransform(scrollYProgress, [0, 1], [1, 1.2]) }}
            className="absolute inset-0 w-full h-full z-0"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/bg-video/bg.mp4" type="video/mp4" />
            </video>
          </motion.div>
          
          {/* Overlay gelap dengan gradien animasi */}
          <motion.div 
            animate={{ opacity: [0.3, 0.4, 0.3] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute inset-0 bg-black/40 z-10" 
          />

          {/* Konten Hero dengan animasi teks */}
          <div className="relative z-20 max-w-5xl mx-auto space-y-8 text-white">
            <motion.h1 
              initial={{ y: 50, opacity: 0 }}
              animate={isHeroInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl lg:text-8xl font-headline font-black text-white leading-[1.1] tracking-tight"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Menghidupkan Jiwa
              </motion.span>
              <br />
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="relative inline-block"
              >
                <span className="text-white italic">
                  Lewat Teknologi.
                </span>
                <motion.span 
                  initial={{ width: 0 }}
                  animate={isHeroInView ? { width: '100%' } : {}}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 h-1 bg-white/30 rounded-full"
                />
              </motion.span>
            </motion.h1>

            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={isHeroInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg md:text-2xl text-white/80 leading-relaxed font-light max-w-3xl mx-auto"
            >
              "Nusakarsa bukan sekadar platform, ia adalah rumah bagi imajinasi murni 
              di mana setiap karsa tumbuh menjadi mahakarya abadi."
            </motion.p>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={isHeroInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-wrap gap-4 justify-center pt-8"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="rounded-full h-14 px-10 text-base font-medium bg-white text-foreground hover:bg-white/90 shadow-lg">
                  Mulai Menulis <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator dengan animasi */}
          <motion.div 
            style={{ opacity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center">
              <motion.div 
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.section>

        {/* Fondasi Platform */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-12"
        >
          <div className="flex items-center gap-4">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3 whitespace-nowrap"
            >
              <Globe className="h-4 w-4 text-primary/60" /> Fondasi Platform
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
              className="h-px bg-border/50 flex-1 origin-left" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
                { icon: Cpu, title: "Teknologi Terdepan", desc: "Menggunakan infrastruktur cloud modern untuk memastikan setiap detik pengalaman sastra Anda terasa magis dan aman." },
                { icon: Lightbulb, title: "Inspirasi Tanpa Batas", desc: "Kami membangun antarmuka yang bebas gangguan agar kreativitas Anda dapat mengalir dengan murni dari hati." }
            ].map((item, i) => (
                <motion.div 
                  key={i} 
                  variants={cardVariants}
                  whileHover={{ 
                    scale: 1.02,
                    rotateX: 2,
                    rotateY: 2,
                    boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)"
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group perspective"
                >
                  <Card className="border-none bg-card/30 backdrop-blur-sm rounded-[3rem] overflow-hidden h-full shadow-lg hover:shadow-xl transition-all transform-gpu">
                    <CardContent className="p-10 text-center space-y-6">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="p-4 rounded-2xl bg-primary/5 text-primary/80 w-fit mx-auto"
                      >
                        <item.icon className="h-10 w-10" />
                      </motion.div>
                      <h3 className="text-2xl font-medium">{item.title}</h3>
                      <p className="text-muted-foreground/70 leading-relaxed text-sm">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Nilai-nilai Inti */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-12"
        >
          <div className="flex items-center gap-4">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3 whitespace-nowrap"
            >
              <Heart className="h-4 w-4 text-primary/60" /> Nilai-nilai Inti
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
              className="h-px bg-border/50 flex-1 origin-left" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div 
                key={i} 
                variants={cardVariants}
                whileHover={{ 
                  y: -5,
                  rotateX: 5,
                  rotateY: 5,
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                }}
                transition={{ type: "spring", stiffness: 400 }}
                className="group perspective"
              >
                <Card className="border-none bg-card/30 backdrop-blur-sm rounded-[2rem] h-full hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg transform-gpu">
                  <CardContent className="p-8 text-center space-y-4">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="p-3 rounded-2xl bg-primary/5 text-primary/80 w-fit mx-auto"
                    >
                      <value.icon className="h-6 w-6" />
                    </motion.div>
                    <h4 className="text-lg font-medium">{value.title}</h4>
                    <p className="text-sm text-muted-foreground/70 leading-relaxed">{value.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tim Arsitek */}
        <section className="space-y-20">
          <div className="flex items-center gap-4">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3 whitespace-nowrap"
            >
              <PenTool className="h-4 w-4 text-primary/60" /> Tim Arsitek
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
              className="h-px bg-border/50 flex-1 origin-left" 
            />
          </div>
          
          <div className="space-y-32">
            {initialArchitects.map((dev, i) => (
              <motion.div
                key={dev.handle}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="grid md:grid-cols-2 items-center gap-12 md:gap-20"
              >
                {/* Image Column with 3D tilt effect */}
                <motion.div 
                  className={cn("relative group perspective", i % 2 !== 0 && "md:order-last")}
                  whileHover={{ rotateY: i % 2 === 0 ? 5 : -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative overflow-hidden rounded-[2.5rem] shadow-xl transform-gpu">
                    <Image 
                      src={dev.avatar} 
                      alt={dev.name} 
                      data-ai-hint={dev.avatarHint}
                      width={800}
                      height={800}
                      className="w-full h-auto object-cover aspect-square transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </motion.div>

                {/* Text Column */}
                <motion.div 
                  className="space-y-8"
                  initial={{ opacity: 0, x: i % 2 === 0 ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <Logo className="h-12 w-12 opacity-30" />
                  <div className="relative">
                    <Quote className="h-20 w-20 text-primary/5 absolute -top-8 -left-6" fill="currentColor" strokeWidth={0} />
                    <motion.p 
                      whileHover={{ scale: 1.02 }}
                      className="relative text-2xl lg:text-3xl font-light italic text-foreground/70 leading-relaxed"
                    >
                      "{dev.quote}"
                    </motion.p>
                  </div>
                  <div className="pt-6 border-t border-border/30">
                    <h4 className="font-headline text-3xl font-medium text-foreground">{dev.name}</h4>
                    <p className="text-sm uppercase tracking-widest text-primary/70 mt-2">{dev.role}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-16"
        >
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-headline font-medium tracking-tight"
            >
              Kekuatan di Balik <span className="italic underline decoration-primary/10">Sistem.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-muted-foreground/70 text-lg md:text-xl leading-relaxed font-light"
            >
              Nusakarsa dibangun dengan tumpukan teknologi modern untuk memastikan setiap detik pengalaman sastra Anda terasa magis, cepat, dan aman.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {technologies.map((tech, i) => (
              <motion.div 
                key={i} 
                variants={cardVariants}
                whileHover={{ 
                  y: -5,
                  rotateX: 3,
                  rotateY: 3,
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                }}
                transition={{ type: "spring", stiffness: 400 }}
                className="group perspective"
              >
                <Card className="border-none bg-card/20 backdrop-blur-sm rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg transform-gpu">
                  <CardContent className="p-8 text-center space-y-5">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="relative h-16 w-16 mx-auto opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <Image 
                        src={tech.icon} 
                        alt={tech.title} 
                        fill 
                        className="object-contain" 
                      />
                    </motion.div>
                    <h4 className="font-medium text-lg">{tech.title}</h4>
                    <p className="text-sm text-muted-foreground/70 leading-relaxed">{tech.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-8 py-16"
        >
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
            <Logo className="relative h-20 w-20 mx-auto text-primary/70" />
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-headline font-medium max-w-2xl mx-auto"
          >
            Siap menjadi bagian dari perjalanan ini?
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground/70 text-lg max-w-xl mx-auto font-light"
          >
            Bergabunglah dengan ribuan kreator dan pembaca yang telah menemukan rumah baru mereka.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center pt-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="rounded-full h-14 px-12 text-base font-medium shadow-lg bg-primary/90 hover:bg-primary">
                Mulai Sekarang <Rocket className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-12 text-base font-medium border-muted-foreground/20 hover:bg-muted/10">
                Hubungi Kami
              </Button>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-16 pt-16 border-t border-border/30"
        >
          <div className="text-center space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-headline font-medium"
            >
              Hubungi <span className="italic underline decoration-primary/10">Kami</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground/70 max-w-2xl mx-auto"
            >
              Punya pertanyaan atau ingin bekerja sama? Silakan hubungi kami melalui formulir di bawah atau langsung melalui kontak yang tersedia.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Info Kontak */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                {[
                  { icon: Mail, title: "Email", content: ["admin@himmel.web.id", "support@nusakarsa.id"] },
                  { icon: MapPin, title: "Alamat", content: ["Pelabuhan Ratu", "Sukabumi, jawa Barat, Indonesia"] },
                  { icon: Phone, title: "Telepon", content: ["+62 56-5554-8656", "Senin - Jumat, 09.00 - 17.00"] }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ x: 5 }}
                    className="flex items-start gap-4"
                  >
                    <div className="p-3 rounded-xl bg-primary/5 text-primary/80">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{item.title}</h4>
                      {item.content.map((line, i) => (
                        <p key={i} className="text-muted-foreground/70">{line}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Social Media */}
              <div className="pt-6">
                <h4 className="font-medium text-lg mb-4">Ikuti Kami</h4>
                <div className="flex gap-4">
                  {[Instagram, Twitter, Github].map((Icon, idx) => (
                    <motion.a
                      key={idx}
                      href="#"
                      whileHover={{ y: -3, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-primary/5 text-primary/80 hover:bg-primary/10 transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form Kontak */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-none bg-card/30 backdrop-blur-sm rounded-[2rem] shadow-lg">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {['name', 'email', 'message'].map((field, idx) => (
                      <motion.div 
                        key={field}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-2"
                      >
                        <label htmlFor={field} className="text-sm font-medium">
                          {field === 'name' ? 'Nama Lengkap' : field === 'email' ? 'Email' : 'Pesan'}
                        </label>
                        {field === 'message' ? (
                          <Textarea
                            id={field}
                            placeholder="Tulis pesan Anda di sini..."
                            rows={5}
                            value={formData[field as keyof typeof formData]}
                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                            required
                            className="bg-background/50 border-muted-foreground/20 focus:border-primary/30 rounded-xl resize-none transition-all focus:scale-[1.02]"
                          />
                        ) : (
                          <Input
                            id={field}
                            type={field === 'email' ? 'email' : 'text'}
                            placeholder={field === 'name' ? 'Nama Anda' : 'contoh@gmail.com'}
                            value={formData[field as keyof typeof formData]}
                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                            required
                            className="bg-background/50 border-muted-foreground/20 focus:border-primary/30 rounded-xl transition-all focus:scale-[1.02]"
                          />
                        )}
                      </motion.div>
                    ))}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full rounded-full h-12 font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Send className="h-5 w-5" />
                          </motion.div>
                        ) : (
                          <>Kirim Pesan <Send className="ml-2 h-4 w-4" /></>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
