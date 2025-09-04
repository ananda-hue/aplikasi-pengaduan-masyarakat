import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/footer';
import Home from './pages/Home';
import TentangKami from './pages/TentangKami';
import FormPengaduan from './pages/FormPengaduan';
import ListPengaduan from './pages/ListPengaduan';
import Login from './pages/Login';
import Register from './pages/Register';
import RequireLogin from './components/RequireLogin';
import AdminPage from './pages/AdminPage';
import Akun from './pages/Akun';
import BantuanPage from './pages/Bantuan';
import RiwayatAduan from './pages/RiwayatAduan';
import DetailReport from './pages/Detailreport';
import Pengaturan from './pages/Pengaturan'; 


function AppLayout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const hideGlobalElements = isAdmin;

  return (
    <div className="app-container">
      {!isAdmin && <Navbar />}
      <div className="content">{children}</div>
      {!hideGlobalElements && <Footer />}
    </div>
  );
}


export function RequireAdmin({ children }) {
  const rawRole = sessionStorage.getItem('role') || '';
  const rawCategory = sessionStorage.getItem('adminCategory') || '';

  const role = rawRole.trim();
  const adminCategory = rawCategory.trim();

  const isSuperAdmin = role === 'superadmin' || (role === 'admin' && adminCategory === '');
  const isCategoryAdmin = role === 'admin' && adminCategory !== '';
  const isAdmin = isSuperAdmin || isCategoryAdmin;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}



function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* User routes */}
          <Route path="/" element={<Home />} />
          <Route path="/tentang" element={<TentangKami />} />
          <Route path="/bantuan" element={<BantuanPage />} />
          <Route path="/riwayat" element={<RiwayatAduan />} />
          <Route path="/detail/:id" element={<DetailReport />} />

          <Route
            path="/pengaduan"
            element={
              <RequireLogin>
                <FormPengaduan />
              </RequireLogin>
            }
          />
        
          <Route
            path="/daftar"
            element={
              <RequireLogin>
                <ListPengaduan />
              </RequireLogin>
            }
          />

          <Route path="/akun" element={<Akun />} />
          <Route path="/pengaturan" element={<Pengaturan />} /> {/* ✅ Tambah route Pengaturan */}

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <RequireLogin>
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              </RequireLogin>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
