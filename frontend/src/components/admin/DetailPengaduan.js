import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import Loader from '../../components/common/Loader';
import { FaChevronRight, FaChevronDown, FaTrash, FaUndo, FaTrashAlt, FaEye, FaEyeSlash, FaTimes, FaEdit, FaFilePdf } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create a custom icon for the marker
const locationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Komponen untuk handle klik pada map saat editing
function MapClickHandler({ onMapClick, isEditing }) {
  useMapEvents({
    click: (e) => {
      if (isEditing) {
        onMapClick(e);
      }
    },
  });
  return null;
}

function DetailReportAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [newFollowUp, setNewFollowUp] = useState('');
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalPdfUrl, setModalPdfUrl] = useState('');
  const [newFollowUpPhoto, setNewFollowUpPhoto] = useState(null);
  const [adminName, setAdminName] = useState('-');
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  // State baru untuk bukti foto management
  const [includeDeletedPhotos, setIncludeDeletedPhotos] = useState(false);
  const [buktiFotos, setBuktiFotos] = useState([]);
  const [categories, setCategories] = useState([]);

  const isPdfFile = (url) => /\.pdf$/i.test(url);

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

  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const openModal = (url) => {
    if (isPdfFile(url)) {
      setModalPdfUrl(url);    // Store URL instead of index
      setPdfModalOpen(true);
    } else {
      setModalImageUrl(url);
      setIsImageOpen(true);
    }
  };


  // State untuk edit informasi aduan
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    wilayah: '',
    lokasi: '',
    latitude: '',
    longitude: '',
    category_id: ''
  });

  // State untuk dropdown data (sementara static, nanti dari backend)
  const [wilayahOptions] = useState([
    'Kabupaten Sleman',
    'Kabupaten Bantul',
    'Kabupaten Kulon Progo',
    'Kabupaten Gunungkidul',
    'Kota Yogyakarta'
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {
        console.warn('Gagal mengambil kategori', err);
      }
    };
    fetchCategories();
  }, []);

  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const token = sessionStorage.getItem('token');

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Gunakan endpoint khusus admin yang bisa include deleted photos
      const endpoint = includeDeletedPhotos
        ? `/admin/reports/${id}/with-deleted?include_deleted=true`
        : `/reports/${id}`;

      const res = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      setReport(data);
      setBuktiFotos(data.bukti_fotos || []);
      setComments(data.comments || []);
      setFollowups(data.followups || []);

      // Update form data dengan data terbaru
      setEditFormData({
        title: data.title || '',
        description: data.description || '',
        wilayah: data.wilayah || '',
        lokasi: data.lokasi || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        category_id: data.category?.id || '',
        // disposisi_ke: adminName || '',
        // created_at: data.created_at || ''
      });

      console.log('Report data:', data);
      console.log('Bukti Fotos:', data.bukti_fotos);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Gagal mengambil detail pengaduan');
      setLoading(false);
    }
  };

  const fetchAdminName = async (categoryId) => {
    try {
      const res = await api.get(`/users/posisi?category_id=${categoryId}`);
      setAdminName(res.data.name);
    } catch (error) {
      console.error('Error fetching admin name:', error);
      setAdminName('-');
    }
  };

  // Fungsi untuk menyimpan perubahan informasi aduan
  const handleSaveReportInfo = async () => {
    try {
      await api.patch(
        `/reports/admin/${id}/update`,
        {
          title: editFormData.title,
          description: editFormData.description,
          wilayah: editFormData.wilayah,
          lokasi: editFormData.lokasi,
          latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
          longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
          category_id: editFormData.category_id,
          disposisi_ke: editFormData.disposisi_ke,
          created_at: editFormData.created_at
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Informasi aduan berhasil diperbarui');

      setIsEditingInfo(false);
      fetchReport();
    } catch (err) {
      console.error('Gagal update informasi aduan', err);

      alert('Gagal memperbarui informasi aduan');
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `Koordinat: ${lat}, ${lng}`;
    } catch (err) {
      console.error("Reverse geocode gagal:", err);
      return `Koordinat: ${lat}, ${lng}`;
    }
  };


  // Fungsi untuk handle perubahan lokasi melalui klik map
  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    const newAddress = await reverseGeocode(lat, lng);
    setEditFormData(prev => ({
      ...prev,
      lokasi: newAddress,       // <--- update alamat
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
  };

  const handleSaveLocation = async () => {
    try {
      await api.patch(
        `/reports/admin/${id}/update`,
        {
          lokasi: editFormData.lokasi,
          latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
          longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Lokasi berhasil diperbarui');

      setIsEditingLocation(false);  // otomatis close editing lokasi
      fetchReport(); // Refresh data terbaru

    } catch (err) {
      console.error('Gagal update lokasi', err);

      alert('Gagal memperbarui lokasi');
    }
  };



  // Fungsi untuk soft delete bukti foto
  const softDeleteBuktiFoto = async (fotoId) => {
    const isConfirmed = window.confirm('Yakin ingin menghapus bukti foto ini?');
    if (!isConfirmed) return;

    try {
      await api.delete(`/admin/bukti-foto/${fotoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Bukti foto berhasil dihapus');

      fetchReport(); // Refresh data

    } catch (error) {
      console.error('Error soft deleting photo:', error);

      alert('Gagal menghapus bukti foto');
    }
  };

  // Fungsi untuk restore bukti foto
  const restoreBuktiFoto = async (fotoId) => {
    const isConfirmed = window.confirm('Yakin ingin memulihkan bukti foto ini?');
    if (!isConfirmed) return;

    try {
      await api.post(`/admin/bukti-foto/${fotoId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Bukti foto berhasil dipulihkan');

      fetchReport(); // Refresh data

    } catch (error) {
      console.error('Error restoring photo:', error);

      alert('Gagal memulihkan bukti foto');
    }
  };


  // Fungsi untuk hard delete bukti foto
  const hardDeleteBuktiFoto = async (fotoId) => {
    const confirmHardDelete = window.confirm(
      'PERINGATAN: Ini akan menghapus bukti foto secara PERMANEN dari database. Yakin ingin melanjutkan?'
    );
    if (!confirmHardDelete) return;

    try {
      await api.delete(`/admin/bukti-foto/${fotoId}/permanent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Bukti foto berhasil dihapus permanen');
      fetchReport(); // Refresh data
    } catch (error) {
      console.error('Error hard deleting photo:', error);
      alert('Gagal menghapus permanen bukti foto');
    }
  };

  const openImageModal = (url) => {
    setModalImageUrl(url);
    setIsImageOpen(true);
  };

  const closeImageModal = () => {
    setIsImageOpen(false);
    setModalImageUrl('');
  };

  const openPdfModal = (url) => {
    setModalPdfUrl(url);
    setPdfModalOpen(true);
  };

  const closePdfModal = () => {
    setPdfModalOpen(false);
    setModalPdfUrl('');
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Gagal ambil komentar', err);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const res = await api.get(`/followups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowups(res.data.data || []);
    } catch (err) {
      console.error('Gagal ambil tindak lanjut', err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await fetchReport();
      await fetchComments();
      await fetchFollowUps();
    } catch (err) {
      setError('Gagal mengambil data detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id, token, includeDeletedPhotos]);

  useEffect(() => {
    if (report && report.category && report.category.id) {
      fetchAdminName(report.category.id);
    }
  }, [report]);

  const handleStatusChange = async (newStatus) => {
    const isConfirmed = window.confirm(`Mohon konfirmasi, ubah status ke "${newStatus}"?`);
    if (!isConfirmed) return;
    try {
      setUpdatingStatus(true);
      await api.patch(
        `/reports/admin/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchReport();
      // Notifikasi sukses
      alert('Status berhasil diupdate!');
    } catch {
      // Notifikasi gagal
      alert('Gagal mengubah status');
    } finally {
      setUpdatingStatus(false);
    }
  };


  const statusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'diajukan':
        return <i className="fas fa-pencil-alt" style={{ color: '#1560ee' }} title="Diajukan"></i>;
      case 'diproses':
        return <i className="fas fa-cogs" style={{ color: '#ff9800' }} title="Diproses"></i>;
      case 'selesai':
        return <i className="fas fa-check-circle" style={{ color: '#2e944b' }} title="Selesai"></i>;
      case 'ditolak':
        return <i className="fas fa-times-circle" style={{ color: '#d92121' }} title="Ditolak"></i>;
      default:
        return <i className="fas fa-info-circle" title={status}></i>;
    }
  };

  if (loading) return <Loader />;
  if (error) return <p>{error}</p>;
  if (!report) return <p>Laporan tidak ditemukan</p>;

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.post('/comments', { report_id: parseInt(id), text: newComment }, { headers: { Authorization: `Bearer ${token}` } });
      setNewComment('');
      fetchComments();

      alert('Komentar berhasil dikirim');

    } catch (err) {
      alert('Gagal mengirim komentar');
    }
  };


  const submitFollowUp = async () => {
    const formData = new FormData();
    formData.append('report_id', parseInt(id));
    formData.append('deskripsi', newFollowUp);
    if (newFollowUpPhoto) {
      formData.append('photo', newFollowUpPhoto);
    }

    try {
      await api.post(
        '/followups',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setNewFollowUp('');
      setNewFollowUpPhoto(null);
      fetchFollowUps();

      alert('Tindak lanjut berhasil dikirim');

    } catch (err) {
      alert('Gagal mengirim tindak lanjut');
    }
  };



  // Pisahkan bukti foto aktif dan yang dihapus
  const activeBuktiFotos = buktiFotos.filter(foto => !foto.deleted_at);
  const deletedBuktiFotos = buktiFotos.filter(foto => foto.deleted_at);

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative z-0">
      <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mb-6" onClick={() => navigate('/admin/reports')} aria-label="Kembali">
        ← Kembali
      </button>
      <div>
        {/* Riwayat Tindakan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <strong className="text-lg font-bold text-gray-800">Status Aduan</strong>
            <div className="flex items-center gap-3">
              {/* <span className="text-sm text-gray-600 font-medium">Status saat ini:</span> */}
              <select
                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-w-32 ${report.status.toLowerCase() === 'diajukan' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                  report.status.toLowerCase() === 'diproses' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    report.status.toLowerCase() === 'selesai' ? 'bg-green-100 text-green-800 border-green-300' :
                      'bg-red-100 text-red-800 border-red-300'
                  }`}
                value={report.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="Diajukan">Diajukan</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <strong className="text-lg font-bold text-gray-800 block mb-4">Riwayat Tindakan :</strong>
          <div className="space-y-4">
            {(report.riwayat || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
                {statusIcon(item.status)}
                <span className={`font-bold px-3 py-1 rounded-full text-sm ${item.status.toLowerCase() === 'diajukan' ? 'bg-yellow-100 text-yellow-800' :
                  item.status.toLowerCase() === 'diproses' ? 'bg-blue-100 text-blue-800' :
                    item.status.toLowerCase() === 'selesai' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {item.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(item.tanggal))}{' '}
                  |{' '}
                  {new Intl.DateTimeFormat('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                    .format(new Date(item.tanggal))
                    .replace('.', ':')}{' '}
                  WIB
                </span>
                {item.deskripsi && <span className="text-sm text-gray-700 ml-auto">{item.deskripsi}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Combined Report Info & Description Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <strong className="text-lg font-bold text-gray-800">📋 Informasi Aduan</strong>
            <button
              onClick={() => {
                setIsEditingInfo(true);
                // Scroll ke form edit setelah state update
                setTimeout(() => {
                  const editForm = document.querySelector('[data-edit-info="true"]');
                  if (editForm) {
                    editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaEdit /> Edit
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <strong className="text-gray-700">Judul Aduan:</strong> <span className="text-gray-900">{report.title}</span>
              </div>
              <div>
                <strong className="text-gray-700">Diajukan oleh:</strong> <span className="text-gray-900">{report.user?.name || 'Anonim'}</span>{' '}
                <span className="text-sm text-gray-500">Melalui Website Pengaduan</span>
              </div>
              <div>
                <strong className="text-gray-700">Didisposisikan ke:</strong> <span className="text-gray-900">{adminName}</span>
              </div>
              <div>
                <strong className="text-gray-700">Diadukan pada:</strong>{' '}
                <span className="text-sm text-gray-600">
                  {new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(report.created_at))}
                  &nbsp;
                  {new Intl.DateTimeFormat('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                    .format(new Date(report.created_at))
                    .replace('.', ':')}{' '}
                  WIB
                </span>
              </div>
              <div>
                <strong className="text-gray-700">Wilayah:</strong> <span className="text-gray-900">{report.wilayah || '-'}</span>
              </div>
              <div>
                <strong className="text-gray-700">Kategori:</strong> <span className="text-gray-900">{report.category?.name || '-'}</span>
              </div>
              <div className="mt-4">
                <strong className="text-gray-700 block mb-2">Deskripsi:</strong>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {report.description}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Popup - muncul di bawah card */}
          {isEditingInfo && (
            <div
              data-edit-info="true"
              className="mt-6 p-6 border-2 border-blue-500 rounded-lg bg-gray-50 relative"
            >
              <div className="flex justify-between items-center mb-4">
                <strong className="text-lg font-bold text-gray-800">✏️ Edit Informasi Aduan</strong>
                <button
                  onClick={() => setIsEditingInfo(false)}
                  className="bg-red-500 hover:bg-red-600 text-white border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block mb-2 font-bold text-gray-700">Judul Aduan:</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-bold text-gray-700">Wilayah:</label>
                    <select
                      value={editFormData.wilayah}
                      onChange={(e) => setEditFormData({ ...editFormData, wilayah: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Wilayah</option>
                      {wilayahOptions.map((wilayah, index) => (
                        <option key={index} value={wilayah}>{wilayah}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-bold text-gray-700">Kategori:</label>
                    <select
                      value={editFormData.category_id}
                      onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-gray-700">Deskripsi:</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsEditingInfo(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveReportInfo}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Lampiran Section dengan Bukti Foto Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <strong className="text-lg font-bold text-gray-800">
              📎 Lampiran Bukti Foto
              ({activeBuktiFotos.length} aktif
              {includeDeletedPhotos && deletedBuktiFotos.length > 0 && `, ${deletedBuktiFotos.length} dihapus`})
            </strong>

            {/* Toggle untuk menampilkan foto yang dihapus */}
            <div className="flex items-center gap-2">
              <label className="text-sm cursor-pointer flex items-center">
                <input
                  type="checkbox"
                  checked={includeDeletedPhotos}
                  onChange={(e) => setIncludeDeletedPhotos(e.target.checked)}
                  className="mr-2"
                />
                Tampilkan yang dihapus
              </label>
              {includeDeletedPhotos ? <FaEye className="text-blue-500" /> : <FaEyeSlash className="text-gray-400" />}
            </div>
          </div>

          {/* Foto Aktif */}
          {activeBuktiFotos.length > 0 && (
            <>
              <div className="text-sm text-green-700 mb-2 font-bold">
                ✅ Foto Aktif ({activeBuktiFotos.length})
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {activeBuktiFotos.map((foto, index) => {
                  const url = `http://localhost:8080/${foto.photo_url}`;
                  return (
                    <div key={foto.id} className="relative cursor-pointer" onClick={() => openModal(url, index)}>
                      {isPdfFile(url) ? (
                        <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg h-24 p-4 hover:opacity-80 transition-opacity cursor-pointer">
                          <FaFilePdf className="text-red-600 text-3xl mb-1" />
                          <span className="text-xs font-semibold text-gray-700">Lampiran PDF</span>
                        </div>

                      ) : (
                        <img
                          src={url}
                          alt={`Lampiran ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                        />
                      )}

                      {/* Action buttons for active photo */}
                      <div className="absolute top-1 right-1 flex gap-1 bg-black bg-opacity-70 rounded p-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            softDeleteBuktiFoto(foto.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs transition-colors"
                          title="Soft Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {includeDeletedPhotos && deletedBuktiFotos.length > 0 && (
            <>
              <div className="text-sm text-red-600 mb-2 mt-4 font-bold">
                🗑️ Foto Dihapus ({deletedBuktiFotos.length})
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {deletedBuktiFotos.map((foto, index) => {
                  const url = `http://localhost:8080/${foto.photo_url}`;
                  return (
                    <div key={foto.id} className="relative cursor-pointer">
                      {isPdfFile(url) ? (
                        <div
                          className="flex flex-col items-center justify-center bg-gray-200 rounded-lg h-24 p-4 hover:opacity-80 transition-opacity"
                          onClick={() => openPdfModal(url)}
                        >
                          <FaFilePdf className="text-red-600 text-3xl mb-1" />
                          <span className="text-xs font-semibold text-gray-700">Lampiran PDF</span>
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={`Lampiran Dihapus ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                          onClick={() => openImageModal(url)}
                        />
                      )}

                      {/* Tombol aksi */}
                      <div className="absolute top-1 right-1 flex gap-1 bg-black bg-opacity-70 rounded p-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreBuktiFoto(foto.id);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white p-1 rounded text-xs transition-colors"
                          title="Restore"
                        >
                          <FaUndo />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hardDeleteBuktiFoto(foto.id);
                          }}
                          className="bg-red-800 hover:bg-red-900 text-white p-1 rounded text-xs transition-colors"
                          title="Hard Delete (Permanen)"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>

                      {/* Info kapan dihapus */}
                      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-600 text-center bg-white bg-opacity-90 p-1 rounded-b-lg">
                        Dihapus: {new Date(foto.deleted_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  );
                })}

              </div>
            </>
          )}

          {/* Jika tidak ada foto sama sekali */}
          {buktiFotos.length === 0 && (
            <div className="text-center text-gray-500 py-8">Tidak ada lampiran.</div>
          )}

          {/* Modal Gambar */}
          {isImageOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={closeImageModal}
            >
              <div className="relative max-w-4xl max-h-full m-4" onClick={(e) => e.stopPropagation()}>
                <button className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300" onClick={closeImageModal}>×</button>
                <img src={modalImageUrl} alt="Lampiran besar" className="max-w-full max-h-full rounded-lg" />
              </div>
            </div>
          )}

          {/* Modal PDF */}
          {pdfModalOpen && (
            <PdfModal
              isOpen={pdfModalOpen}
              onClose={closePdfModal}
              pdfUrl={modalPdfUrl}
            />
          )}
        </div>

        {/* Enhanced Lokasi Section dengan Edit */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <strong className="text-lg font-bold text-gray-800">📍 Lokasi</strong>
            <button
              onClick={() => {
                setIsEditingLocation(true);
                // Scroll ke form edit setelah state update
                setTimeout(() => {
                  const editForm = document.querySelector('[data-edit-location="true"]');
                  if (editForm) {
                    editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaEdit /> Edit Lokasi
            </button>
          </div>

          {report.latitude && report.longitude ? (
            <>
              <div className="mt-2 text-sm text-gray-700 space-y-2">
                <p><strong>Alamat:</strong> {report.lokasi || '-'}</p>
                <p><strong>Latitude:</strong> {report.latitude}</p>
                <p><strong>Longitude:</strong> {report.longitude}</p>
              </div>
              <div className="mt-4 rounded-lg overflow-hidden relative z-10">
                <MapContainer
                  center={[report.latitude, report.longitude]}
                  zoom={15}
                  style={{ height: '400px', width: '100%', zIndex: 1 }}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[report.latitude, report.longitude]} icon={locationIcon}>
                    <Popup>{report.lokasi || 'Lokasi kejadian'}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Tidak ada lokasi dilampirkan</p>
          )}

          {/* Edit Lokasi Popup - muncul di bawah card */}
          {isEditingLocation && (
            <div
              data-edit-location="true"
              className="mt-6 p-6 border-2 border-blue-500 rounded-lg bg-gray-50 relative"
            >
              <div className="flex justify-between items-center mb-4">
                <strong className="text-lg font-bold text-gray-800">📍 Edit Lokasi</strong>
                <button
                  onClick={() => setIsEditingLocation(false)}
                  className="bg-red-500 hover:bg-red-600 text-white border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block mb-2 font-bold text-gray-700">Alamat/Lokasi:</label>
                  <input
                    type="text"
                    value={editFormData.lokasi}
                    onChange={(e) => setEditFormData({ ...editFormData, lokasi: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan alamat lokasi"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-bold text-gray-700">Latitude:</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.latitude}
                      onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contoh: -7.250445"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-gray-700">Longitude:</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.longitude}
                      onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contoh: 112.768845"
                    />
                  </div>
                </div>

                {/* Interactive Map untuk Edit */}
                <div>
                  <label className="block mb-2 font-bold text-gray-700">
                    📍 Pilih Lokasi di Peta (Klik pada peta untuk mengubah lokasi):
                  </label>
                  <div className="border-2 border-blue-500 rounded-lg overflow-hidden relative z-10">
                    <MapContainer
                      center={[
                        editFormData.latitude ? parseFloat(editFormData.latitude) : (report.latitude || -7.250445),
                        editFormData.longitude ? parseFloat(editFormData.longitude) : (report.longitude || 112.768845)
                      ]}
                      zoom={15}
                      style={{ height: '300px', width: '100%', cursor: 'crosshair', zIndex: 1 }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapClickHandler onMapClick={handleMapClick} isEditing={true} />
                      {editFormData.latitude && editFormData.longitude && (
                        <Marker
                          position={[parseFloat(editFormData.latitude), parseFloat(editFormData.longitude)]}
                          icon={locationIcon}
                        >
                          <Popup>
                            <div>
                              <strong>Lokasi yang Dipilih</strong><br />
                              Lat: {parseFloat(editFormData.latitude).toFixed(6)}<br />
                              Lng: {parseFloat(editFormData.longitude).toFixed(6)}
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  <div className="text-xs text-gray-600 italic mt-1">
                    💡 Klik pada peta untuk memilih lokasi baru, atau masukkan koordinat secara manual di atas.
                  </div>
                </div>

                <div className="text-xs text-gray-600 italic">
                  💡 Tips: Anda bisa mendapatkan koordinat latitude dan longitude dari Google Maps dengan klik kanan pada lokasi yang diinginkan.
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsEditingLocation(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveLocation}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Simpan Lokasi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Tindak Lanjut */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={() => setIsFollowUpOpen(prev => !prev)}
          >
            <strong className="text-lg font-bold text-gray-800">🔁 Tindak Lanjut (<span>{followups.length}</span>)</strong>
            <span className="ml-2 text-lg">
              {isFollowUpOpen ? <FaChevronDown /> : <FaChevronRight />}
            </span>
          </div>
          {isFollowUpOpen && (
            <div className="mt-4">
              {followups.length === 0 ? (
                <div className="text-center text-gray-500 py-4">-- Belum ada respon --</div>
              ) : (
                <div className="space-y-4 mb-6">
                  {followups.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="font-bold text-gray-800">
                        {item.admin?.name || 'Admin'}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {new Intl.DateTimeFormat('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(item.created_at))}
                        ,{' '}
                        {new Intl.DateTimeFormat('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }).format(new Date(item.created_at))}{' '}
                        WIB
                      </div>
                      <div className="text-gray-800">{item.deskripsi}</div>

                      {/* Tampilkan gambar jika ada */}
                      {item.photo_url && (
                        <img
                          src={`http://localhost:8080/${item.photo_url}`}
                          alt="Lampiran Tindak Lanjut"
                          className="max-w-48 mt-2 cursor-pointer rounded-lg hover:opacity-80 transition-opacity"
                          onClick={() => openImageModal(`http://localhost:8080/${item.photo_url}`)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-4">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tulis tindak lanjut..."
                  value={newFollowUp}
                  onChange={(e) => setNewFollowUp(e.target.value)}
                  rows={3}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewFollowUpPhoto(e.target.files[0])}
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700"
                />
                <div className="flex justify-end mt-3">
                  <button
                    className="bg-red-700 hover:bg-red-800  text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    onClick={submitFollowUp}
                    disabled={!newFollowUp.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    <span>Kirim</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Komentar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={() => setIsCommentOpen(prev => !prev)}
          >
            <strong className="text-lg font-bold text-gray-800">💬 Komentar (<span>{comments.length}</span>)</strong>
            <span className="ml-2 text-lg">
              {isCommentOpen ? <FaChevronDown /> : <FaChevronRight />}
            </span>
          </div>
          {isCommentOpen && (
            <div className="mt-4">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-4">-- Belum ada komentar --</div>
              ) : (
                <div className="space-y-4 mb-6">
                  {comments.map((comment, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="font-bold text-gray-800">
                        {comment.user?.name || 'User'}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {new Intl.DateTimeFormat('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(comment.created_at))}
                        ,{' '}
                        {new Intl.DateTimeFormat('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }).format(new Date(comment.created_at))}{' '}
                        WIB
                      </div>
                      <div className="text-gray-800">{comment.text}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Kirim sebuah komentar"
                  value={newComment}
                  maxLength={500}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">{newComment.length}/500</span>
                  <button
                    className="bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    onClick={submitComment}
                    disabled={!newComment.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    <span>Kirim</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailReportAdmin;