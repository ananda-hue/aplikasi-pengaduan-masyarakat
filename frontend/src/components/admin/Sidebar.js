import { FaBars, FaTachometerAlt, FaFileAlt, FaUsers, FaSignOutAlt, FaList, FaUserCircle, FaCog } from 'react-icons/fa';
import { useState } from 'react';
import logo from '../../assets/logo.png';
import Swal from "sweetalert2";

const allMenuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { key: 'reports', label: 'Pengaduan', icon: <FaFileAlt /> },
  { key: 'categories', label: 'Kelola Kategori', icon: <FaList /> },
  { key: 'users', label: 'Kelola Pengguna', icon: <FaUsers /> },
  {
  key: "logout",
  label: "Keluar",
  icon: <FaSignOutAlt />,
  action: () => {
    Swal.fire({
      title: "Yakin ingin keluar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d63030ff",
      cancelButtonColor: "rgba(224, 217, 217, 1)",
      reverseButtons: true,
      customClass: {
        cancelButton: "swal-cancel-btn"
      },
      didOpen: () => {
        const cancelBtn = Swal.getCancelButton();
        if (cancelBtn) {
          cancelBtn.style.color = "black";   // teks jadi hitam
        }
      } 
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/login"; // langsung redirect tanpa popup berhasil
      }
    });
  },
}


];

function Sidebar({ currentPage, onNavigate, isOpen, toggleSidebar, allowedPages }) {
  const menuItems = allMenuItems.filter(item => allowedPages.includes(item.key) || item.key === 'logout');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="bg-red-700 text-white p-4 md:p-6 fixed top-0 left-0 right-0 z-40 shadow-lg flex items-center justify-between h-16 md:h-20">

        <FaBars
          className="text-xl cursor-pointer hover:text-red-200 transition-colors"
          onClick={toggleSidebar}
        />

        {/* Profile Icon */}
        <div className="relative pl-4">
          <FaUserCircle
            className="text-4xl cursor-pointer hover:text-red-200 transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Menu Akun</p>
                <p className="text-xs text-gray-500">Kelola profil Anda</p>
              </div>

              <button
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('akun-admin');
                }}
              >
                <FaCog className="mr-3 text-red-600" />
                Kelola Akun
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-red-700 text-white z-50 transition-all duration-300 shadow-xl ${isOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}>

        {/* Sidebar Title */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <img
              src={logo}
              alt="logo"
              className="w-16 h-16 object-cover"
            />
            {isOpen && (
              <span className="ml-3 text-xl font-bold text-white">Admin</span>
            )}
          </div>

          {/* Toggle button di dalam sidebar */}
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-red-200 transition-colors p-1 rounded"
            title="Tutup Sidebar"
          >
            <FaBars className="text-lg" />
          </button>
        </div>

        {/* Sidebar Menu */}
        <ul className="mt-4 space-y-1">
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                className={`w-full flex items-center px-4 py-3 transition-all duration-200 hover:bg-red-600 group ${currentPage === item.key
                    ? 'bg-red-800 border-r-4 border-white shadow-md'
                    : 'hover:shadow-md'
                  }`}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    onNavigate(item.key);
                  }
                }}
                title={!isOpen ? item.label : ''}
              >
                <span className={`text-lg ${currentPage === item.key ? 'text-white' : 'text-red-100 group-hover:text-white'
                  }`}>
                  {item.icon}
                </span>
                {isOpen && (
                  <span className={`ml-3 font-medium transition-colors ${currentPage === item.key ? 'text-white' : 'text-red-100 group-hover:text-white'
                    }`}>
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Overlay untuk mobile dan menutup dropdown */}
      {(isOpen || showProfileMenu) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => {
            toggleSidebar();
            setShowProfileMenu(false);
          }}
        />
      )}
    </>
  );
}

export default Sidebar;