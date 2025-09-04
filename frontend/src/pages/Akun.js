import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import profilImage from "../assets/profil.png";
import akunVideo from "../assets/akun.mp4";
import api from "../api.js";
import { FaCog } from "react-icons/fa";
import Swal from "sweetalert2";

export default function Akun() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userID = sessionStorage.getItem("userID");
  const token = sessionStorage.getItem("token");

  // Fetch user
  useEffect(() => {
    if (!userID || !token) {
      setError("Anda harus login terlebih dahulu");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${userID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch user error:", err);
        setError("Gagal mengambil data user");
        setLoading(false);
      }
    };
    fetchUser();
  }, [userID, token]);

  const handleLogout = async () => {
  const result = await Swal.fire({
    text: 'Apakah Anda yakin ingin Keluar?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: {
      popup: 'font-sans',
      icon: 'swal2-icon-red'  // custom class untuk icon
    },
    width: 350,
    padding: '1rem',
    confirmButtonColor: '#dc2626',
  });

  if (result.isConfirmed) {
    sessionStorage.clear();
    navigate('/');
  }
};

  if (loading) return <p className="text-center py-10 text-gray-600">Loading data user...</p>;
  if (error) return <p className="text-center py-10 text-red-600">{error}</p>;

  return (
    <div className="pt-2 md:pt-12">
      <div className="max-w-5xl mx-auto bg-white border border-gray-300 rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Video kiri */}
        <div className="w-full md:w-1/2 h-[280px] md:h-auto">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src={akunVideo} type="video/mp4" />
            Loading
          </video>
        </div>

        {/* Konten kanan */}
        <div className="w-full md:w-1/2 px-4 py-4 md:p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-2">
            <img
              src={profilImage}
              alt="Avatar"
              className="w-24 h-24 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/100";
              }}
            />
          </div>

          {/* Username & Email */}
          <div className="text-center mb-4">
            <p className="text-xl font-semibold">{user?.name}</p>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          {/* Menu */}
          <div className="flex flex-col space-y-3 mt-6 items-center">
            <button
              onClick={() => navigate("/riwayat")}
              className="w-full max-w-xs bg-yellow-100 hover:bg-yellow-200 text-black py-2.5 rounded text-sm text-center transition"
            >
              📝 Laporan Saya
            </button>
            <button
              onClick={() => navigate("/pengaturan")}
              className="w-full max-w-xs bg-yellow-100 hover:bg-yellow-200 text-black py-2.5 rounded text-sm text-center transition flex items-center justify-center gap-2"
            >
              <FaCog size={14} /> Pengaturan
            </button>
            <button
              onClick={() => navigate("/bantuan")}
              className="w-full max-w-xs bg-yellow-100 hover:bg-yellow-200 text-black py-2.5 rounded text-sm text-center transition"
            >
              ❓ Bantuan
            </button>
          </div>

          {/* Logout */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLogout}
              className="w-full max-w-xs bg-red-700 hover:bg-red-800 text-white py-2.5 rounded text-sm text-center transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
