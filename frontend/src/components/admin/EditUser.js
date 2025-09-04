import React, { useEffect, useState } from 'react';
import api from '../../api';
import Loader from '../common/Loader';

function EditUser({ userId, onClose }) {
  const id = userId;

  // Role dari session
  const rawRole = sessionStorage.getItem('role') || '';
  const rawCategory = sessionStorage.getItem('adminCategory') || '';
  const role = rawRole.trim();
  const adminCategory = rawCategory.trim();

  const isSuperAdmin = role === 'superadmin' || (role === 'admin' && adminCategory === '');

  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
  });

  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const data = res.data.data;
        setUser({
          name: data.name || '',
          email: data.email || '',
          role: data.role || '',
        });
      } catch {
        alert('Gagal mengambil data user');
      }
    };

    fetchUser().finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.name || !user.email || !user.role) {
      alert('Semua field wajib diisi');
      return;
    }

    try {
      const response = await api.put(`/users/${id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
      });

      console.log('Update response:', response.data);
      alert('User berhasil diupdate');
      onClose(); // tutup modal
    } catch (err) {
      alert('Gagal update user');
      console.error(err);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Data</h2>

      <div className="mb-4">
        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
          Nama
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={user.name}
          onChange={handleChange}
          required
          placeholder="Nama Lengkap"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={user.email}
          onChange={handleChange}
          required
          placeholder="Email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">
          Role
        </label>
        <input
          type="text"
          id="role"
          name="role"
          value={user.role}
          onChange={handleChange}
          required
          placeholder="Role"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Simpan Perubahan
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

export default EditUser;
