import React, { useState, useRef, useEffect } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { FaArrowLeft } from 'react-icons/fa';

const bantuanItems = [
  {
    id: 1,
    title: 'Panduan Penggunaan Website',
    content:
      'Website ini memudahkan Anda membuat pengaduan, aspirasi, dan permintaan informasi terkait pelayanan publik. Pastikan mengisi formulir pengaduan dengan lengkap dan mengunggah bukti pendukung.',
  },
  {
    id: 2,
    title: 'Cara Mengajukan Pengaduan',
    content:
      'Login ke akun, pilih menu "Buat Pengaduan", isi data lengkap dan jelas, upload bukti, kirim dan simpan nomor pelacakan untuk memantau status.',
  },
  {
    id: 3,
    title: 'Cara Melacak Pengaduan',
    content:
      'Gunakan nomor pelacakan khusus untuk memantau perkembangan laporan Anda.',
  },
  {
    id: 4,
    title: 'Kontak Bantuan',
    content:
      'Hubungi WhatsApp atau telepon yang tersedia jika butuh bantuan.',
  },
  {
    id: 5,
    title: 'Kebijakan Privasi dan Keamanan',
    content:
      'Data dan identitas Anda dijaga kerahasiaannya sesuai peraturan yang berlaku.',
  },
  {
    id: 6,
    title: 'Tips Pengaduan Efektif',
    content:
      'Jelaskan masalah singkat dan jelas, sertakan bukti kuat, pastikan kontak valid untuk komunikasi tindak lanjut.',
  },
];

export default function BantuanPage() {
  const [activeId, setActiveId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleItem = (id) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 font-['Work_Sans'] py-2 px-4 md:py-8 md:px-6"
      ref={dropdownRef}
    >
      {/* Header */}
      <div className="max-w-9xl mx-auto mb-6 md:mb-8 flex flex-col items-center">
        <div className="w-full">
          <button
            onClick={() => window.history.back()}
            className="bg-white text-black p-3 rounded-full shadow-lg
                     hover:bg-gray-50 hover:text-red-600 transition-all duration-200
                     border border-gray-200"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-black mt-3 md:mt-4 text-center">
          Bantuan
        </h1>
      </div>


      {/* Daftar Bantuan */}
      <div className="max-w-6xl mx-auto space-y-3 md:space-y-4 text-sm md:text-base">
        {bantuanItems.map(({ id, title, content }) => (
          <div key={id} className="bg-white border border-gray-300 rounded-lg shadow">
            <button
              onClick={() => toggleItem(id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left  font-semibold focus:outline-none text-sm md:text-base"
              aria-expanded={activeId === id}
              aria-controls={`content-${id}`}
            >
              <span>{title}</span>
              {activeId === id ? <FaChevronDown /> : <FaChevronRight />}
            </button>
            {activeId === id && (
              <div
                id={`content-${id}`}
                className="px-4 py-3 border-t text-gray-700 bg-gray-50 transition-all duration-300 text-sm md:text-base"
              >
                {content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hubungi Kami */}
      <div className="max-w-6xl mx-auto mt-10 md:mt-12 bg-white p-4 md:p-6 border border-gray-300 rounded-lg shadow text-sm md:text-base">
        <h4 className="text-lg md:text-xl font-bold  mb-3 md:mb-4">
          Hubungi Kami
        </h4>
        <p className="mb-1 md:mb-2">
          📱 WhatsApp:{' '}
          <a
            href="https://wa.me/6282133576291"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            +62 821-3357-6291
          </a>
        </p>
        <p className="mb-1 md:mb-2">
          ☎️ Telepon:{' '}
          <a href="tel:0274374496" className="text-blue-600 hover:underline">
            (0274) 374496
          </a>
        </p>
        <p>
          📧 Email:{' '}
          <a
            href="mailto:diskominfo@jogjaprov.go.id"
            className="text-blue-600 hover:underline"
          >
            diskominfo@jogjaprov.go.id
          </a>
        </p>
      </div>

      {/* Map */}
      <div className="max-w-6xl mx-auto mt-8 md:mt-10 overflow-hidden rounded-lg shadow border border-gray-300">
        <iframe
          title="Peta Lokasi"
          src="https://www.google.com/maps?q=-7.809205,110.369331&hl=en&z=15&output=embed"
          width="100%"
          height="450"
          className="w-full"
          allowFullScreen
          loading="lazy"
          style={{ border: 0 }}
        ></iframe>
      </div>
    </div>

  );
}
