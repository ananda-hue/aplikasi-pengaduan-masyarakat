import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { jwtDecode } from 'jwt-decode';
import logo from '../assets/logo2.png';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 state untuk toggle password
  const [message] = useState('');

  // Kosongkan input setiap kali user membuka halaman login
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.includes('@')) {
      Swal.fire({
        icon: 'error',
        title: 'Email tidak valid',
        text: 'Mohon masukkan alamat email yang benar',
        customClass: { popup: 'font-sans' }
      });
      return;
    }

    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.token;

      const decoded = jwtDecode(token);
      const role = decoded.role ? decoded.role.trim().toLowerCase() : '';
      const categoryIds = Array.isArray(decoded.category_ids) ? decoded.category_ids : [];
      const fallbackName = decoded.name || decoded.username || decoded.email || 'User';

      let finalName = fallbackName;
      try {
        const userRes = await api.get(`/users/${decoded.user_id}`);
        if (userRes.data?.Data?.name) {
          finalName = userRes.data.Data.name;
        }
      } catch (err) {
        console.warn('Gagal ambil nama dari DB, pakai default:', fallbackName);
      }

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('loggedIn', 'true');
      sessionStorage.setItem('justLoggedIn', 'true');
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('userID', decoded.user_id);
      sessionStorage.setItem('categoryIds', JSON.stringify(categoryIds));
      sessionStorage.setItem('userName', finalName);

      await Swal.fire({
        icon: 'success',
        title: 'Berhasil Login!',
        timer: 1000,
        showConfirmButton: false,
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });

      if (role === 'superadmin') {
        navigate('/admin?page=dashboard');
      } else if (role === 'admin' && categoryIds !== null) {
        navigate('/admin?page=dashboard');
      } else if (role === 'admin') {
        navigate('/admin?page=dashboard');
      } else {
        window.location.href = '/?justLoggedIn=true';
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: 'Password yang Anda masukkan salah',
        customClass: { popup: 'font-sans' }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-[480px] border border-gray-200">
        <div className="flex flex-col items-center">
          <img src={logo} alt="Logo" className="w-20 h-20 object-contain mb-4" />
          <h3 className="text-2xl font-bold text-red-600 mb-1">Masuk</h3>
          <p className="text-gray-600 text-sm mb-6">
            Silakan masuk jika sudah punya akun
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="new-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"} // 👈 toggle type
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {message && <p className="text-red-600 text-sm mt-2">{message}</p>}

          <div className="text-left text-sm">
            <Link to="/forgot-password" className="text-black hover:underline">
              Lupa password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-md transition"
          >
            Masuk
          </button>
        </form>

        <div className="my-6 border-t border-gray-200"></div>

        <button className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm">
          Login dengan Google
        </button>

        <p className="text-sm text-center mt-6">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
