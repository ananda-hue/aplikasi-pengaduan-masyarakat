import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { RiAccountCircle2Line } from 'react-icons/ri';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/logo2.png';
import Swal from 'sweetalert2';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [animateLogo, setAnimateLogo] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState('');
  const dropdownRef = useRef(null);
  

  useEffect(() => {
    const nameFromStorage = sessionStorage.getItem('userName');
    if (nameFromStorage !== userName) {
      setUserName(nameFromStorage || '');
    }
  }, [location.pathname, userName]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true' && location.pathname === '/') {
      setAnimateLogo(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        setAnimateLogo(false);
        document.body.style.overflow = '';
        sessionStorage.removeItem('justLoggedIn');
      }, 2500);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path) =>
    location.pathname === path
      ? 'text-yellow-300 font-semibold no-underline'
      : 'text-white hover:text-yellow-300 no-underline';

  const handleLogout = () => {
        sessionStorage.clear();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const handleLogoutConfirm = async () => {
  const result = await Swal.fire({
    text: 'Apakah Anda yakin ingin keluar?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: { popup: 'font-sans' },
    width: 350,
    padding: '1rem',
    confirmButtonColor: '#dc2626', // merah red-600
  });

 if (result.isConfirmed) {
    sessionStorage.clear();
    setDropdownOpen(false);
    setMenuOpen(false);
    isLoggedIn(false);  // 🔥 reset state biar Navbar re-render
    navigate('/');
  }
};


  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-gray-600/60 backdrop-blur-md shadow-md' : 'bg-red-700'} text-white`}>
        <div className="w-full py-2 flex items-center px-6 lg:px-20 relative">
          {/* Logo + nama di kiri */}
          <Link to="/" className="flex items-center gap-2 mr-auto relative no-underline">
            <img
              src={logo}
              alt="Logo"
              className="w-14 h-12 lg:w-20 lg:h-20 object-contain"
            />
            <span
              className="text-xl font-bold text-white whitespace-nowrap no-underline"
              style={{ fontFamily: "'Merienda', cursive" }}
            >
              LaporPak!
            </span>
          </Link>

          {/* Hamburger di kanan (hanya mobile) */}
          <div className="lg:hidden ml-auto">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Menu desktop */}
          <div className="hidden lg:flex items-center space-x-8 text-sm font-medium ml-auto">
            <Link to="/" className={isActive('/')}>BERANDA</Link>
            <Link to="/tentang" className={isActive('/tentang')}>TENTANG KAMI</Link>
            {isLoggedIn && (
              <>
                {/* <Link to="/pengaduan" className={isActive('/pengaduan')}>FORM PENGADUAN</Link> */}
                <Link to="/daftar" className={isActive('/daftar')}>DAFTAR PENGADUAN</Link>
                <div className="relative flex items-center gap-2" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="hover:text-yellow-300 text-white flex items-center"
                  >
                    <RiAccountCircle2Line size={36} />
                    {userName && (
                      <span className="ml-2 text-white font-semibold text-sm hidden xl:inline">
                        {userName}
                      </span>
                    )}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-36 bg-white text-sm text-gray-700 shadow-md rounded-md z-50">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/akun');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Akun Saya
                      </button>
                      <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {!isLoggedIn && (
              <Link to="/login" className="px-3 py-1 rounded bg-white text-red-600 hover:bg-yellow-300 font-semibold no-underline">
                MASUK
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            className={`lg:hidden px-4 py-4 space-y-4 text-sm font-semibold flex flex-col transition-all duration-300 ${scrolled
                ? "backdrop-blur-md bg-gray/5 shadow-md text-white"
                : "bg-red-700 text-white"
              }`}
          >
            <Link to="/" onClick={() => setMenuOpen(false)} className={isActive('/')}>
              BERANDA
            </Link>
            <Link to="/tentang" onClick={() => setMenuOpen(false)} className={isActive('/tentang')}>
              TENTANG KAMI
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/daftar" onClick={() => setMenuOpen(false)} className={isActive('/daftar')}>
                  DAFTAR PENGADUAN
                </Link>
                <div
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/akun");
                  }}
                  className="flex items-center gap-2 hover:text-yellow-300"
                >
                  <RiAccountCircle2Line size={32} />
                  <span>{userName}</span>
                </div>
                <button
                   onClick={handleLogoutConfirm}
                  className="w-fit px-4 py-1 rounded bg-white text-red-600 hover:bg-yellow-300 font-semibold"
                >
                  KELUAR
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-fit px-4 py-1 rounded bg-white text-red-600 hover:bg-yellow-300 font-semibold"
              >
                MASUK
              </Link>
            )}
          </div>
        )}

      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Konfirmasi Logout</h2>
            <p className="text-sm text-gray-600 mb-6">Apakah Anda yakin ingin keluar?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
