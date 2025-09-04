import { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import Sidebar from '../components/admin/Sidebar';
import Dashboard from '../components/admin/Dashboard';
import ReportsList from '../components/admin/ReportsList';
import DetailReportAdmin from '../components/admin/DetailPengaduan';
import UsersManagement from '../components/admin/UsersManagement';
import EditUser from '../components/admin/EditUser';
import KelolaKategori from '../components/admin/KelolaKategori';
import AkunAdmin from '../components/admin/AkunAdmin'; // Import AkunAdmin

import '../style.css';

function AdminPage() {
  // Sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Ambil role & categoryId dari sessionStorage
  const role = sessionStorage.getItem('role')?.trim();
  const categoryIdsStr = sessionStorage.getItem('categoryIds');
  const categoryIds = categoryIdsStr ? JSON.parse(categoryIdsStr) : [];
  const hasCategory = Array.isArray(categoryIds) && categoryIds.length > 0;

  const isSuperAdmin = role === 'superadmin';
  const isRegularAdmin = role === 'admin';

  const isAdminWithCategory = isRegularAdmin && hasCategory;
  const isAdminWithoutCategory = isRegularAdmin && !hasCategory;

  let allowedPages = [];
  if (isSuperAdmin) {
    allowedPages = ['dashboard', 'reports', 'users', 'categories', 'notifications', 'akun-admin'];
  } else if (isAdminWithoutCategory) {
    allowedPages = ['dashboard', 'reports', 'users', 'categories', 'akun-admin']; // full access
  } else if (isAdminWithCategory) {
    allowedPages = ['dashboard', 'reports', 'akun-admin']; // limited access
  } else {
    allowedPages = ['dashboard'];
  }

  // Fungsi navigasi dari sidebar dengan cek akses
  const handleNavigate = (page) => {
    if (!allowedPages.includes(page)) {
      alert('Anda tidak memiliki akses ke halaman ini.');
      return;
    }

    switch (page) {
      case 'dashboard':
        navigate('/admin/dashboard');
        break;
      case 'reports':
        navigate('/admin/reports');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'categories':
        navigate('/admin/categories');
        break;
      case 'akun-admin':
        navigate('/admin/akun-admin');
        break;
      case 'profile':
        navigate('/admin/profile');
        break;
      case 'notifications':
        navigate('/admin/notifications');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Mode modal edit user
  const isEditUserModal = location.pathname.startsWith('/admin/users/edit/');
  const userIdMatch = location.pathname.match(/^\/admin\/users\/edit\/(\d+)$/);
  const editingUserId = userIdMatch ? userIdMatch[1] : null;
  const closeModal = () => {
    navigate('/admin/users');
  };

  return (
    <div className={`admin-layout ${isEditUserModal ? 'modal-open' : ''}`}>
      <Sidebar
        currentPage={location.pathname.split('/')[2] || 'dashboard'}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        allowedPages={allowedPages}
      />
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<ReportsList />} />
          <Route path="reports/:id" element={<DetailReportAdmin />} />

          {isSuperAdmin || isAdminWithoutCategory ? (
            <Route path="users" element={<UsersManagement />} />
          ) : (
            <Route path="users" element={<p>Tidak ada akses</p>} />
          )}

          {isSuperAdmin || isAdminWithoutCategory ? (
            <Route path="categories" element={<KelolaKategori />} />
          ) : (
            <Route path="categories" element={<p>Tidak ada akses</p>} />
          )}

          {/* Route untuk AkunAdmin - semua admin bisa akses */}
          <Route path="akun-admin" element={<AkunAdmin />} />

          <Route
            path="users/edit/:id"
            element={null} // Kosong agar React Router mengenali route tanpa render konten
          />

          {/* Profile ada pada semua yang boleh akses */}
          {allowedPages.includes('profile') ? (
            <Route path="profile" element={<p>Halaman profil belum tersedia.</p>} />
          ) : (
            <Route path="profile" element={<p>Tidak ada akses</p>} />
          )}

          <Route index element={<Dashboard />} />
          <Route path="*" element={<p>Halaman tidak ditemukan.</p>} />
        </Routes>
      </main>

      {/* Modal EditUser */}
      {isEditUserModal && editingUserId && (
        <div className="modal-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <EditUser userId={editingUserId} onClose={closeModal} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;