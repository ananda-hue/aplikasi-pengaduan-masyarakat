import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo2.png';
import api from '../api';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 state toggle
  const [message] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.includes('@')) {
      Swal.fire({
        icon: 'error',
        title: 'Email tidak valid',
        text: 'Mohon masukkan alamat email yang benar',
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });
      return;
    }
    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        text: 'Password minimal 6 karakter',
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });
      return;
    }

    try {
      const res = await api.post('/auth/register', { name, email, password });

      await Swal.fire({
        icon: 'success',
        text: res.data.message || 'Akun berhasil dibuat, silakan login.',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });

      navigate('/login');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan, coba lagi',
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        {/* Header Form */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-20 h-20 object-contain mb-2" />
          <h3 className="text-2xl font-bold text-red-600 mb-1">Registrasi</h3>
          <p className="text-gray-600 text-sm mb-4">
            Silakan registrasi untuk membuat akun
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Nama */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nama
            </label>
            <input
              id="name"
              name="new-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="new-password"
                type={showPassword ? "text" : "password"} // 👈 toggle type
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

          {/* Pesan */}
          {message && <p className="text-red-600 text-sm mt-2">{message}</p>}

          {/* Tombol */}
          <button
            type="submit"
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-md transition"
          >
            Daftar
          </button>
        </form>

        {/* Link ke Login */}
        <p className="text-sm text-center mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
