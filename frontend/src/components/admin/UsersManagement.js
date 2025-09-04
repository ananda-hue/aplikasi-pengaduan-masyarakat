import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Loader from '../common/Loader';
import { FaEdit, FaTrash, FaPlus, FaUndo, FaToggleOn, FaToggleOff } from 'react-icons/fa';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [normalUsers, setNormalUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchUsers();
    fetchDeletedUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      const userData = res.data.Data || res.data.data || res.data;
      setUsers(userData);
      setLoading(false);
      setNormalUsers(userData.filter(u => u.role === 'user'));
      setAdminUsers(userData.filter(u => ['admin', 'superadmin', 'kategori_admin'].includes(u.role)));
    } catch (err) {
      setError('Gagal mengambil data pengguna');
      setLoading(false);
      console.error('Fetch users error:', err);
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      const res = await api.get('/users/deleted');
      setDeletedUsers(res.data.data || []);
    } catch {
      setDeletedUsers([]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah yakin ingin menghapus user ini?')) {
      try {
        await api.delete(`/users/${id}`);
        alert('User berhasil dihapus (soft delete)');
        fetchUsers();
        fetchDeletedUsers();
      } catch (err) {
        alert(`Gagal menghapus user: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleToggleActive = async (id) => {
    if (window.confirm('Apakah yakin ingin mengubah status aktif user ini?')) {
      try {
        await api.patch(`/users/${id}/toggle-active`);
        alert('Status user berhasil diubah');
        fetchUsers();
      } catch (err) {
        alert(`Gagal mengubah status user: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm('Apakah yakin ingin memulihkan akun ini?')) {
      try {
        await api.patch(`/users/${id}/restore`);
        alert('Akun berhasil dipulihkan');
        fetchUsers();
        fetchDeletedUsers();
      } catch {
        alert('Gagal memulihkan akun');
      }
    }
  };

  const handleHardDelete = async (id) => {
    if (window.confirm('PERINGATAN: Akun akan dihapus PERMANEN! Apakah Anda yakin?')) {
      try {
        await api.delete(`/users/${id}/hard-delete`);
        alert('Akun berhasil dihapus permanen');
        fetchDeletedUsers();
      } catch {
        alert('Gagal menghapus akun permanen');
      }
    }
  };

  const handleEdit = (id) => navigate(`/admin/users/edit/${id}`);

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/create-admin', newAdmin);
      alert('Admin berhasil ditambahkan (password default: "Password")');
      setShowAddAdminForm(false);
      setNewAdmin({ name: '', email: '' });
      fetchUsers();
    } catch {
      alert('Gagal menambahkan admin');
    }
  };

  if (loading) return <Loader />;
  if (error) return <p className="text-red-700 text-center my-4">{error}</p>;
 return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="flex space-x-3 mb-6">
        {['users', 'admins', 'accounts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${
              activeTab === tab
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`}
          >
            {tab === 'users' ? 'Manajemen User' : tab === 'admins' ? 'Manajemen Admin' : 'Manajemen Akun'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <h2 className="text-2xl font-bold text-black mb-4">Manajemen Pengguna</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-700">
                <tr>
                  {['Nama', 'Email', 'Status', 'Aksi'].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-white font-bold uppercase tracking-wide text-sm"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {normalUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-black-500">
                      Tidak ada user biasa.
                    </td>
                  </tr>
                ) : (
                  normalUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-100">
                      <td className="px-6 py-3">{user.name}</td>
                      <td className="px-6 py-3">{user.email}</td>
                      {/* <td className="px-6 py-3">{user.role}</td> */}
                      <td className="px-6 py-3">
                        <span className="inline-block px-3 py-1 rounded-full text-green-800 bg-green-100 font-semibold text-sm">
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-3 flex space-x-3 items-center">
                        {/* Edit - Yellow */}
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="text-yellow-500 hover:text-yellow-600"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>

                        {/* Toggle Active/Inactive - Green */}
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className="text-green-600 hover:text-green-700"
                          title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {user.is_active ? <FaToggleOff size={18} /> : <FaToggleOn size={18} />}
                        </button>

                        {/* Delete - Red */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-black">Manajemen Admin</h2>
            <button
              onClick={() => setShowAddAdminForm(!showAddAdminForm)}
              className="px-4 py-2 bg-red-700 text-white rounded shadow hover:bg-red-800 transition flex items-center gap-2"
            >
              <FaPlus /> Tambah Admin
            </button>
          </div>
          {showAddAdminForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold mb-4 text-black">Tambah Admin Baru</h3>
                <form onSubmit={handleAddAdminSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nama"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddAdminForm(false)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-700">
                <tr>
                  {['Nama', 'Email', 'Status', 'Aksi'].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-white font-bold uppercase tracking-wide text-sm"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-black-500">
                      Tidak ada user admin.
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-100">
                      <td className="px-6 py-3">{user.name}</td>
                      <td className="px-6 py-3">{user.email}</td>
                      {/* <td className="px-6 py-3">{user.role}</td> */}
                      {/* <td className="px-6 py-3">
                        {user.role.toLowerCase() === 'superadmin'
                          ? 'Superadmin'
                          : user.role.toLowerCase() === 'admin'
                          ? (!user.categories || user.categories.length === 0
                              ? 'Superadmin'
                              : user.categories[0]?.name || '-')
                          : '-'}
                      </td> */}
                      <td className="px-6 py-3">
                        <span className="inline-block px-3 py-1 rounded-full text-green-800 bg-green-100 font-semibold text-sm">
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-3 flex space-x-3 items-center">
                        {/* Edit - Yellow */}
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="text-yellow-500 hover:text-yellow-600"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>

                        {/* Toggle Active/Inactive - Green */}
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className="text-green-600 hover:text-green-700"
                          title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {user.is_active ? <FaToggleOff size={18} /> : <FaToggleOn size={18} />}
                        </button>

                        {/* Delete - Red */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Deleted Users Tab */}
      {activeTab === 'accounts' && (
        <>
          <h2 className="text-2xl font-bold text-black mb-4">Manajemen Akun Terhapus</h2>
          <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-700">
                <tr>
                  {['Nama', 'Email', 'Role', 'Tanggal Dihapus', 'Aksi'].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-white font-bold uppercase tracking-wide text-sm"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deletedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-black-500">
                      Tidak ada akun yang dihapus.
                    </td>
                  </tr>
                ) : (
                  deletedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-100">
                      <td className="px-6 py-3">{user.name}</td>
                      <td className="px-6 py-3">{user.email}</td>
                      <td className="px-6 py-3">{user.role}</td>
                      <td className="px-6 py-3">
                        {user.deleted_at
                          ? new Intl.DateTimeFormat('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }).format(new Date(user.deleted_at))
                          : '-'}
                      </td>
                      <td className="px-6 py-3 flex space-x-3 items-center">
                        {/* Restore - Green */}
                        <button
                          onClick={() => handleRestore(user.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Pulihkan Akun"
                        >
                          <FaUndo size={18} />
                        </button>

                        {/* Hard Delete - Red */}
                        <button
                          onClick={() => handleHardDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus Permanen"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default UsersManagement;

