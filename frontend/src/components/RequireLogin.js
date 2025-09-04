import { useLocation } from 'react-router-dom';
import logo from '../assets/logo.png'; // pastikan path sesuai
import '../App.css';

function RequireLogin({ children }) {
  const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
  const userRole = sessionStorage.getItem('role');
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <div className="require-login-container">
        <img src={logo} alt="Logo" className="require-logo" />
        <h2 className="require-login-title">🚫 Akses Ditolak</h2>
        <p className="require-login-message">Silakan login untuk melihat halaman ini.</p>
        <a href="/login" className="require-login-button">
          Ke Halaman Login
        </a>
      </div>
    );
  }

  if (location.pathname.startsWith('/admin') && userRole !== 'admin') {
    return (
      <div className="access-denied-container">
        <img src={logo} alt="Logo" className="access-denied-logo" />
        <h3 className="access-denied-title">🚫 Akses Ditolak</h3>
        <p className="access-denied-message">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <a href="/" className="access-denied-button">
          Ke Halaman Beranda
        </a>
      </div>
    );
  }

  return children;
}

export default RequireLogin;
