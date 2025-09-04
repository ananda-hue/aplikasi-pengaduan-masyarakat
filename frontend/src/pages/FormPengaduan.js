import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from '../api';
import Select from 'react-select'
import "leaflet-geosearch/dist/geosearch.css";
// import { useMap } from "react-leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { FaLocationArrow, FaTimes } from 'react-icons/fa';
import Swal from "sweetalert2";


// Batas wilayah DIY dalam format [lat_min, lng_min, lat_max, lng_max]
const DIY_BBOX_COORDS = [[-8.2, 110.1], [-7.4, 110.7]]; // [lat, lng] untuk Leaflet

// Fungsi pembantu: cek koordinat di dalam DIY
const isWithinDIY = (lat, lng) => {
  const [[latMin, lngMin], [latMax, lngMax]] = DIY_BBOX_COORDS;
  return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
};

// Ikon untuk marker peta
const locationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Fungsi untuk mengubah koordinat menjadi alamat (Reverse Geocoding)
const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    throw new Error("Alamat tidak ditemukan.");
  } catch (error) {
    console.error("Gagal mengambil alamat:", error);
    throw error;
  }
};

// Komponen peta untuk menangani interaksi pengguna (drag marker dan klik)
function LocationPicker({ setAddress, setLat, setLng, showMessage, setForm, initialLocation }) { // <--- Menerima showMessage sebagai prop
  const map = useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      if (!isWithinDIY(lat, lng)) {
        showMessage('Lokasi yang Anda pilih berada di luar wilayah Yogyakarta.', 'error');
        return;
      }
      setLat(lat);
      setLng(lng);
      try {
        const newAddress = await reverseGeocode(lat, lng);
        setAddress(newAddress);
        setForm(prev => ({ ...prev, lokasi: newAddress, latitude: lat, longitude: lng }));
      } catch (error) {
        showMessage('Gagal mengambil alamat, coba lagi.', 'error');
        setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    },
  });

  const markerRef = useRef(null);
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return;

    // Atur tampilan awal peta jika ada lokasi awal
    if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
      const { latitude, longitude } = initialLocation;
      currentMap.setView([latitude, longitude], currentMap.getZoom());
    }

    // Hapus marker lama jika ada
    if (markerRef.current) {
      currentMap.removeLayer(markerRef.current);
    }

    // Tambahkan marker baru
    const marker = L.marker([currentMap.getCenter().lat, currentMap.getCenter().lng], {
      icon: locationIcon,
      draggable: true
    }).addTo(currentMap);

    marker.on('dragend', async (e) => {
      const { lat, lng } = e.target.getLatLng();
      if (!isWithinDIY(lat, lng)) {
        showMessage('Lokasi yang Anda pindahkan berada di luar wilayah Yogyakarta.', 'error');
        marker.setLatLng([currentMap.getCenter().lat, currentMap.getCenter().lng]);
        return;
      }
      setLat(lat);
      setLng(lng);
      try {
        const newAddress = await reverseGeocode(lat, lng);
        setAddress(newAddress);
        setForm(prev => ({ ...prev, lokasi: newAddress, latitude: lat, longitude: lng }));
      } catch (error) {
        showMessage('Gagal mengambil alamat, coba lagi.', 'error');
        setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        currentMap.removeLayer(markerRef.current);
      }
    };
  }, [map, setAddress, setLat, setLng, showMessage, setForm, initialLocation]);

  return null;
}


// Komponen Popup Notifikasi (tengah layar)
const NotificationMessage = ({ message }) => {
  if (!message) return null;
  const isSuccess = message.type === "success";
  const bgColor = isSuccess ? "bg-green-600 text-white" : "bg-red-600 text-white";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className={`px-6 py-3 rounded-lg shadow-lg text-center text-sm md:text-base ${bgColor}`}>
        <span className="font-medium">{message.text}</span>
      </div>
    </div>
  );
};



// State awal form
const INITIAL_FORM_STATE = {
  title: '',
  wilayah: '',
  lokasi: '',
  latitude: -7.7956,
  longitude: 110.3695,
  description: '',
  is_anonymous: false,
  category_id: '',
};

const REGIONS = [
  { value: 'Kota Yogyakarta', label: 'Kota Yogyakarta' },
  { value: 'Kabupaten Sleman', label: 'Kabupaten Sleman' },
  { value: 'Kabupaten Bantul', label: 'Kabupaten Bantul' },
  { value: 'Kabupaten Gunung Kidul', label: 'Kabupaten Gunung Kidul' },
  { value: 'Kabupaten Kulon Progo', label: 'Kabupaten Kulon Progo' }
];


// Komponen pembantu untuk field form
const FormField = ({ label, required = false, children, error }) => (
  <div className="flex flex-col">
    <label className="block font-semibold mb-2 text-sm md:text-base text-gray-800">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs md:text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

const SelectField = ({ id, name, value, onChange, options, required = false, placeholder }) => (
  <div className="w-full">
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full p-2 md:p-3 border border-gray-300 rounded-lg shadow-sm text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-400  h-[38px] md:h-[50px] transition"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => (
        <option key={option.value || option.id} value={option.value || option.id}>
          {option.label || option.name}
        </option>
      ))}
    </select>
  </div>
);


// --- KOMPONEN UTAMA FORM PENGADUAN ---
export default function FormPengaduan() {
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(-7.7956);
  const [lng, setLng] = useState(110.3695);
  // const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const formRef = useRef(null);
  const [showForm, setShowForm] = useState(true);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {
        console.warn('Gagal mengambil kategori', err);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "category_id"
          ? Number(value) // kategori -> angka
          : name === "title"
            ? value.slice(0, 150) // judul -> max 150 karakter
            : name === "description"
              ? value.slice(0, 1000) // deskripsi -> max 1000 karakter
              : type === "checkbox"
                ? checked // checkbox
                : value, // input lain
    }));
  };


  const handlePhotoChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // cek jika melebihi batas 3 file
    if (photoFiles.length + newFiles.length > 3) {
      showMessage('Maksimal 3 file yang dapat diunggah.');
      return;
    }

    // cek tipe file dan akumulasi size
    let totalSize = photoFiles.reduce((acc, f) => acc + f.size, 0);
    let validFiles = [];

    for (let file of newFiles) {
      const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
      if (!isValidType) {
        showMessage('Hanya file JPG, PNG, atau PDF yang diperbolehkan.');
        continue; // skip file tidak valid
      }

      // cek aturan ukuran file
      if (photoFiles.length + validFiles.length === 0 && newFiles.length === 1) {
        // hanya 1 file, maksimal 5MB
        if (file.size > 5 * 1024 * 1024) {
          showMessage('File yang anda gunakan lebih dari 5MB.');
          continue; // skip file > 5MB
        }
      }

      totalSize += file.size;

      // jika total lebih dari 5MB (untuk multi file)
      if (photoFiles.length + validFiles.length > 0 && totalSize > 5 * 1024 * 1024) {
        showMessage('Total ukuran semua file tidak boleh lebih dari 5MB.');
        return; // stop proses, jangan tambahkan file
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setPhotoFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateForm = () => {
    const requiredFields = ['title', 'category_id', 'wilayah', 'lokasi', 'description'];
    const missingFields = requiredFields.filter(field => {
      if (field === 'category_id') return !form[field] || form[field] === 0;
      return !form[field];
    });

    if (missingFields.length > 0) {
      showMessage('Mohon lengkapi semua field yang wajib diisi.');
      return false;
    }

    if (photoFiles.length === 0) {
      showMessage('Mohon unggah minimal 1 file sebagai bukti.');
      return false;
    }

    if (photoFiles.length > 3) {
      showMessage('Maksimal 3 file yang dapat diunggah.');
      return false;
    }

    // validasi ulang size
    const totalSize = photoFiles.reduce((acc, f) => acc + f.size, 0);
    if (photoFiles.length === 1) {
      if (totalSize > 5 * 1024 * 1024) {
        showMessage('File yang anda gunakan lebih dari 5MB.');
        return false;
      }
    } else {
      if (totalSize > 5 * 1024 * 1024) {
        showMessage('Total ukuran semua file tidak boleh lebih dari 5MB.');
        return false;
      }
    }

    // validasi ulang tipe file
    const invalidFile = photoFiles.find(
      (f) => !['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)
    );
    if (invalidFile) {
      showMessage('Gunakan file JPG, PNG, atau PDF.');
      return false;
    }

    return true;
  };


  const resetForm = (formElement) => {
    setForm(INITIAL_FORM_STATE);
    setPhotoFiles([]);
    if (formElement) {
      formElement.reset();
    }
    setAddress("");
    setLat(INITIAL_FORM_STATE.latitude);
    setLng(INITIAL_FORM_STATE.longitude);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    photoFiles.forEach(file => formData.append('photo', file));

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        const result = await Swal.fire({
          icon: 'warning',
          text: 'Anda harus login untuk mengirim pengaduan.',
          showCancelButton: true,
          confirmButtonText: 'Login',
          cancelButtonText: 'Batal',
          reverseButtons: true, // tombol Login pindah ke kiri
          customClass: {
            popup: 'font-sans',
            actions: 'space-x-3', // kasih jarak antar tombol
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700',
            cancelButton: 'bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300'
          },
          buttonsStyling: false
        });
        if (result.isConfirmed) {
          window.location.href = '/login'; // Ganti dengan URL halaman login yang sesuai
        }
        setIsSubmitting(false);
        return;
      }
      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });

      await Swal.fire({
        icon: 'success',
        title: 'Pengaduan Berhasil',
        text: 'Pengaduan berhasil dikirim!',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'font-sans' },
        width: 300,
        padding: '1rem',
      });
      window.location.href = '/riwayat';
      resetForm(e.target);

    } catch (error) {
      console.error('Error submitting report:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Pengaduan',
        text: error.response?.data?.message || 'Terjadi kesalahan saat mengirim pengaduan.',
        customClass: { popup: 'font-sans' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressInputChange = async (e) => {
    const value = e.target.value;
    setAddress(value);
    setForm(prev => ({ ...prev, lokasi: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (value.length >= 2) {
        setSearchLoading(true);
        const provider = new OpenStreetMapProvider();

        const results = await provider.search({ query: `${value}, Yogyakarta` });

        const filteredResults = results.filter(item => {
          return isWithinDIY(item.y, item.x);
        });

        if (filteredResults.length === 0 && results.length > 0) {
          showMessage('Tidak ada hasil pencarian yang ditemukan di wilayah Yogyakarta.', 'error');
        } else if (results.length === 0) {
          showMessage('Tidak ada hasil yang cocok dengan pencarian Anda.', 'error');
        }

        const formattedResults = filteredResults.map(item => ({
          id: item.raw.place_id,
          name: item.label.split(',')[0],
          address: item.label,
          coordinates: [item.y, item.x],
          type: 'location'
        }));

        setSuggestions(formattedResults);
        setSearchLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 500);
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.address);
    setLat(suggestion.coordinates[0]);
    setLng(suggestion.coordinates[1]);
    setForm(prev => ({ ...prev, lokasi: suggestion.address, latitude: suggestion.coordinates[0], longitude: suggestion.coordinates[1] }));
    setSuggestions([]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showMessage('Geolocation tidak didukung oleh browser Anda.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isWithinDIY(latitude, longitude)) {
          showMessage('Lokasi Anda di luar wilayah Yogyakarta.', 'error');
          return;
        }
        setLat(latitude);
        setLng(longitude);
        try {
          const newAddress = await reverseGeocode(latitude, longitude);
          setAddress(newAddress);
          setForm(prev => ({ ...prev, lokasi: newAddress, latitude: latitude, longitude: longitude }));
          showMessage('Lokasi Anda berhasil ditemukan!', 'success');
        } catch (error) {
          showMessage('Gagal mengambil alamat dari lokasi GPS.', 'error');
          setAddress("Gagal mengambil alamat");
        }
      },
      (error) => {
        showMessage('Gagal mengambil lokasi. Mohon izinkan akses GPS.', 'error');
      }
    );
  };

  const handleLocationReset = () => {
    setAddress("");
    setLat(INITIAL_FORM_STATE.latitude);
    setLng(INITIAL_FORM_STATE.longitude);
    setForm(prev => ({ ...prev, lokasi: "", latitude: INITIAL_FORM_STATE.latitude, longitude: INITIAL_FORM_STATE.longitude }));
    setSuggestions([]);
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  return (
    <div className="min-h-screen flex flex-col items-center py-8 sm:py-8 px-0 sm:px-4 font-['Work_Sans']">

      <NotificationMessage message={message} />

      {/* --- BAGIAN FORMULIR UTAMA --- */}
      {showForm && (
        <div
          ref={formRef}
          className="w-full max-w-screen-xl mx-auto bg-white rounded-lg sm:rounded-2xl overflow-hidden mt-0 sm:mt-6 p-3 sm:p-6 md:p-8 relative shadow-none sm:shadow-lg"
        >
          <div className="flex flex-col items-center">
            {/* Header yang lebih kompak */}
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-gray-800">
              Formulir Pengaduan
            </h3>

            {/* Form dengan layout grid yang lebih efisien */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 w-full max-w-6xl">

              {/* Checkbox anonim */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  name="is_anonymous"
                  checked={form.is_anonymous}
                  onChange={e => setForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                  className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="is_anonymous" className="text-sm sm:text-base text-gray-700 select-none font-medium">
                  Kirim sebagai anonim
                </label>
              </div>

              {/* Row 1: Kategori dan Wilayah dalam satu baris */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FormField label="Kategori Aduan" required>
                  <Select
                    inputId="category-select"
                    options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                    value={
                      categories.find((cat) => cat.id === form.category_id)
                        ? {
                          value: form.category_id,
                          label: categories.find((cat) => cat.id === form.category_id)?.name,
                        }
                        : null
                    }
                    onChange={(selectedOption) => {
                      setForm((prev) => ({
                        ...prev,
                        category_id: selectedOption ? selectedOption.value : null,
                      }));
                    }}
                    isSearchable={true}
                    placeholder="Pilih Kategori"
                    maxMenuHeight={140}
                    className="w-full"
                    classNamePrefix="rs"
                    components={{ IndicatorSeparator: () => null }}
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        borderRadius: "0.5rem",
                        borderColor: state.isFocused ? "#a13030" : "#d1d5db",
                        boxShadow: state.isFocused
                          ? "0 0 0 2px rgba(248, 113, 113, 0.5)"
                          : "none",
                        minHeight: "42px",
                        fontSize: window.innerWidth < 640 ? "0.875rem" : "0.875rem",
                        "&:hover": {
                          borderColor: "#ef4444",
                        },
                      }),
                      menuList: (provided) => ({
                        ...provided,
                        maxHeight: "140px",
                        overflowY: "auto",
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isFocused ? "#fecaca" : null,
                        color: "#1f2937",
                        fontSize: window.innerWidth < 640 ? "0.875rem" : "0.875rem",
                        "&:active": {
                          backgroundColor: "#ef4444",
                          color: "white",
                        },
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: "#1f2937",
                        fontSize: window.innerWidth < 640 ? "0.875rem" : "0.875rem",
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: "#6b7280",
                        fontSize: window.innerWidth < 640 ? "0.875rem" : "0.875rem",
                      }),
                    }}
                  />
                </FormField>

                <FormField label="Wilayah" required>
                  <SelectField
                    id="wilayah"
                    name="wilayah"
                    value={form.wilayah}
                    onChange={handleInputChange}
                    options={REGIONS}
                    required
                    placeholder="Pilih Wilayah"
                    className="
                    w-full text-sm border border-gray-300 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-red-400
                    px-3 h-[42px] appearance-none
                    hover:border-red-400 transition-all duration-200
                  "
                  />
                </FormField>
              </div>

              {/* Row: Form Kiri (judul, deskripsi, bukti) + Form Kanan (lokasi + peta) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* KIRI */}
                <div className="flex flex-col space-y-4 sm:space-y-6">
                  {/* Judul Aduan */}
                  <FormField label="Judul Aduan" required>
                    <div className="w-full flex flex-col">
                      <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleInputChange}
                        placeholder="Judul aduan"
                        required
                        maxLength={150}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm 
                     focus:outline-none focus:ring-2 focus:ring-red-400 
                     hover:border-red-400 transition h-12 sm:h-14"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {form.title.length}/150
                      </p>
                    </div>
                  </FormField>

                  {/* Deskripsi Aduan */}
                  <FormField label="Deskripsi Aduan" required>
                    <div className="w-full flex flex-col">
                      <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleInputChange}
                        placeholder="Jelaskan secara lengkap peristiwa yang Anda alami"
                        required
                        className="w-full p-2.5 border border-gray-300 rounded-lg resize-none text-sm 
                     focus:outline-none focus:ring-2 focus:ring-red-400 
                     hover:border-red-400 transition h-24 sm:h-28"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {form.description.length}/1000
                      </p>
                    </div>
                  </FormField>

                  {/* Bukti Pendukung */}
                  <FormField label="Bukti Pendukung" required>
                    <input
                      type="file"
                      id="photo"
                      name="photo"
                      onChange={handlePhotoChange}
                      multiple
                      accept="image/*,application/pdf"
                      className="w-full text-xs text-gray-500
          file:mr-2 sm:file:mr-3 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-3
          file:rounded-lg file:border-0
          file:text-xs file:font-semibold
          file:bg-red-600 file:text-white
          hover:file:bg-red-700 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maks. 3 file | Maks. 5 MB
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {photoFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 sm:w-20 sm:h-20 border border-red-300 rounded-md overflow-hidden 
                       flex items-center justify-center bg-gray-100"
                        >
                          {file.type === "application/pdf" ? (
                            <div className="flex flex-col items-center justify-center text-center p-0.5 sm:p-1">
                              <span className="text-red-700 font-bold text-xs">PDF</span>
                              <span className="text-xs truncate w-12 sm:w-16 text-gray-600">{file.name}</span>
                            </div>
                          ) : (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full text-xs p-0.5 sm:p-1 
                         h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center hover:bg-red-700 transition-colors"
                            title="Hapus file"
                          >
                            <FaTimes size={window.innerWidth < 640 ? 6 : 8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </FormField>
                </div>

                {/* KANAN */}
                <div className="flex flex-col space-y-4 sm:space-y-6">
                  {/* Lokasi Kejadian */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-gray-800">
                      Lokasi Kejadian <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={address}
                          onChange={handleAddressInputChange}
                          placeholder="Ketik alamat"
                          required
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm 
                       focus:outline-none focus:ring-2 focus:ring-red-400 
                       hover:border-red-400 transition pr-8 sm:pr-10"
                        />
                        {address && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              onClick={handleLocationReset}
                              className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full 
                           bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-red-500 transition-colors"
                            >
                              <FaTimes size={window.innerWidth < 640 ? 8 : 10} />
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleUseMyLocation}
                        type="button"
                        className="p-2.5 bg-red-600 text-white rounded-lg flex items-center justify-center 
                     hover:bg-red-700 transition-colors min-w-[40px] h-[42px]"
                      >
                        <FaLocationArrow size={window.innerWidth < 640 ? 12 : 14} />
                      </button>
                    </div>

                    {/* Saran alamat */}
                    {suggestions.length > 0 && (
                      <ul className="relative z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mb-2 max-h-32 sm:max-h-40 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                          <li
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-2 sm:px-3 py-2 cursor-pointer hover:bg-red-100 transition-colors text-sm text-gray-800"
                          >
                            <p className="font-semibold text-xs">{suggestion.name}</p>
                            <p className="text-xs text-gray-500 truncate">{suggestion.address}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Peta */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-gray-800">
                      Pilih Lokasi di Peta
                    </label>
                    <div className="sticky top-14 h-48 sm:h-64 w-full rounded-lg overflow-hidden border border-gray-300">
                      <MapContainer
                        key="unique-map-key"
                        center={[lat, lng]}
                        zoom={13}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                        maxBounds={DIY_BBOX_COORDS}
                        maxBoundsViscosity={1.0}
                      >
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationPicker
                          setAddress={setAddress}
                          setLat={setLat}
                          setLng={setLng}
                          showMessage={showMessage}
                          setForm={setForm}
                          initialLocation={{ latitude: lat, longitude: lng }}
                        />
                      </MapContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-700 text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-red-800 transition-colors shadow-md disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Pengaduan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}