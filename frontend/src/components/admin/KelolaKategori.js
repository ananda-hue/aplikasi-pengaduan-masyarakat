import { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import api from '../../api';

function KelolaKategori() {
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);   // user admin
  const [name, setName] = useState('');
  const [userId, setUserId] = useState(null);  // owner category
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/categories/admins');
      setAdmins(res.data);
    } catch (err) {
      console.error('Gagal mengambil admin users', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, { name, user_id: userId });
        alert('Kategori diupdate');
      } else {
        await api.post('/categories', { name, user_id: userId });
        alert('Kategori ditambahkan');
      }
      setName('');
      setUserId(null);
      setEditId(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan kategori');
    }
  };

  const handleEdit = (cat) => {
    setName(cat.name);
    setUserId(cat.user_id || null);
    setEditId(cat.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus kategori ini?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus kategori');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header dan tombol tambah */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">Kelola Kategori</h2>
        <button
          onClick={() => {
            setName('');
            setUserId(null);
            setEditId(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 transition"
        >
          Tambah
        </button>
      </div>

      {/* Tabel kategori */}
      <div className="overflow-x-auto border border-gray-200 rounded-none shadow-sm">
        <table className="min-w-full divide-y divide-black">
          <thead className="bg-red-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                Kategori 
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                Admin OPD
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                Dibuat
              </th>
              <th className="px-6 py-3 text-center text-sm font-bold text-white uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cat.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {admins.find((a) => a.id === cat.user_id)?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(cat.created_at))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="text-yellow-500 hover:text-yellow-600"
                    title="Edit"
                    aria-label="Edit"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Hapus"
                    aria-label="Hapus"
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal tambah/edit */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              {editId ? 'Edit Kategori' : 'Tambah Kategori'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kategori"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={userId || ''}
                onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : null)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih Admin OPD</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  {editId ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default KelolaKategori;
