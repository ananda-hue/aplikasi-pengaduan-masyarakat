import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import Loader from '../components/common/Loader';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  UserIcon, MapPinIcon, TagIcon, ChatBubbleBottomCenterTextIcon, PaperClipIcon, NoSymbolIcon, ArrowLeftIcon,
  CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XCircleIcon, PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';

// Constants
const LOCATION_ICON = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const STATUS_CONFIG = {
  diajukan: {
    gradient: 'from-amber-400 to-orange-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: InformationCircleIcon,
    glow: 'shadow-amber-200'
  },
  diproses: {
    gradient: 'from-blue-400 to-indigo-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ExclamationCircleIcon,
    glow: 'shadow-blue-200'
  },
  selesai: {
    gradient: 'from-emerald-400 to-green-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircleIcon,
    glow: 'shadow-emerald-200'
  },
  ditolak: {
    gradient: 'from-red-400 to-rose-600',
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircleIcon,
    glow: 'shadow-red-200'
  },
};

// Utility Components
const GlassCard = ({ children, className = "", blur = "backdrop-blur-sm" }) => (
  <div className={`bg-white/80 ${blur} border border-white/20 shadow-xl rounded-2xl ${className}`}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.diajukan;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${config.badge} shadow-sm`}>
      <Icon className="w-4 h-4" />
      <span className="capitalize">{status}</span>
    </div>
  );
};

const EmptyState = ({ icon, title, message, className = "" }) => (
  <div className={`text-center py-12 ${className}`}>
    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 max-w-sm mx-auto">{message}</p>
  </div>
);

// const isImageFile = (url) => {
//   return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
// };

const isPdfFile = (url) => {
  return /\.pdf$/i.test(url);
};

const PdfModal = ({ isOpen, onClose, pdfUrl }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-auto min-h-screen">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">PDF</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
            aria-label="Close PDF"
          >
            ×
          </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-2">
          <iframe
            src={`${pdfUrl}#view=FitH`}
            className="w-full h-full border-0 rounded"
            title="PDF"
          />
        </div>
      </div>
    </div>
  );
};


// Photo Carousel Component (dengan perbaikan) - Tambahkan onImageClick prop
const PhotoDisplay = ({ photos, onImageClick, onPdfClick }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const handlePrev = () => {
    setCurrentPhotoIndex(prevIndex =>
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    );
  };
  
  const handleNext = () => {
    setCurrentPhotoIndex(prevIndex =>
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">No Photo</span>
      </div>
    );
  }

  const currentFile = photos[currentPhotoIndex];
  const isCurrentFilePdf = isPdfFile(currentFile);

  return (
    <>
      <div className="relative w-full h-full aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100 border border-gray-200">
        {isCurrentFilePdf ? (
          // TAMPILAN UNTUK PDF
          <div 
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all duration-200"
            onClick={() => onPdfClick && onPdfClick(currentPhotoIndex)}
          >
            {/* PDF Icon */}
            <div className="mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#e53e3e"/>
                <path d="M14 2V8H20" fill="#c53030"/>
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold">PDF</text>
              </svg>
            </div>
            <p className="text-gray-600 text-sm font-medium">PDF Document</p>
          </div>
        ) : (
          // TAMPILAN UNTUK GAMBAR
          <img
            src={currentFile}
            alt={`Lampiran ${currentPhotoIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onImageClick && onImageClick(currentPhotoIndex)}
          />
        )}
        
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all duration-200 z-10"
              aria-label="Previous photo"
            >
              &lt;
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all duration-200 z-10"
              aria-label="Next photo"
            >
              &gt;
            </button>
            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs z-10">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>
    </>
  );
};


// Timeline Component (NEW VERSION)
const ProcessTimeline = ({ riwayat }) => {
  const allSteps = {
    diajukan: {
      id: 1,
      title: 'Diajukan',
      description: 'Laporan telah diterima dan menunggu verifikasi tim kami.',
      icon: FileText,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
    },
    diproses: {
      id: 2,
      title: 'Diproses',
      description: 'Laporan sedang dalam tahap penanganan oleh petugas terkait.',
      icon: Clock,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
    },
    selesai: {
      id: 3,
      title: 'Selesai',
      description: 'Laporan telah diselesaikan dan tindak lanjut telah dilakukan.',
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      borderColor: 'border-green-500',
    },
    ditolak: {
      id: 4,
      title: 'Ditolak',
      description: 'Laporan tidak dapat diproses karena tidak memenuhi persyaratan.',
      icon: XCircle,
      bgColor: 'bg-red-500',
      textColor: 'text-red-600',
      borderColor: 'border-red-500',
    },
  };

  if (!riwayat || riwayat.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-8 mx-auto w-full">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline Kosong</h3>
          <p className="text-gray-600 max-w-sm mx-auto">Riwayat status belum tersedia</p>
        </div>
      </div>
    );
  }

  const sortedRiwayat = [...riwayat].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  const statusHistory = sortedRiwayat.map(item => item.status?.toLowerCase() || 'diajukan');
  const activeSteps = statusHistory.map((status, index) => ({
    ...allSteps[status],
    stepNumber: index + 1,
    isLast: index === statusHistory.length - 1,
    tanggal: sortedRiwayat[index].tanggal
  }));

  // Tentukan warna gradasi garis pakai status terakhir
  const lastStatus = activeSteps[activeSteps.length - 1]?.title?.toLowerCase();
  const gradientClass =
    lastStatus === 'ditolak'
      ? 'bg-gradient-to-r from-yellow-500 via-blue-500 to-red-500'
      : 'bg-gradient-to-r from-yellow-500 via-blue-500 to-green-500';

  // Pengaturan layout untuk 2 step agar rata tengah dan container lebih kecil
  const containerWidthClass = 'md:w-3/4';
  const containerJustifyClass = 'justify-between';
  const containerGapClass = 'gap-8';

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-6 mx-auto w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Timeline Progress</h2>

      {/* Desktop Layout - Tetap sama */}
      <div className="hidden md:block relative overflow-visible pb-4">
        {/* Garis horizontal (desktop) */}
        <div className={`absolute top-[50px] left-0 right-0 h-1 bg-gray-200 z-0 mx-auto ${containerWidthClass}`}>
          <div className={`h-1 ${gradientClass} transition-all duration-500 w-full`}></div>
        </div>

        {/* Timeline steps Desktop */}
        <div className={`relative z-20 flex flex-row ${containerGapClass} mx-auto ${containerWidthClass} ${containerJustifyClass}`}>
          {activeSteps.map((step, index) => (
            <div
              key={step.stepNumber}
              className="flex flex-col items-center px-2 flex-shrink-0 w-1/3"
            >
              <div className="relative mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.bgColor} text-white shadow-md ${step.isLast ? 'ring-2 ring-opacity-30 ' + step.bgColor.replace('bg-', 'ring-') : ''}`}>
                  <span className="text-xs font-bold">0{step.stepNumber}</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent"
                    style={{
                      borderTopColor: step.bgColor.includes('yellow') ? '#eab308' : step.bgColor.includes('blue') ? '#3b82f6' : step.bgColor.includes('green') ? '#22c55e' : '#ef4444'
                    }}>
                  </div>
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 p-1 rounded-full bg-white">
                    <step.icon size={12} className={step.textColor} />
                  </div>
                </div>
              </div>
              <div className={`bg-white rounded-lg shadow-sm p-3 border ${step.isLast ? step.borderColor : 'border-gray-100'}`}>
                <h3 className={`text-sm font-semibold mb-1 text-center ${step.textColor}`}>
                  {step.title}
                </h3>
                <p className="text-[11px] text-gray-500 mb-1 text-center">
                  {new Date(step.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-600 text-center leading-tight">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Layout - Vertical Scroll */}
      <div className="md:hidden relative">
        {/* Container untuk vertical scroll dengan tinggi maksimal */}
        <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="relative px-3 pb-3">
            {/* Garis vertikal utama */}
            <div className="absolute left-6 top-0 w-0.5 bg-gray-200 h-full z-0">
              <div className={`w-0.5 h-full ${gradientClass} transition-all duration-500`}></div>
            </div>

            <div className="relative z-10 space-y-3">
              {activeSteps.map((step, index) => (
                <div key={step.stepNumber} className="flex items-start space-x-3">
                  {/* Step Circle */}
                  <div className="flex-shrink-0 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.bgColor} text-white shadow-md ${step.isLast ? 'ring-1 ring-opacity-30 ' + step.bgColor.replace('bg-', 'ring-') : ''}`}>
                      <span className="text-[10px] font-bold">0{step.stepNumber}</span>
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 p-0.5 rounded-full bg-white shadow-sm">
                      <step.icon size={8} className={step.textColor} />
                    </div>
                  </div>

                  {/* Step Info Card */}
                  <div className={`bg-white rounded-lg shadow-sm p-2.5 flex-1 border ${step.isLast ? step.borderColor : 'border-gray-100'} max-w-xs`}>
                    <h3 className={`text-xs font-semibold mb-1 ${step.textColor}`}>
                      {step.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-1.5">
                      {new Date(step.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator untuk mobile */}
        <div className="flex justify-center mt-2 text-xs text-gray-400">
          <span>Scroll untuk melihat lebih banyak</span>
        </div>
      </div>
    </div>
  );
};

// Tab Component
const ModernTabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === tab.id
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
            }`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

// Main Component
function DetailReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const form = location.state?.from;
  const backUrl = location.state?.from || '/daftar';
  const fromName = sessionStorage.getItem('backTo') || 'daftar';
  const token = sessionStorage.getItem('token');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhotoIndex, setModalPhotoIndex] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [modalPdfIndex, setModalPdfIndex] = useState(0);

  const openPhotoModal = (url) => {
    setPhotoModalUrl(url);
    setPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setPhotoModalOpen(false);
    setPhotoModalUrl(null);
  };

  // Fungsi untuk buka modal foto saat foto diklik
  const openModal = (index) => {
    setModalPhotoIndex(index);
    setModalOpen(true);
  };

  // Fungsi untuk tutup modal
  const closeModal = () => {
    setModalOpen(false);
    // setModalPhotoIndex(null);
  };
  
 const openPdfModal = (index) => {
    console.log('PDF modal clicked, index:', index);
    console.log('PDF URL:', photos[index]);
    setModalPdfIndex(index);
    setPdfModalOpen(true);
  };


  const closePdfModal = () => {
    setPdfModalOpen(false);
  };

  const [state, setState] = useState({
    report: null,
    comments: [],
    followups: [],
    newComment: '',
    activeTab: 'tindaklanjut',
    loading: true,
    error: null,
    adminName: '-'
  });

  const handleBackClik = () => {
    console.log('Navigate to: ', backUrl);
    console.log('location', location.state);
    console.log('backurl', backUrl);
    navigate(backUrl);
  };

  const { report, comments, followups, newComment, activeTab, loading, error } = state;

const photos = useMemo(() => {
  if (!report?.bukti_fotos || !Array.isArray(report.bukti_fotos)) return [];
  return report.bukti_fotos.map(foto => `http://localhost:8080/${foto.photo_url}`);
}, [report]);


  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [reportRes, commentsRes, followupsRes] = await Promise.all([
        api.get(`/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/comments/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/followups/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setState(prev => ({
        ...prev,
        report: reportRes.data.data,
        comments: commentsRes.data.data,
        followups: followupsRes.data.data,
      }));
      console.log("✅ Bukti fotos:", reportRes.data.data?.bukti_fotos);

      if (reportRes.data.data?.category?.id) {
        fetchAdminName(reportRes.data.data.category.id);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setState(prev => ({ ...prev, error: 'Gagal mengambil data laporan.' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchAdminName = async (categoryId) => {
    try {
      const res = await api.get(`/users/posisi?category_id=${categoryId}`);
      setState(prev => ({ ...prev, adminName: res.data.name }));
    } catch {
      setState(prev => ({ ...prev, adminName: '-' }));
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post('/comments', { report_id: parseInt(id), text: newComment }, { headers: { Authorization: `Bearer ${token}` } });
      setState(prev => ({ ...prev, newComment: '' }));
      const commentsRes = await api.get(`/comments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setState(prev => ({ ...prev, comments: commentsRes.data.data }));
    } catch (err) {
      console.error('Gagal mengirim komentar:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      setState(prev => ({ ...prev, loading: false, error: "Anda tidak memiliki otorisasi." }));
    }
  }, [id, token]);

  const tabs = useMemo(() => [
    { id: 'tindaklanjut', label: 'Tindak Lanjut', count: followups.length },
    { id: 'komentar', label: 'Komentar', count: comments.length },
  ], [followups, comments, report]);

  if (loading) return <Loader />;

  if (error || !report) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GlassCard className="p-8 max-w-md mx-4">
        <EmptyState
          icon={<NoSymbolIcon className="w-8 h-8 text-gray-400" />}
          title="Oops! Terjadi Kesalahan"
          message={error || 'Data laporan tidak ditemukan'}
        />
        <button
          onClick={() => navigate('/reports')}
          className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
        >
          Kembali ke Beranda
        </button>
      </GlassCard>
    </div>
  );

  const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
  const lastStatus = report.status?.toLowerCase() || 'diajukan';
  const statusConfig = STATUS_CONFIG[lastStatus] || STATUS_CONFIG.diajukan;

  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div>
      {/* Header Full-Width */}
      <div className={`overflow-hidden rounded-2xl shadow-xl border border-white/20 bg-gradient-to-br ${statusConfig.gradient} max-h-[150px]`}>

        <div className="relative w-full py-5 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse-wave">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClik}
              className="flex items-center justify-center 
             w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
             bg-white/10 backdrop-blur-sm rounded-lg
             text-white hover:bg-white/20 
             transition-all duration-300 hover:scale-105"
              title={`Kembali ke ${location.state?.fromName || "Home"}`}
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-teal-900">
                  Detail Laporan
                </h1>
              </div>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600">
                ID Tracking:{" "}
                <span className="text-blue-600 font-mono font-semibold">
                  {report.tracking_id}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full  py-8 relative z-10 space-y-8">
        {/* Timeline (di paling atas, full lebar) */}
        <ProcessTimeline riwayat={report.riwayat} />

        {/* Card Responsivitas - Hanya muncul di mobile, setelah timeline */}
        <div className="xl:hidden">
          <GlassCard className="p-4 sm:p-6 mb-5">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Responsivitas
            </h3>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm text-gray-600">Status</span>
                <span className="text-xs sm:text-sm font-medium">
                  {(() => {
                    switch (report.status?.toLowerCase()) {
                      case 'diajukan':
                        return '0%';
                      case 'diproses':
                        return '50%';
                      case 'selesai':
                      case 'ditolak':
                        return '100%';
                      default:
                        return '0%';
                    }
                  })()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                {(() => {
                  switch (report.status?.toLowerCase()) {
                    case 'diproses':
                      return (
                        <div
                          className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-400 to-orange-500"
                          style={{ width: '50%' }}
                        />
                      );
                    case 'selesai':
                    case 'ditolak':
                      return (
                        <div
                          className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-green-400 to-emerald-500"
                          style={{ width: '100%' }}
                        />
                      );
                    default:
                      return null;
                  }
                })()}
              </div>
            </div>
          </GlassCard>

          {/* hanya muncul di mobail  */}
          <GlassCard className="p-4 sm:p-6 mb-5">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Ringkasan Laporan
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Status</span>
                <StatusBadge status={report.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Tanggal</span>
                <span className="text-xs sm:text-sm font-medium">
                  {new Date(report.created_at).toLocaleString('id-ID', {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Wilayah</span>
                <span className="text-xs sm:text-sm font-medium">{report.wilayah}</span>
              </div>
              <div className="grid grid-cols-[auto,1fr] items-start gap-x-2">
                <span className="text-xs sm:text-sm text-gray-600">Didisposisi ke</span>
                <span className="text-xs sm:text-sm font-medium text-right break-words">
                  {state.adminName}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* hanya muncul di mobail  */}
          <GlassCard className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Aktivitas
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium">Tindak Lanjut</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">{followups.length} respon</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium">Komentar</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">{comments.length} komentar</p>
                </div>
              </div>
              {report.bukti_fotos && report.bukti_fotos.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <PaperClipIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Lampiran</p>
                    <p className="text-[11px] sm:text-xs text-gray-500">{report.bukti_fotos.length} foto tersedia</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area (col-span-2) */}
          <div className="xl:col-span-2 space-y-8">
            {/* Card Laporan + Foto (Layout berubah menjadi flex) */}
            <div className={`overflow-hidden rounded-2xl shadow-xl border border-white/20 bg-gradient-to-br ${statusConfig.gradient}`}>
              {/* Isi card dengan layout flex (foto di samping) */}
              <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border-t border-gray-200 rounded-b-xl">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  {/* Bagian kiri - informasi laporan */}
                  <div className="flex-[2] space-y-3 sm:space-y-4">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {report.title}
                    </h2>

                    {/* Profil & Waktu */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                      <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {report.is_anonymous ? 'Pelapor Anonim' : (report.user?.name || 'Anonim')}
                        </span>
                        <div className="text-[10px] sm:text-[11px] text-gray-500">
                          {new Date(report.created_at).toLocaleDateString('id-ID', {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {', pukul '}
                          {new Date(report.created_at).toLocaleTimeString('id-ID', {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          })}
                          {' WIB'}
                        </div>
                      </div>
                    </div>

                    {/* Informasi tambahan dalam grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] sm:text-xs text-gray-500">Wilayah</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-800">{report.wilayah || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <TagIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] sm:text-xs text-gray-500">Kategori</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-800">{report.category?.name || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <ArrowRightCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] sm:text-xs text-gray-500">Didisposisi ke</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-800">{state.adminName || '-'} {report.wilayah}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bagian kanan - foto bukti */}
             <div className="w-full lg:flex-[3]">
  <div className="w-full aspect-[4/3] sm:aspect-video rounded-lg overflow-hidden">
    <PhotoDisplay 
      photos={photos} 
      onImageClick={openModal}
      onPdfClick={openPdfModal} 
    />
  </div>
</div>
                </div>

                {/* Deskripsi di bawah (full width) */}
                <div className="bg-gray-100/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200 mt-4 sm:mt-6">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">
                    Deskripsi Laporan
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-gray-700">
                    {report.description}
                  </p>
                </div>

                {/* Peta Lokasi - Hanya muncul di mobile*/}
                <div className="xl:hidden mt-4 sm:mt-6">
                  {report.latitude && report.longitude && (
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4">
                        Lokasi Kejadian
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-gray-500" />
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                            {report.lokasi || 'Lokasi tidak disebutkan'}
                          </p>
                        </div>
                        <div
                          style={{ height: '200px' }}
                          className="sm:h-[250px] rounded-xl overflow-hidden shadow-lg border border-gray-200"
                        >
                          <MapContainer
                            center={[report.latitude, report.longitude]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[report.latitude, report.longitude]} icon={LOCATION_ICON}>
                              <Popup>{report.lokasi || 'Lokasi kejadian'}</Popup>
                            </Marker>
                          </MapContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Section (Komentar & Tindak Lanjut) */}
            <div className="p-6 bg-white/80 rounded-2xl shadow-xl border border-white/20">
              <ModernTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(tabId) => setState(prev => ({ ...prev, activeTab: tabId }))}
              />
              <div className="mt-6">
                {activeTab === 'tindaklanjut' && (
                  <div className="space-y-4">
                    {followups.length === 0 ? (
                      <EmptyState
                        icon={<ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-gray-400" />}
                        title="Belum Ada Tindak Lanjut"
                        message="Menunggu respon dari admin terkait"
                      />
                    ) : (
                      followups.map((item, idx) => (
                        <GlassCard key={idx} className="p-4 border-l-4 border-l-blue-500 max-w-full w-full">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 break-words text-sm sm:text-base md:text-lg">
                                  {item.admin?.name || 'Admin'}
                                </h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                                  {new Date(item.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3 break-words text-sm md:text-base">{item.deskripsi}</p>
                              {item.photo_url && (
                                <img
                                  src={`http://localhost:8080/${item.photo_url}`}
                                  alt="Tindak Lanjut"
                                  className="h-auto rounded-lg shadow-md border max-w-[12rem] float-left mr-4 mb-4 cursor-pointer"
                                  onClick={() => openPhotoModal(`http://localhost:8080/${item.photo_url}`)}
                                />
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'komentar' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <EmptyState
                          icon={<ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-gray-400" />}
                          title="Belum Ada Komentar"
                          message="Jadilah yang pertama memberikan komentar"
                        />
                      ) : (
                        <GlassCard className="p-4 space-y-4">
                          {comments.map((kom, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 break-words text-sm sm:text-base md:text-lg">
                                    {kom.user?.name || 'User'}
                                  </h4>
                                  <span className="text-xs text-gray-500 mt-1 sm:mt-0 sm:flex-shrink-0">
                                    {new Date(kom.created_at).toLocaleString('id-ID', {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <p className="text-gray-700 break-words">{kom.text}</p>
                              </div>
                            </div>
                          ))}
                        </GlassCard>
                      )}
                    </div>
                    <GlassCard className="p-6 border-t-4 border-t-purple-500">
                      <h3 className="font-semibold text-gray-900 mb-4">Tambah Komentar</h3>
                      {isLoggedIn ? (
                        <div className="space-y-4">
                          <textarea
                            value={newComment}
                            onChange={(e) =>
                              setState((prev) => ({ ...prev, newComment: e.target.value }))
                            }
                            rows={4}
                            maxLength={500}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-gray-50"
                            placeholder="Bagikan pemikiran Anda..."
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {newComment.length}/500
                            </span>
                            <button
                              onClick={submitComment}
                              disabled={!newComment.trim()}
                              className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                              Kirim
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 text-yellow-800 bg-yellow-50 border border-red-100 rounded-lg max-w-full">
                          <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
                          <p className="text-sm">
                            Silakan{" "}
                            <Link
                              to="/login"
                              className="underline font-semibold hover:text-yellow-900"
                            >
                              login
                            </Link>{" "}
                            untuk memberikan komentar.
                          </p>
                        </div>
                      )}
                    </GlassCard>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Quick Info - Hanya muncul di desktop */}
          <div className="hidden xl:block space-y-4 sm:space-y-6">
            <GlassCard className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                Responsivitas
              </h3>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm text-gray-600">Status</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {(() => {
                      switch (report.status?.toLowerCase()) {
                        case 'diajukan':
                          return '0%';
                        case 'diproses':
                          return '50%';
                        case 'selesai':
                        case 'ditolak':
                          return '100%';
                        default:
                          return '0%';
                      }
                    })()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  {(() => {
                    switch (report.status?.toLowerCase()) {
                      case 'diproses':
                        return (
                          <div
                            className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-400 to-orange-500"
                            style={{ width: '50%' }}
                          />
                        );
                      case 'selesai':
                      case 'ditolak':
                        return (
                          <div
                            className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-green-400 to-emerald-500"
                            style={{ width: '100%' }}
                          />
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                Ringkasan Laporan
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Status</span>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Tanggal</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {new Date(report.created_at).toLocaleString('id-ID', {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Wilayah</span>
                  <span className="text-xs sm:text-sm font-medium">{report.wilayah}</span>
                </div>
                <div className="grid grid-cols-[auto,1fr] items-start gap-x-2">
                  <span className="text-xs sm:text-sm text-gray-600">Didisposisi ke</span>
                  <span className="text-xs sm:text-sm font-medium text-right break-words">
                    {state.adminName}
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                Aktivitas
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Tindak Lanjut</p>
                    <p className="text-[11px] sm:text-xs text-gray-500">{followups.length} respon</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Komentar</p>
                    <p className="text-[11px] sm:text-xs text-gray-500">{comments.length} komentar</p>
                  </div>
                </div>
                {report.bukti_fotos && report.bukti_fotos.length > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <PaperClipIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Lampiran</p>
                      <p className="text-[11px] sm:text-xs text-gray-500">{report.bukti_fotos.length} foto tersedia</p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Peta Lokasi - Hanya muncul di desktop */}
            {report.latitude && report.longitude && (
              <GlassCard className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                  Lokasi Kejadian
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-gray-500" />
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {report.lokasi || 'Lokasi tidak disebutkan'}
                    </p>
                  </div>
                  <div
                    style={{ height: '200px' }}
                    className="sm:h-[250px] rounded-xl overflow-hidden shadow-lg border border-gray-200"
                  >
                    <MapContainer
                      center={[report.latitude, report.longitude]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[report.latitude, report.longitude]} icon={LOCATION_ICON}>
                        <Popup>{report.lokasi || 'Lokasi kejadian'}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Modal untuk foto carousel */}
          {modalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 md:p-0"
              onClick={closeModal}
            >
              <div
                className="relative max-w-full max-h-full w-auto max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl rounded-lg shadow-lg bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={photos[modalPhotoIndex]}
                  alt={`Lampiran ${modalPhotoIndex + 1}`}
                  className="w-full h-auto object-contain rounded-t-lg"
                />
                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-3xl font-bold"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {/* Modal untuk foto tindak lanjut */}
          {photoModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 md:p-0"
              onClick={closePhotoModal}
            >
              <div
                className="relative max-w-screen-md max-h-[90vh] rounded-lg overflow-hidden bg-white p-4 md:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={closePhotoModal}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-3xl font-bold"
                  aria-label="Close modal"
                >
                  &times;
                </button>
                <img
                  src={photoModalUrl}
                  alt="Foto Tindak Lanjut"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            </div>
          )}
          {/* Modal untuk PDF */}
{pdfModalOpen && (
  <PdfModal
    isOpen={pdfModalOpen}
    onClose={closePdfModal}
    pdfUrl={photos[modalPdfIndex]}
  />
)}
        </div>
      </div>
    </div>
  );
}

export default DetailReport;