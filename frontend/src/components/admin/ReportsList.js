import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../api';
import Loader from '../common/Loader';

function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter mode states
  const [filterMode, setFilterMode] = useState('single'); // 'single' or 'range'
  const [singleMonth, setSingleMonth] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await api.get('/reports/filter', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('API Response:', res.data);
        setReports(res.data.data || res.data);
        setLoading(false);
      } catch (err) {
        console.error('Gagal mengambil data:', err);
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Generate month/year options starting from 2025 and automatically expand based on reports
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Start from 2025 as minimum
    let startYear = 2025;
    let endYear = Math.max(currentYear, 2025);
    
    // If we have reports data, check if there are reports in years beyond current range
    if (reports && reports.length > 0) {
      const reportYears = reports.map(report => {
        const reportDate = new Date(report.created_at);
        return reportDate.getFullYear();
      });
      
      const minReportYear = Math.min(...reportYears);
      const maxReportYear = Math.max(...reportYears);
      
      // Expand range if needed, but never go below 2025
      startYear = Math.max(2025, minReportYear);
      endYear = Math.max(currentYear, maxReportYear);
    }
    
    // Generate options for the determined year range (start from January, ascending order)
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        // Don't show future months for current year
        if (year === currentYear && month > currentMonth) {
          continue;
        }
        
        const monthStr = month.toString().padStart(2, '0');
        const value = `${year}-${monthStr}`;
        const label = new Date(`${year}-${monthStr}-01`).toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric',
        });
        
        options.push({ value, label });
      }
    }
    
    return options;
  };

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500 text-center my-4">{error}</p>;

  // Generate month options after data is loaded
  const monthOptions = generateMonthOptions();

  // Remove duplicates by id
  const uniqueReports = Array.from(new Set(reports.map((r) => r.id))).map(id => {
    return reports.find(r => r.id === id);
  });

  // Helper function to check if date falls within filter
  const isDateInFilter = (dateString) => {
    const reportDate = new Date(dateString);
    const reportYear = reportDate.getFullYear();
    const reportMonth = (reportDate.getMonth() + 1).toString().padStart(2, '0');
    const reportYearMonth = `${reportYear}-${reportMonth}`;
    
    if (filterMode === 'single') {
      return !singleMonth || reportYearMonth === singleMonth;
    } else {
      // Range mode
      if (!startMonth && !endMonth) return true;
      
      let inRange = true;
      
      if (startMonth) {
        inRange = inRange && reportYearMonth >= startMonth;
      }
      
      if (endMonth) {
        inRange = inRange && reportYearMonth <= endMonth;
      }
      
      return inRange;
    }
  };

  const filteredReports = uniqueReports
    .filter((r) => {
      const matchesStatus = filterStatus
        ? r.status.toLowerCase() === filterStatus.toLowerCase()
        : true;
      const matchesSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.user?.name && r.user.name.toLowerCase().includes(search.toLowerCase()));
      const matchesDateFilter = isDateInFilter(r.created_at);
      
      return matchesStatus && matchesSearch && matchesDateFilter;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // Helper: status colors
  const statusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'diajukan': return 'bg-yellow-100 text-yellow-800';
      case 'diproses': return 'bg-blue-100 text-blue-800';
      case 'selesai': return 'bg-green-100 text-green-800';
      case 'ditolak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Reset date filters
  const resetDateFilters = () => {
    setSingleMonth('');
    setStartMonth('');
    setEndMonth('');
    setCurrentPage(1);
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    setFilterMode(mode);
    // Reset all date filters when switching modes
    setSingleMonth('');
    setStartMonth('');
    setEndMonth('');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-black text-center sm:text-left">Daftar Pengaduan</h2>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Search and Status Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Cari judul atau nama pelapor"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

          <select
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Semua Status</option>
            <option value="Diajukan">Diajukan</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        {/* Date Filter Section */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          {/* Filter Mode Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter Waktu:
            </label>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange('single')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  filterMode === 'single'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pilih 1 Bulan
              </button>
              <button
                onClick={() => handleModeChange('range')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  filterMode === 'range'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Rentang Waktu
              </button>
            </div>
          </div>

          {/* Single Month Filter */}
          {filterMode === 'single' && (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <select
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-48"
                value={singleMonth}
                onChange={(e) => {
                  setSingleMonth(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Pilih Bulan</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {singleMonth && (
                <button
                  onClick={resetDateFilters}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* Range Filter */}
          {filterMode === 'range' && (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex flex-col sm:flex-row gap-2 items-center flex-1">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={startMonth}
                  onChange={(e) => {
                    setStartMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Dari Bulan</option>
                  {monthOptions.map((option) => (
                    <option key={`start-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <span className="text-gray-500 text-sm">sampai</span>

                <select
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={endMonth}
                  onChange={(e) => {
                    setEndMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Sampai Bulan</option>
                  {monthOptions.map((option) => (
                    <option key={`end-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(startMonth || endMonth) && (
                <button
                  onClick={resetDateFilters}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(singleMonth || startMonth || endMonth || filterStatus || search) && (
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <span className="font-medium">Filter aktif: </span>
            {search && <span className="mr-2">Pencarian: "{search}"</span>}
            {filterStatus && <span className="mr-2">Status: {filterStatus}</span>}
            {singleMonth && (
              <span className="mr-2">
                Bulan: {monthOptions.find(opt => opt.value === singleMonth)?.label}
              </span>
            )}
            {startMonth && !endMonth && <span className="mr-2">Dari: {monthOptions.find(opt => opt.value === startMonth)?.label}</span>}
            {!startMonth && endMonth && <span className="mr-2">Sampai: {monthOptions.find(opt => opt.value === endMonth)?.label}</span>}
            {startMonth && endMonth && (
              <span className="mr-2">
                Periode: {monthOptions.find(opt => opt.value === startMonth)?.label} - {monthOptions.find(opt => opt.value === endMonth)?.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-none shadow">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-red-600">
            <tr>
              {['Judul', 'Pelapor', 'Kategori', 'Wilayah', 'Tanggal Aduan', 'Status'].map((head) => (
                <th
                  key={head}
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  Tidak ada pengaduan ditemukan.
                </td>
              </tr>
            ) : (
              currentReports.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/reports/${r.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/admin/reports/${r.id}`);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {r.title.length > 20
                      ? r.title.substring(0, 30) + ' .....'
                      : r.title}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {r.user?.name || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.category?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.wilayah}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {new Date(r.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <span
                      className={`inline-block px-4 py-2 text-sm font-bold rounded-full ${statusColor(
                        r.status
                      )} ml-3`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2 flex-wrap">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md border ${currentPage === 1
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-100'
              }`}
          >
            « Previous
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md border ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-700 hover:bg-indigo-50'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md border ${currentPage === totalPages
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-100'
              }`}
          >
            Next »
          </button>
        </div>
      )}
    </div>
  );
}

export default ReportsList;