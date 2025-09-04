import React, { useState, useEffect } from 'react';
import api from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle,
  faInfoCircle,
  faLink,
  faCheckCircle,
  faTimesCircle,
  faImage,
  faChevronDown,
  faRedo,
  faSliders,
  faFilePdf,
  faTimesCircle as faRedTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
// import { id } from 'date-fns/locale';

function ListPengaduan() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for filters
  const [filterStatus, setFilterStatus] = useState([]);
  const [tempFilterStatus, setTempFilterStatus] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const navigate = useNavigate();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get('/reports/all');
        setReports(response.data);
        setLoading(false);
        setFilterStatus(['Diajukan', 'Diproses', 'Selesai', 'Ditolak']);
      } catch (err) {
        setError('Gagal mengambil data pengaduan.');
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 768 ? 5 : 8);
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const renderStatusBadge = (status) => {
    const statusText = (status || '').toLowerCase();
    const base = 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full';

    switch (statusText) {
      case 'diajukan':
        return <span className={`${base} bg-yellow-100 text-yellow-600`}><FontAwesomeIcon icon={faInfoCircle} /> Diajukan</span>;
      case 'diproses':
        return <span className={`${base} bg-blue-100 text-blue-700`}><FontAwesomeIcon icon={faLink} /> Diproses</span>;
      case 'selesai':
        return <span className={`${base} bg-green-100 text-green-700`}><FontAwesomeIcon icon={faCheckCircle} /> Selesai</span>;
      case 'ditolak':
        return <span className={`${base} bg-red-100 text-red-600`}><FontAwesomeIcon icon={faTimesCircle} /> Ditolak</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>;
    }
  };

  const handleCardClick = (id) => {
    navigate(`/detail/${id}`, {
      state: {
        form: '/Listpengaduan',
        fromName: 'Daftar Aduan'
      }
    });
  };

  const handleApplyStatusFilter = () => {
    if (tempFilterStatus.length === 0) {
      setFilterStatus(['Diajukan', 'Diproses', 'Selesai', 'Ditolak']);
    } else {
      setFilterStatus(tempFilterStatus);
    }
    setIsStatusOpen(false);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterStatus(['Diajukan', 'Diproses', 'Selesai', 'Ditolak']);
    setTempFilterStatus([]);
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  const handleTempStatusChange = (status) => {
    const isSelected = tempFilterStatus.includes(status);
    if (isSelected) {
      setTempFilterStatus(tempFilterStatus.filter((s) => s !== status));
    } else {
      setTempFilterStatus([...tempFilterStatus, status]);
    }
  };

  const filteredReports = reports.filter((item) => {
    const statusMatch = filterStatus.includes(item.status);
    const itemDate = new Date(item.created_at);

    const dateMatch =
      (!startDate || !endDate) ||
      (itemDate >= startDate && itemDate <= endDate);

    return statusMatch && dateMatch;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  const statusOptions = ['Diajukan', 'Diproses', 'Selesai', 'Ditolak'];

  // Custom component untuk label input DatePicker
  const CustomInput = ({ value, onClick }) => {
    let displayText = 'Pilih rentang tanggal';
    if (startDate && endDate) {
      displayText = `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
    } else if (startDate) {
      displayText = `${format(startDate, "dd/MM/yyyy")}`;
    }

    return (
      <div className="relative w-full">
        <input
          type="text"
          value={displayText}
          onClick={onClick}
          readOnly
          // Tambahkan padding-right agar ada ruang untuk tombol 'X'
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 pr-8" 
        />
        {value && (
          <button
            type="button"
            // Sesuaikan posisi right untuk tombol 'X'
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              setDateRange([null, null]);
            }}
          >
            <FontAwesomeIcon icon={faRedTimesCircle} />
          </button>
        )}
      </div>
    );
  };

  if (loading) return <p className="text-center py-10 text-gray-600">Memuat data pengaduan...</p>;
  if (error) return <p className="text-center text-red-600 py-4">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 px-4 font-['Work_Sans'] pt-2 md:pt-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl md:text-3xl font-bold text-red-600 mb-2 text-center">
          Riwayat Pengaduan Masyarakat
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Daftar pengaduan masyarakat yang telah dikirim, lengkap dengan informasi wilayah, lokasi, tanggal, dan status penanganan.
        </p>
        
        {/* Mobile Filter Button */}
        <div className="mb-6 md:hidden">
          <button
            onClick={() => setIsFilterMobileOpen(!isFilterMobileOpen)}
            className="flex items-center bg-red-700 text-white py-2 px-4 rounded font-semibold"
          >
            <FontAwesomeIcon icon={faSliders} size="lg" />
            <span className="ml-2">Filter</span>
          </button>
          {isFilterMobileOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={() => setIsFilterMobileOpen(false)}
              />
              <div className="absolute left-0 right-0 mt-2 z-50 bg-white shadow-lg rounded-xl p-4 space-y-6 border border-gray-200">
                {/* Status Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm cursor-pointer flex items-center justify-between"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                  >
                    <span className="text-gray-700">
                      {(filterStatus.length === 0 || filterStatus.length === statusOptions.length)
                        ? 'Semua Status'
                        : filterStatus.join(', ')
                      }
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-gray-400 transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isStatusOpen && (
                    <div className="absolute left-0 right-0 mt-1 z-50 shadow-lg rounded-lg bg-white p-2 border border-gray-200">
                      {statusOptions.map((status) => (
                        <label key={status} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md">
                          <input
                            type="checkbox"
                            checked={tempFilterStatus.includes(status)}
                            onChange={() => handleTempStatusChange(status)}
                            className="form-checkbox h-4 w-4 text-red-600"
                          />
                          <span>{status}</span>
                        </label>
                      ))}
                      <div className="p-2 border-t border-gray-200 mt-2">
                        <button
                          onClick={handleApplyStatusFilter}
                          className="w-full py-1.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                        >
                          Oke
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Tanggal</label>
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => {
                      setDateRange(update);
                      setCurrentPage(1);
                    }}
                    customInput={<CustomInput />}
                  />
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full"
                >
                  <FontAwesomeIcon icon={faRedo} className="w-4 h-4 mr-2 inline" />
                  Reset
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop Filter Section */}
        <div className="hidden md:flex items-center justify-center gap-6 mb-6 px-4 w-full">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            title="Reset Filter"
          >
            <FontAwesomeIcon icon={faRedo} className="w-4 h-4 mr-2" />
            Reset
          </button>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-64 relative">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-16">Status</label>
            <div
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm cursor-pointer flex items-center justify-between"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
            >
              <span className="text-gray-700">
                {(filterStatus.length === 0 || filterStatus.length === statusOptions.length)
                  ? 'Semua Status'
                  : filterStatus.join(', ')
                }
              </span>
              <FontAwesomeIcon icon={faChevronDown} className={`text-gray-400 transition-transform duration-200 ${isStatusOpen ? 'transform rotate-180' : ''}`} />
            </div>
            {isStatusOpen && (
              <div className="absolute top-full mt-2 left-0 z-10 shadow-lg rounded-lg bg-white p-2 w-full">
                {statusOptions.map((status) => (
                  <label key={status} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md">
                    <input
                      type="checkbox"
                      checked={tempFilterStatus.includes(status)}
                      onChange={() => handleTempStatusChange(status)}
                      className="form-checkbox h-4 w-4 text-red-600"
                    />
                    <span>{status}</span>
                  </label>
                ))}
                <div className="p-2 border-t border-gray-200 mt-2">
                  <button
                    onClick={handleApplyStatusFilter}
                    className="w-full py-1.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    Oke
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 w-64 relative">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-16">Tanggal</label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                setDateRange(update);
                setCurrentPage(1);
              }}
              customInput={<CustomInput />}
            />
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length > 0 ? (
          <>
           <div className="grid w-full gap-6 grid-cols-1 md:grid-cols-4">
  {pagedReports.map((item) => (
    <div
      key={item.id}
      className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-md transition-shadow duration-300 cursor-pointer overflow-hidden"
      onClick={() => handleCardClick(item.id)}
    >
      {(() => {
        const photos = item.bukti_fotos || [];
        const firstFile = photos.length > 0 ? photos[0].photo_url : null;

        if (!firstFile) {
          return (
            <div className="w-full aspect-[3/2] bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
              <FontAwesomeIcon icon={faImage} />
            </div>
          );
        }

        // Cek apakah file adalah pdf
        const isPdf = firstFile.toLowerCase().endsWith('.pdf');

        return isPdf ? (
          <div className="w-full aspect-[3/2] bg-gray-200 flex items-center justify-center text-red-500 text-6xl">
            <FontAwesomeIcon icon={faFilePdf} />
          </div>
        ) : (
          <div className="w-full aspect-[3/2] overflow-hidden">
            <img
              src={`http://localhost:8080/${firstFile}`}
              alt="Foto laporan"
              className="w-full h-full object-cover object-center"
            />
          </div>
        );
      })()}

      <div className="p-4 flex flex-col justify-between">
        <div className="text-base font-semibold text-red-700 mb-2 line-clamp-1">
          {(item.title && item.title.trim().length > 0
            ? item.title.split(" ").slice(0, 3).join(" ")
            : "Tanpa Kategori") +
            ` di wilayah ${item.wilayah || "tidak diketahui"}`}
        </div>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="text-[15px] text-sm text-gray-500 flex items-center gap-2">
                      <FontAwesomeIcon icon={faUserCircle} />
                      {item.user?.name || 'Anonim'}
                    </div>
                    <div className="text-[9px] text-gray-400 mb-2 ml-5 flex flex-nowrap items-center space-x-2">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      <span className="text-gray-500 italic whitespace-nowrap">
                        Melalui Website Pengaduan
                      </span>
                    </div>
                    <div className="mt-auto pt-2">{renderStatusBadge(item.status)}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded border text-sm hover:bg-red-100 disabled:opacity-40"
                >
                  « Prev
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded border text-sm ${currentPage === i + 1
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-red-700 hover:bg-red-100'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded border text-sm hover:bg-red-100 disabled:opacity-40"
                >
                  Next »
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500 text-lg">
            Tidak ada riwayat aduan.
          </div>
        )}
      </div>
    </div>
  );
}

export default ListPengaduan;