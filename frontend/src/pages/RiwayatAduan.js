import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FaArrowLeft } from 'react-icons/fa';

function RiwayatAduan() {
  const navigate = useNavigate();
  const [aduan, setAduan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const userID = sessionStorage.getItem('userID');
  const token = sessionStorage.getItem('token');

  const itemsPerPage = 5;
  const totalPages = Math.ceil(aduan.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedAduan = aduan.slice(startIndex, startIndex + itemsPerPage);

  // Memoize fungsi untuk menghindari re-render berlebihan
  const shortenText = useCallback((text, maxLength = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }, []);

  const backToAkun = useCallback(() => {
    navigate('/akun');
  }, [navigate]);

  const handleDetailClick = useCallback((itemId) => {
    navigate(`/detail/${itemId}`, {
      state: {
        from: '/riwayat',
        fromName: 'Riwayat Aduan',
      },
    });
  }, [navigate]);

  useEffect(() => {
    const fetchRiwayat = async () => {
      if (!userID || !token) {
        setError('Anda belum login.');
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/reports/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAduan(res.data.data ?? []);
      } catch {
        setError('Gagal memuat data riwayat aduan.');
      } finally {
        setLoading(false);
      }
    };

    fetchRiwayat();
  }, [userID, token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [aduan]);

  const statusColor = {
    diajukan: 'text-yellow-600',
    diproses: 'text-blue-600',
    selesai: 'text-green-600',
    ditolak: 'text-red-600',
  };

  if (loading) return <p className="text-center py-10">Memuat riwayat aduan...</p>;
  if (error) return <p className="text-red-600 text-center py-10">{error}</p>;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-2 py-1 md:px-6 md:py-6 flex-grow text-sm md:text-base">
        {/* Tombol Kembali */}
        <div className="flex justify-start mb-6">
          <button
            onClick={backToAkun}
            className="bg-white text-black p-3 rounded-full shadow-lg
               hover:bg-gray-50 hover:text-red-600 transition-all duration-200
               border border-gray-200"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
        </div>
        
        <h2 className="text-xl md:text-3xl font-bold text-black text-center mb-4 md:mb-6">
          Riwayat Aduan Saya
        </h2>

        {aduan.length === 0 ? (
          <div className="text-center py-10">
            <p>Tidak ada riwayat aduan.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Tampilan Desktop */}
            <div className="hidden md:block">
              <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-300">
                <table className="min-w-full text-sm table-auto border-collapse">
                  <thead className="bg-red-700 text-white">
                    <tr>
                      <th className="px-4 py-3 border">Judul Aduan</th>
                      <th className="px-4 py-3 border">Wilayah</th>
                      <th className="px-4 py-3 border">Tanggal</th>
                      <th className="px-4 py-3 border">Lokasi</th>
                      <th className="px-4 py-3 border">Deskripsi</th>
                      <th className="px-4 py-3 border">Status</th>
                      <th className="px-4 py-3 border">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {pagedAduan.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-2 border">
                          {shortenText(item.title || item.kategori)}
                        </td>
                        <td className="px-4 py-2 border">{item.wilayah}</td>
                        <td className="px-4 py-2 border">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2 border">
                          {shortenText(item.lokasi)}
                        </td>
                        <td className="px-4 py-2 border">
                          {shortenText(item.description || item.deskripsi)}
                        </td>
                        <td className={`px-4 py-2 border font-semibold ${statusColor[item.status?.toLowerCase()] || ''}`}>
                          {item.status}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          <button
                            onClick={() => handleDetailClick(item.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tampilan Mobile */}
            <div className="block md:hidden">
              <div className="space-y-4">
                {pagedAduan.map((item) => (
                  <div key={item.id} className="bg-white shadow border border-gray-300 rounded-xl p-4">
                    <h3 className="font-semibold text-teal-700 text-lg mb-2 line-clamp-1">
                      {shortenText(item.title || item.kategori)}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Wilayah:</strong> {item.wilayah}</p>
                      <p><strong>Tanggal:</strong> {' '}
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="line-clamp-1"><strong>Lokasi:</strong> {shortenText(item.lokasi)}</p>
                      <p className="line-clamp-1"><strong>Deskripsi:</strong> {shortenText(item.description || item.deskripsi)}</p>
                    </div>
                    <p className={`mt-2 font-semibold ${statusColor[item.status?.toLowerCase()] || ''}`}>
                      Status: {item.status}
                    </p>
                    <div className="mt-3">
                      <button
                        onClick={() => handleDetailClick(item.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded border text-sm hover:bg-red-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  « Prev
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded border text-sm transition-colors duration-200 ${
                      currentPage === i + 1
                        ? 'bg-red-700 text-white font-bold'
                        : 'text-teal-700 hover:bg-teal-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded border text-sm hover:bg-red-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next »
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RiwayatAduan;