import React, { useEffect, useState } from 'react';
import api from '../../api';
import Loader from '../common/Loader';
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';

// Warna yang sama seperti sebelum
const COLORS = ['#ffc107', '#dc3545', '#0d6efd', '#198754'];
const colors = ['#fd7e14', '#6f42c1', '#20c997', '#e83e8c'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [donutData, setDonutData] = useState([]);

  // Parsing data user dari sessionStorage
  const role = sessionStorage.getItem('role')?.toLowerCase();
  const categoryIdsStr = sessionStorage.getItem('categoryIds');

  let categoryIds = [];
  if (categoryIdsStr) {
    try {
      categoryIds = JSON.parse(categoryIdsStr);
    } catch (e) {
      console.error('Error parsing category_ids:', e);
      categoryIds = [];
    }
  }

  const isAdminWithCategories = role === 'admin' && categoryIds.length > 0;

  useEffect(() => {
    if (!stats) return;

    const fetchTrends = async () => {
      const token = sessionStorage.getItem('token');
      try {
        const monthRes = await api.get('/admin/report-trends?period=month', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const monthData = monthRes.data.data;
        if (monthData && monthData.reports) {
          const monthlyCombined = monthData.reports.map((r, i) => ({
            Period: r.Period,
            Laporan: r.Count,
            Komentar: monthData.comments[i]?.Count || 0,
            TindakLanjut: monthData.followups[i]?.Count || 0,
          }));
          setMonthlyTrend(monthlyCombined);
        } else {
          console.error("No reports found in monthly data");
        }

        const weekRes = await api.get('/admin/report-trends?period=week', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const weekData = weekRes.data.data;
        if (weekData && weekData.reports) {
          const weeklyCombined = weekData.reports.map((r, i) => ({
            Period: r.Period,
            Laporan: r.Count,
            Komentar: weekData.comments[i]?.Count || 0,
            TindakLanjut: weekData.followups[i]?.Count || 0,
          }));
          setWeeklyTrend(weeklyCombined);
        } else {
          console.error("No reports found in weekly data");
        }
      } catch (error) {
        console.error("Error fetching trends:", error);
      }
    };

    fetchTrends();
  }, [stats]);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await api.get('/admin/by-category', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Category Stats:", res.data.data);
        setCategoryStats(res.data.data || []);
      } catch (err) {
        console.error("Gagal fetch category stats", err);
        setCategoryStats([]);
      }
    };

    fetchCategoryStats();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await api.get('/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
        setLoading(false);
      } catch (err) {
        setError('Gagal mengambil data statistik');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (stats) {
      setDonutData([
        { name: 'Komentar', value: stats.comment_count || 0 },
        { name: 'Tindak Lanjut', value: stats.followup_count || 0 },
      ]);
    }
  }, [stats]);

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

  const pieData = [
    { name: 'Diajukan', value: Number(stats.pending_reports || 0) },
    { name: 'Ditolak', value: Number(stats.rejected_reports || 0) },
    { name: 'Diproses', value: Number(stats.processing_reports || 0) },
    { name: 'Selesai', value: Number(stats.done_reports || 0) },
  ];

  let data = [
    { name: 'Pengguna', jumlah: stats.user_count || 0, icon: 'fas fa-users', color: COLORS[0] },
    { name: 'Pengaduan', jumlah: stats.report_count || 0, icon: 'fas fa-file-alt', color: COLORS[1] },
    { name: 'Admin', jumlah: stats.admin_count || 0, icon: 'fas fa-user-shield', color: COLORS[2] },
    { name: 'User', jumlah: stats.user_regular_count || 0, icon: 'fas fa-user', color: COLORS[3] },
  ];

  // Filter data untuk admin dengan kategori - hanya tampilkan pengaduan
  if (isAdminWithCategories) {
    data = data.filter(item => item.name === 'Pengaduan' || item.name === 'Pengguna');
  }

  const aggregatedCategoryStats = categoryStats.reduce((acc, item) => {
    const category = item.kategori || item.Kategori || item.name || 'Unknown';
    const count = Number(item.count || item.Count) || 0;
    if (acc[category]) {
      acc[category] += count;
    } else {
      acc[category] = count;
    }
    return acc;
  }, {});

  const aggregatedData = Object.entries(aggregatedCategoryStats).map(([Kategori, Count]) => ({ Kategori, Count }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Admin</h2>

      {/* Stats Cards */}
      <div className={`grid gap-6 mb-8 ${data.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {data.map((item, i) => (
          <div
            key={i}
            className="rounded-lg shadow-md p-6 text-white flex flex-col items-center justify-center hover:scale-105 transition-transform duration-200"
            style={{ backgroundColor: item.color }}
          >
            <div className="text-5xl mb-3">
              <i className={item.icon} aria-hidden="true"></i>
            </div>
            <p className="text-lg font-medium">{item.name}</p>
            <p className="text-2xl font-bold">{item.jumlah}</p>
          </div>
        ))}
      </div>

      {/* Charts Container */}
      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-2">
        {/* Chart Statistik Pengguna - hanya untuk admin tanpa kategori atau super admin */}
        {!isAdminWithCategories && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Statistik Pengguna</h3>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                    {data.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        )}

        {/* Chart Laporan per Kategori - hanya untuk admin tanpa kategori atau super admin */}
        {!isAdminWithCategories && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Laporan per Kategori</h3>
            {aggregatedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregatedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="Kategori" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                    {aggregatedData.map((item, index) => (
                      <Cell key={`bar-cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        )}

        {/* Distribusi Status Pengaduan - semua admin bisa lihat */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Distribusi Status Pengaduan</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Perbandingan Komentar & Tindak Lanjut - semua admin bisa lihat */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Perbandingan Komentar & Tindak Lanjut</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-donut-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tren Aktivitas Mingguan - semua admin bisa lihat */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tren Aktivitas Mingguan</h3>
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...weeklyTrend].reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Period" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Line
                  type="monotone"
                  dataKey="Laporan"
                  stroke="#d9534f"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#d9534f' }}
                  activeDot={{ r: 6, fill: '#d9534f' }}
                />
                <Line
                  type="monotone"
                  dataKey="Komentar"
                  stroke="#0275d8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0275d8' }}
                  activeDot={{ r: 6, fill: '#0275d8' }}
                />
                <Line
                  type="monotone"
                  dataKey="TindakLanjut"
                  stroke="#5cb85c"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#5cb85c' }}
                  activeDot={{ r: 6, fill: '#5cb85c' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Belum ada data mingguan</p>
          )}
        </div>

        {/* Tren Aktivitas Bulanan - semua admin bisa lihat */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tren Aktivitas Bulanan</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={[...monthlyTrend].reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Period" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Area type="monotone" dataKey="Laporan" stackId="1" stroke="#f7c948" fill="#f7c948" fillOpacity={0.8} />
                <Area type="monotone" dataKey="Komentar" stackId="1" stroke="#ea6468" fill="#ea6468" fillOpacity={0.8} />
                <Area type="monotone" dataKey="TindakLanjut" stackId="1" stroke="#5185f7" fill="#5185f7" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Belum ada data bulanan</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;