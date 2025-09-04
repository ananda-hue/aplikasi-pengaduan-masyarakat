import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link, useNavigate } from 'react-router-dom';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import api from '../api';
import Aos from 'aos';
import 'aos/dist/aos.css';
import alurVideo from '../assets/alur3.mp4';
import FormPengaduan from "./FormPengaduan";

import PengaduanHome from './pengaduanhome';
import heroImage1 from '../assets/bg1.webp';
import heroImage2 from '../assets/bg3.webp';
import heroImage3 from '../assets/bg2.webp';

const AnimatedCard = ({ children, direction = 'up', delay = 0 }) => {
  const { ref, inView } = useInView({ triggerOnce: false, threshold: 0.3 });

  const variants = {
    hidden: {
      opacity: 0,
      x: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
      y: direction === 'up' ? -50 : direction === 'down' ? 50 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut', delay },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
};

const FadeSection = ({ children }) => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
};

// Fitur data
const fitur = [
  {
    title: "Pengaduan",
    desc: "Sampaikan keluhan Anda terkait pelayanan publik yang tidak memuaskan atau tindakan aparatur yang tidak sesuai.",
    icon: "📢",
    color: "from-[#720038] to-[#9b0040]",
    no: "01",
  },
  {
    title: "Aspirasi",
    desc: "Berikan saran, ide, atau masukan untuk peningkatan kualitas layanan pemerintah.",
    icon: "💡",
    color: "from-[#003366] to-[#005f99]",
    no: "02",
  },
  {
    title: "Laporan Anonim",
    desc: "Laporkan permasalahan tanpa mengungkapkan identitas Anda. Kerahasiaan Anda terjamin.",
    icon: "🙈",
    color: "from-[#800000] to-[#A00000]",
    no: "03",
  },
  {
    title: "Tracking ID",
    desc: "Gunakan ID unik ini untuk melacak status pengaduan Anda.",
    icon: "🔍",
    color: "from-[#F97D48] to-[#FFB74D]",
    no: "04",
  },
];

function Home() {
  const isLoggedIn = sessionStorage.getItem('loggedIn');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trackingId, setTrackingId] = useState('');
  const [totalReports, setTotalReports] = useState(0);
  const navigate = useNavigate();

  // gabungan video + foto
  const heroSlides = [
    { type: 'image', src: heroImage1 },
    { type: 'image', src: heroImage2 },
    { type: 'image', src: heroImage3 },
  ];

  useEffect(() => {
    let interval;
    const currentSlide = heroSlides[currentIndex];

    if (currentSlide && currentSlide.type === 'image') {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % heroSlides.length);
      }, 5000);
    }

    Aos.init({ duration: 800 });

    return () => clearInterval(interval);
  }, [currentIndex, heroSlides.length]);

  const handleTrack = async () => {
    if (!trackingId) return;

    try {
      const token = sessionStorage.getItem('token');
      const res = await api.get(`/reports/search?tracking_id=${trackingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const report = res.data.data;
      navigate(`/detail/${report.ID || report.id}`, {
        state: {
          from: '/home',
          fromName: 'Home',
        },
      });
    } catch (err) {
      alert('Tracking ID tidak ditemukan atau terjadi kesalahan.');
    }
  };

  useEffect(() => {
    const fetchTotalReports = async () => {
      try {
        const res = await fetch("http://localhost:8080/reports/total", {
          headers: {
            "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
          }
        });
        const data = await res.json();
        setTotalReports(data.total_reports);
      } catch (error) {
        console.error("Gagal ambil total reports", error);
      }
    };

    fetchTotalReports();
  }, []);

  return (
    <div className="font-['Work_Sans']">
      {/* Hero Section */}
      <div className="relative h-[650px] w-screen -mt-9 lg:-mt-1 ml-[-50vw] left-1/2">
        {heroSlides[currentIndex]?.type === 'video' ? (
          <video
            key={currentIndex}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            controls={false}
            onEnded={() =>
              setCurrentIndex((prev) => (prev + 1) % heroSlides.length)
            }
            onLoadedMetadata={(e) => {
              console.log(
                "Resolusi video:",
                e.target.videoWidth + "x" + e.target.videoHeight
              );
            }}
          >
            <source src={heroSlides[currentIndex]?.src} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroSlides[currentIndex]?.src || ""})` }}
          ></div>
        )}
        {/* Overlay gelap */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Konten teks */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center px-4">
          <AnimatedCard direction="left">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-wide space-y-1">
              <span className="block whitespace-nowrap font-['Engagement'] text-4xl md:text-6xl drop-shadow-[2px_2px_2px_rgba(0,0,0,0.6)]">
                Website
              </span>
              <span className="block whitespace-nowrap font-['Poppins'] text-2xl md:text-4xl drop-shadow-[2px_2px_2px_rgba(0,0,0,0.6)]">
                Pengaduan Masyarakat
              </span>
              <span className="block whitespace-nowrap font-['Engagement'] text-4xl md:text-6xl drop-shadow-[2px_2px_2px_rgba(0,0,0,0.6)]">
                Yogyakarta
              </span>
            </h1>
          </AnimatedCard>

          <AnimatedCard direction="right" delay={0.3}>
            <p className="mt-4 text-sm md:text-base max-w-xl mx-auto">
              "Mari suarakan keluhan Anda agar pemerintah Jogja dapat berbenah
              dan meningkatkan pelayanan demi kota yang lebih baik dan nyaman
              untuk semua."
            </p>
          </AnimatedCard>
        </div>

        {/* Wave bawah */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-16"
          >
            <path
              d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
              fill="#f4f6f9ff"
            />
          </svg>
        </div>
      </div>


      {/* 4 Service Features Section - Zoom effect on hover */}
      <FadeSection>
        <section className="relative z-10 -mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Kemudahan Akses */}
              <div className="relative bg-red-700 text-white p-6 md:p-8 flex flex-col items-center justify-center text-center h-56 
        rounded-xl shadow-lg overflow-hidden 
        transition-all duration-300 hover:scale-105 hover:shadow-2xl">

                <div className="absolute top-0 left-0 w-full">
                  <svg
                    className="w-full h-16"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 320"
                    preserveAspectRatio="none"
                  >
                    <path
                      fill="#e5e7eb" // gray-200
                      d="M0,96 C 360,240 1080,-120 1440,96 L1440,0 L0,0 Z"
                    />
                  </svg>
                </div>

                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 relative z-10">
                  Kemudahan Akses
                </h3>
                <p className="text-xs md:text-sm text-gray-100 relative z-10">
                  Masyarakat dapat menyampaikan keluhan atau aspirasi kapan saja dan di mana saja secara digital.
                </p>
              </div>

              {/* Card 2: Transparansi */}
              <AnimatedCard direction="up" delay={0.2}>
                <div className="relative bg-red-700 text-white p-6 md:p-8 flex flex-col items-center justify-center text-center h-56 
          rounded-xl shadow-lg overflow-hidden 
          transition-all duration-300 hover:scale-105 hover:shadow-2xl">

                  <div className="absolute top-0 left-0 w-full">
                    <svg
                      className="w-full h-16"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1440 320"
                      preserveAspectRatio="none"
                    >
                      <path
                        fill="#e5e7eb" // gray-200
                        d="M0,96 C 360,240 1080,-120 1440,96 L1440,0 L0,0 Z"
                      />
                    </svg>
                  </div>

                  <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 relative z-10">
                    Transparansi
                  </h3>
                  <p className="text-xs md:text-sm text-gray-100 relative z-10">
                    Meningkatkan transparansi dan akuntabilitas dalam penanganan pengaduan publik oleh pemerintah daerah.
                  </p>
                </div>
              </AnimatedCard>

              {/* Card 3: Respon Cepat */}
              <AnimatedCard direction="up" delay={0.3}>
                <div className="relative bg-red-700 text-white p-6 md:p-8 flex flex-col items-center justify-center text-center h-56 
          rounded-xl shadow-lg overflow-hidden 
          transition-all duration-300 hover:scale-105 hover:shadow-2xl">

                  {/* Wave abu di atas */}
                  <div className="absolute top-0 left-0 w-full">
                    <svg
                      className="w-full h-16"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1440 320"
                      preserveAspectRatio="none"
                    >
                      <path
                        fill="#e5e7eb" // gray-200
                        d="M0,96 C 360,240 1080,-120 1440,96 L1440,0 L0,0 Z"
                      />
                    </svg>
                  </div>

                  <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 relative z-10">
                    Respon Cepat
                  </h3>
                  <p className="text-xs md:text-sm text-gray-100 relative z-10">
                    Memberikan tanggapan dan penyelesaian terhadap aduan dengan lebih cepat dan efisien.
                  </p>
                </div>
              </AnimatedCard>

              {/* Card 4: Partisipasi Masyarakat */}
              <AnimatedCard direction="up" delay={0.4}>
                <div className="relative bg-red-700 text-white p-6 md:p-8 flex flex-col items-center justify-center text-center h-56 
          rounded-xl shadow-lg overflow-hidden 
          transition-all duration-300 hover:scale-105 hover:shadow-2xl">

                  {/* Wave abu di atas */}
                  <div className="absolute top-0 left-0 w-full">
                    <svg
                      className="w-full h-16"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1440 320"
                      preserveAspectRatio="none"
                    >
                      <path
                        fill="#e5e7eb" // gray-200
                        d="M0,96 C 360,240 1080,-120 1440,96 L1440,0 L0,0 Z"
                      />
                    </svg>
                  </div>

                  <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0zM21 13a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 relative z-10">
                    Partisipasi Masyarakat
                  </h3>
                  <p className="text-xs md:text-sm text-gray-100 relative z-10">
                    Mendorong keterlibatan aktif masyarakat dalam perbaikan layanan dan pengawasan publik.
                  </p>
                </div>
              </AnimatedCard>

            </div>
          </div>
        </section>
      </FadeSection>


      {/* Form Pengaduan ditampilkan di Home */}
      <section >
        <FormPengaduan />
      </section>

      {/* Tracking ID & Total Aduan Section */}
      <FadeSection>
        <section className="py-10 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-2xl font-bold text-black mb-2">Lacak Aduan Anda</h2>
              <p className="text-base text-gray-600">
                Lihat status aduan Anda dan statistik keseluruhan.
              </p>
            </div>

            {/* Flex container for the two cards */}
            <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch">
              {/* Card Lacak Aduan */}
              <div className="relative max-w-xl w-full lg:w-1/2 bg-red-700 p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold mb-3 text-center sm:text-left text-white">
                  Lacak Aduan
                </h3>
                <p className="text-base mb-6 text-center sm:text-left text-white">
                  Masukkan ID aduan untuk melihat informasi lengkap.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Masukkan ID Aduan..."
                    className="flex-grow px-5 py-3 rounded border border-gray-300 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    onClick={handleTrack}
                    className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-600 transition-colors duration-300 text-black px-6 py-3 rounded font-semibold text-base"
                  >
                    Lacak
                  </button>
                </div>
              </div>

              {/* Card Total Aduan (Tampilan Menarik) */}
              <div className="relative max-w-xl w-full lg:w-1/2 bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col justify-between items-center text-center">
                <h3 className="text-2xl font-bold text-black mb-2">Total Aduan</h3>
                <div className="flex flex-col items-center">
                  <p className="text-7xl font-extrabold text-red-800 drop-shadow-lg">
                    {totalReports}
                  </p>
                  <p className="text-lg text-gray-500 mt-2">Aduan Telah Terkirim</p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </FadeSection>


      {/* Fitur Cards */}
      <FadeSection>
        <section className="relative bg-gray-50 py-20 px-6 overflow-hidden">
          {/* Wave top */}
          <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-0">
          </div>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-2xl font-bold text-gray-900 mb-4">
              Fitur Layanan Pengaduan Masyarakat
            </h2>
            <p className="text-sm sm:text-base text-gray-700">
              Sampaikan pendapat, saran, dan keluhan Anda melalui platform ini. Pemerintah siap mendengarkan Anda.
            </p>
          </div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl">
              {fitur.map((item, index) => (
                <div
                  key={index}
                  className={`relative bg-gradient-to-b ${item.color} text-white pt-14 pb-6 px-4 shadow-lg min-h-[260px] flex flex-col items-center text-center hover:scale-[1.03] transition-transform duration-300 ease-out`}
                >
                  <div className="absolute -top-6 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md text-2xl left-1/2 transform -translate-x-1/2">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 mt-2">{item.title}</h3>
                  <p className="text-sm px-1">{item.desc}</p>
                  <div className="absolute bottom-0 left-0 w-full h-6 bg-white clip-triangle"></div>
                  <div className="absolute bottom-3 right-4 text-white/60 text-sm font-bold">{item.no}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </FadeSection>

      {/* 2. SECTION "Alur Pengaduan Masyarakat" */}
      <FadeSection>
        <section className="py-10 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 w-full flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-6 text-black">Alur Pengaduan Masyarakat</h3>
              <video
                src={alurVideo}
                alt="Alur Pengaduan Masyarakat"
                className="max-w-xl w-full object-contain"
                style={{ height: '480px' }}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </section>
      </FadeSection>


      {/* Wave Background Merah */}
      <div className="w-full relative z-0 -mt-6">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-[110px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#ba1919ff"
            d="
            M0,64
            C60,100,120,140,180,160
            C240,180,300,180,360,160
            C420,140,480,100,540,90
            C600,80,660,100,720,120
            C780,140,840,160,900,150
            C960,140,1020,100,1080,90
            C1140,80,1200,100,1260,120
            C1320,140,1380,160,1440,150
            L1440,320L0,320Z"
          />
        </svg>
      </div>

      {/* Data dari Backend */}
      <PengaduanHome />

    </div>

  );
}

export default Home;