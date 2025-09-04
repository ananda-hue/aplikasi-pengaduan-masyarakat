import { useState, useEffect } from 'react';
import { FaEnvelope, FaEdit, FaEye, FaEyeSlash, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import api from '../../api';
import profilImage from "../../assets/profil.png";
import Swal from 'sweetalert2';

function AkunAdmin({ sidebarOpen }) {
  const [activeTab, setActiveTab] = useState('name');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // State untuk menyimpan data user yang sedang login
  const [currentUser, setCurrentUser] = useState({
    name: '',
    email: '',
  });

  // State untuk form data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch data user yang sedang login
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const userID = sessionStorage.getItem("userID");
    const token = sessionStorage.getItem("token");

    if (!userID || !token) {
      alert('Anda harus login terlebih dahulu');
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      // Menggunakan endpoint yang sama seperti di komponen Akun
      const response = await api.get(`/users/${userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Sesuaikan dengan struktur response dari backend
      const userData = response.data.data || response.data;

      setCurrentUser({
        name: userData.name || '',
        email: userData.email || '',
      });

      // Set initial form data - kosongkan input nama dan email baru
      setProfileData(prev => ({
        ...prev,
        name: '', // Kosongkan nama baru
        email: '', // Kosongkan email baru
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Gagal mengambil data profil';
      alert(errorMessage);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveName = async (e) => {
    e.preventDefault();

    if (!profileData.name.trim()) {
      alert('Nama tidak boleh kosong!');
      return;
    }

    const userID = sessionStorage.getItem("userID");
    const token = sessionStorage.getItem("token");

    try {
      setLoading(true);
      // Menggunakan endpoint yang sama seperti di komponen Akun
      const response = await api.put(`/users/${userID}`, {
        name: profileData.name.trim(),
        email: currentUser.email // Keep current email
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.data) {
        // Update state dengan data dari response
        const updatedUser = {
          name: response.data.user?.name || profileData.name.trim(),
          email: response.data.user?.email || currentUser.email,
        };

        setCurrentUser(updatedUser);
        alert('Nama berhasil diperbarui!');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Gagal memperbarui nama';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();

    if (!profileData.email.trim()) {
      alert('Email tidak boleh kosong!');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      alert('Format email tidak valid!');
      return;
    }

    const userID = sessionStorage.getItem("userID");
    const token = sessionStorage.getItem("token");

    try {
      setLoading(true);
      // Menggunakan endpoint yang sama seperti di komponen Akun
      const response = await api.put(`/users/${userID}`, {
        name: currentUser.name, // Keep current name
        email: profileData.email.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.data) {
        // Update state dengan data dari response
        const updatedUser = {
          name: response.data.user?.name || currentUser.name,
          email: response.data.user?.email || profileData.email.trim(),
        };

        setCurrentUser(updatedUser);
        alert('Email berhasil diperbarui!');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Gagal memperbarui email';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
  e.preventDefault();

  // Validasi input
  if (!profileData.currentPassword) {
    await Swal.fire({
      icon: 'warning',
      text: 'Password saat ini harus diisi!',
      customClass: { popup: 'font-sans' },
      confirmButtonColor: '#dc2626',
      width: 350,
      padding: '1rem',
    });
    return;
  }

  if (!profileData.newPassword) {
    await Swal.fire({
      icon: 'warning',
      text: 'Password baru harus diisi!',
      customClass: { popup: 'font-sans' },
      confirmButtonColor: '#dc2626',
      width: 350,
      padding: '1rem',
    });
    return;
  }

  if (profileData.newPassword !== profileData.confirmPassword) {
    await Swal.fire({
      icon: 'warning',
      text: 'Konfirmasi password salah!',
      customClass: { popup: 'font-sans' },
      confirmButtonColor: '#dc2626',
      width: 350,
      padding: '1rem',
    });
    return;
  }

  if (profileData.newPassword.length < 6) {
    await Swal.fire({
      icon: 'warning',
      text: 'Password baru minimal 6 karakter!',
      customClass: { popup: 'font-sans' },
      confirmButtonColor: '#dc2626',
      width: 350,
      padding: '1rem',
    });
    return;
  }

  const token = sessionStorage.getItem("token");

  try {
    setLoading(true);
    await api.put(
      "/users/password",
      {
        old_password: profileData.currentPassword,
        new_password: profileData.newPassword,
        confirm_password: profileData.confirmPassword,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await Swal.fire({
      icon: 'success',
      text: 'Password berhasil diubah!',
      timer: 1000,
      showConfirmButton: false,
      customClass: { popup: 'font-sans' },
      width: 300,
      padding: '1rem',
    });

    // Kosongkan field
    setProfileData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));

    // Kosongkan session agar user dianggap null
    sessionStorage.clear();

    // Hard reload ke halaman login → user state reset, tidak trigger fetch user
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);

  } catch (error) {
    console.error('Error changing password:', error);
    const errorMessage = error.response?.data?.error ||
      error.response?.data?.message ||
      'Gagal mengubah password';
    await Swal.fire({
      icon: 'error',
      text: errorMessage,
      customClass: { popup: 'font-sans' },
      width: 350,
      padding: '1rem',
      confirmButtonColor: '#dc2626',
    });
  } finally {
    setLoading(false);
  }
};


  const tabs = [
    { id: 'name', label: 'Edit Nama', icon: <FaEdit /> },
    { id: 'email', label: 'Edit Email', icon: <FaEnvelope /> },
    { id: 'password', label: 'Ubah Password', icon: <FaEdit /> }
  ];

  if (loadingProfile) {
    return (
      <div className={`p-6 bg-gray-50 min-h-screen pt-20 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-red-700" />
          <span className="ml-3 text-lg">Memuat data profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      // className={` min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-30' : 'ml-8'}
       className={` min-h-screen transition-all duration-300 ${sidebarOpen ? '' : ''}
 }`}
    >
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Kelola Akun Admin</h1>
        <div className="mt-4">
          <div className="max-w-5xl text-center">
            {/* Header */} {/* Avatar */}
            <div className="flex justify-center mb-1 md:mb-2">
  <img
    src={profilImage}
    alt="Avatar"
    className="w-24 h-24 object-cover rounded-full" // rounded-full untuk bentuk lingkaran
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "https://via.placeholder.com/100";
    }}
  />
</div>

            <p className="text-lg font-semibold text-gray-800">{currentUser.name}</p>
            <p className="text-gray-600">{currentUser.email}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 mt-20">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 whitespace-nowrap font-medium transition-colors ${activeTab === tab.id
                    ? 'border-b-2 border-red-700 text-red-700 bg-red-50'
                    : 'text-gray-500 hover:text-red-600 hover:bg-gray-50'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Edit Name Tab */}
          {activeTab === 'name' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Nama</h2>
              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Saat Ini
                  </label>
                  <input
                    type="text"
                    value={currentUser.name}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Baru
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan nama baru"
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Nama minimal 1 karakter
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setProfileData(prev => ({ ...prev, name: currentUser.name }))}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors flex items-center"
                    disabled={loading}
                  >
                    <FaTimes className="mr-2" />
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors flex items-center disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                    {loading ? 'Menyimpan...' : 'Simpan Nama'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Email Tab */}
          {activeTab === 'email' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Email</h2>
              <form onSubmit={handleSaveEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Saat Ini
                  </label>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Baru
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan email baru"
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Pastikan format email valid
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setProfileData(prev => ({ ...prev, email: currentUser.email }))}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors flex items-center"
                    disabled={loading}
                  >
                    <FaTimes className="mr-2" />
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors flex items-center disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                    {loading ? 'Menyimpan...' : 'Simpan Email'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ubah Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ubah Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={profileData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Masukkan password saat ini"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={profileData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Masukkan password baru"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={profileData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Konfirmasi password baru"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Syarat Password:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Minimal 6 karakter</li>
                    <li>• Berbeda dengan password lama</li>
                  </ul>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setProfileData(prev => ({
                      ...prev,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    }))}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors flex items-center"
                    disabled={loading}
                  >
                    <FaTimes className="mr-2" />
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors flex items-center disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                    {loading ? 'Mengubah...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AkunAdmin;