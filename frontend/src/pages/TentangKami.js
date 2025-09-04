import React from 'react';
import { motion } from 'framer-motion';
import heroImage from '../assets/filosofi1.jpg';

export const TentangKami = () => {
  return (
    <div className="bg-white font-['Work_Sans'] text-gray-700 pt-24 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-8">

        {/* Kiri: Teks dengan animasi */}
        <motion.div
          className="w-full lg:w-1/2"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl sm:leading-none mb-4">
            Lapor Pak!
            <br className="hidden md:block" />
            Mewujudkan Pemerintahan{' '}
            <span className="inline-block text-red-600">yang Responsif</span>
          </h2>
          <p className="text-base text-gray-700 md:text-lg mb-6">
            Lapor Pak! melanjutkan tradisi Yogyakarta dalam mendengarkan suara masyarakat, seperti gamelan yang harmonis. Dari UPIK 2003 hingga e-Lapor 2018, komunikasi antara warga dan pemerintah semakin mudah dan transparan.
          </p>

          <div id="filosofi">
            <p className="text-base text-gray-700 md:text-lg">
              Kini, Lapor Pak! adalah platform resmi pengaduan digital yang memungkinkan warga menyampaikan keluhan dan aspirasi secara real-time. Dengan sistem terintegrasi, setiap suara pasti didengar dan ditindaklanjuti secara akuntabel.

              Filosofi kami adalah mendengar dan bertindak bersama rakyat, menjaga harmoni perubahan demi Yogyakarta yang lebih baik.
            </p>
          </div>
        </motion.div>

        {/* Kanan: Gambar dengan animasi */}
        <motion.div
          className="w-full lg:w-1/2"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <img
            src={heroImage}
            alt="Hero"
            className="w-full max-h-[400px] object-cover rounded shadow"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default TentangKami;
