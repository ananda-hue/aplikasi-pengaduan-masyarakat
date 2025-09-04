import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft } from "react-icons/fa";

const PasswordInput = ({ label, value, setValue, type, placeholder, show, setShow }) => {
  const toggleShow = () => setShow((prev) => ({ ...prev, [type]: !prev[type] }));
  return (
    <div className="mb-6">
      <label className="block mb-2 text-gray-700 font-semibold text-sm">
        {label}
      </label>
      <div className="relative">
        <input
          type={show[type] ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl
                     focus:ring-2 focus:ring-red-500 focus:border-red-500
                     outline-none transition-all duration-200
                     bg-gray-50 focus:bg-white text-gray-800
                     text-sm sm:text-base"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-4 top-1/2 transform -translate-y-1/2
                     text-gray-500 hover:text-red-600 transition-colors
                     focus:outline-none focus:text-red-600 p-1"
        >
          {show[type] ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default function Pengaturan() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profil");
  const [user, setUser] = useState(null);
  const [editData, setEditData] = useState({ name: "", email: "" });
  const [originalData, setOriginalData] = useState({ name: "", email: "" });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({
    password: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);

  const userID = sessionStorage.getItem("userID");
  const token = sessionStorage.getItem("token");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !userID) {
        return; // kalau token atau userID kosong, jangan fetch & jangan alert
      }

      try {
        setLoading(true);
        const res = await api.get(`/users/${userID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.data);
        const userData = { name: res.data.data.name, email: res.data.data.email };
        setEditData(userData);
        setOriginalData(userData);
      } catch (err) {
        console.error("Fetch user error:", err);
        // jangan pakai alert di sini, langsung redirect aja
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userID, token]);

  const handleCancel = () => {
    if (activeTab === "profil") {
      setEditData(originalData);
    } else {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleProfileSave = async () => {
    // Validasi field kosong
    if (!editData.name.trim() || !editData.email.trim()) {
      await Swal.fire({
        icon: 'error',
        title: 'Data Tidak Lengkap',
        text: 'Nama dan email tidak boleh kosong',
        customClass: { popup: 'font-sans' }
      });
      return;
    }

    // Validasi email harus menggunakan @gmail.com
    if (!editData.email.trim().endsWith('@gmail.com')) {
      await Swal.fire({
        icon: 'error',
        title: 'Email Tidak Valid',
        text: 'Email harus menggunakan domain @gmail.com',
        customClass: { popup: 'font-sans' }
      });
      return;
    }

    // Validasi format email yang benar
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(editData.email.trim())) {
      await Swal.fire({
        icon: 'error',
        title: 'Format Email Salah',
        text: 'Masukkan format email yang benar (contoh: nama@gmail.com)',
        customClass: { popup: 'font-sans' }
      });
      return;
    }

    try {
      setLoading(true);
      await api.put(
        `/users/${userID}`,
        { name: editData.name, email: editData.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Profil berhasil diperbarui',
        timer: 1000,
        showConfirmButton: false,
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });
      window.location.href = "/akun";
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal update profil',
        customClass: { popup: 'font-sans' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      await Swal.fire({
        icon: 'error',
        title: 'Semua field tidak boleh kosong',
        customClass: { popup: 'font-sans' }
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Konfirmasi Password Salah',
        customClass: { popup: 'font-sans' }
      });
      return;
    }

    if (newPassword.length < 6) {
      await Swal.fire({
        icon: 'error',
        title: 'Password Terlalu Pendek',
        text: 'Password baru minimal 6 karakter',
        customClass: { popup: 'font-sans' }
      });
      return;
    }

    try {
      setLoading(true);
      await api.put(
        "/users/password",
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // reset input
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Password berhasil diubah',
        timer: 1000,
        showConfirmButton: false,
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });

      // clear session & redirect pakai hard reload agar tidak ada error tambahan
      sessionStorage.clear();
      setLoading(false);
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);

    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Password lama tidak valid',
        customClass: { popup: 'font-sans' }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      {/* Tombol Kembali di Bawah Navbar */}
      <div className="w-full mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-white text-black p-3 rounded-full shadow-lg
               hover:bg-gray-50 hover:text-red-600 transition-all duration-200
               border border-gray-200"
        >
          <FaArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-visible">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4 mt-10">
              <FaUser className="text-white w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Pengaturan Akun
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Kelola informasi pribadi dan keamanan akun Anda
            </p>
          </div>

       {/* Main Card */}
<div className="bg-white rounded-2xl shadow-xl overflow-visible">
  {/* Tab Navigation */}
  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b">
    <div className="flex gap-1 sm:gap-2 bg-gray-200 p-1 rounded-xl">
      <button
        className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5
          rounded-lg font-medium transition-all duration-200 text-sm sm:text-base
          ${activeTab === "profil"
            ? "bg-white text-red-600 shadow-md"
            : "text-gray-600 hover:text-red-600 hover:bg-gray-100"
          }`}
        onClick={() => setActiveTab("profil")}
      >
        <FaUser className="text-sm" />
        <span className="hidden sm:inline">Edit Profil</span>
        <span className="sm:hidden">Profil</span>
      </button>
      <button
        className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5
          rounded-lg font-medium transition-all duration-200 text-sm sm:text-base
          ${activeTab === "password"
            ? "bg-white text-red-600 shadow-md"
            : "text-gray-600 hover:text-red-600 hover:bg-gray-100"
          }`}
        onClick={() => setActiveTab("password")}
      >
        <FaLock className="text-sm" />
        <span className="hidden sm:inline">Ubah Password</span>
        <span className="sm:hidden">Password</span>
      </button>
    </div>
  </div>

  {/* Tab Content */}
  <div className="p-4 sm:p-6 lg:p-8">
    {activeTab === "profil" && (
      <div className="space-y-6">
        <div>
          <label className="block mb-2 text-gray-700 font-semibold text-sm">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl
              focus:ring-2 focus:ring-red-500 focus:border-red-500
              outline-none transition-all duration-200
              bg-gray-50 focus:bg-white text-gray-800
              text-sm sm:text-base"
            placeholder="Masukkan nama lengkap"
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-700 font-semibold text-sm">
            Alamat Email
          </label>
          <input
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl
              focus:ring-2 focus:ring-red-500 focus:border-red-500
              outline-none transition-all duration-200
              bg-gray-50 focus:bg-white text-gray-800
              text-sm sm:text-base"
            placeholder="nama@gmail.com"
          />
          {/* Pesan bantuan untuk validasi email */}
          <p className="text-xs text-gray-500 mt-1">
            * Email harus menggunakan domain @gmail.com
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={handleCancel}
            className="sm:flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl
              hover:bg-gray-300 transition-all duration-200
              font-medium text-sm sm:text-base
              order-2 sm:order-1"
          >
            Batal
          </button>
          <button
            onClick={handleProfileSave}
            disabled={loading}
            className="sm:flex-1 bg-red-600 text-white px-6 py-3 rounded-xl
              hover:bg-red-700 disabled:bg-red-400
              transition-all duration-200 shadow-lg hover:shadow-xl
              font-medium text-sm sm:text-base
              order-1 sm:order-2
              disabled:cursor-not-allowed"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    )}

    {activeTab === "password" && (
      <div className="space-y-2">
        <PasswordInput
          label="Password Lama"
          value={oldPassword}
          setValue={setOldPassword}
          type={showOld ? "text" : "password"}
          placeholder="Masukkan password lama"
          show={showOld}
          setShow={setShowOld}
        />
        <PasswordInput
          label="Password Baru"
          value={newPassword}
          setValue={setNewPassword}
          type={showNew ? "text" : "password"}
          placeholder="Minimal 6 karakter"
          show={showNew}
          setShow={setShowNew}
        />
        <PasswordInput
          label="Konfirmasi Password Baru"
          value={confirmPassword}
          setValue={setConfirmPassword}
          type={showConfirm ? "text" : "password"}
          placeholder="Ulangi password baru"
          show={showConfirm}
          setShow={setShowConfirm}
        />

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Tips Keamanan:</strong> Gunakan kombinasi huruf besar, kecil, angka, dan simbol untuk password yang kuat.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={handleCancel}
            className="sm:flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl
              hover:bg-gray-300 transition-all duration-200
              font-medium text-sm sm:text-base
              order-2 sm:order-1"
          >
            Batal
          </button>
          <button
            onClick={handlePasswordSave}
            disabled={loading}
            className="sm:flex-1 bg-red-600 text-white px-6 py-3 rounded-xl
              hover:bg-red-700 disabled:bg-red-400
              transition-all duration-200 shadow-lg hover:shadow-xl
              font-medium text-sm sm:text-base
              order-1 sm:order-2
              disabled:cursor-not-allowed"
          >
            {loading ? "Mengubah..." : "Ubah Password"}
          </button>
        </div>
      </div>
    )}
  </div>
</div>
        </div>
      </div>
    </div>
  );
}