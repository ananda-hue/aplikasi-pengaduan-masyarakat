import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import api from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faInfoCircle,
  faLink,
  faCheckCircle,
  faTimesCircle,
  faImage,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";

function PengaduanHome() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const maxItems = isMobile ? 5 : 8;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get("/reports/public");
        const processedReports = response.data.data.slice(0, maxItems).map(item => ({
          ...item,
          user: item.is_anonymous ? { name: "Anonim" } : item.user
        }));
        setReports(processedReports);
        setLoading(false);
      } catch {
        setError("Gagal mengambil data pengaduan.");
        setLoading(false);
      }
    };
    fetchReports();
  }, [maxItems]);

  const renderStatusBadge = (status) => {
    const statusText = (status || "").toLowerCase();
    const base = "inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full";

    switch (statusText) {
      case "diajukan":
        return <span className={`${base} bg-yellow-100 text-yellow-600`}><FontAwesomeIcon icon={faInfoCircle} /> Diajukan</span>;
      case "diproses":
        return <span className={`${base} bg-blue-100 text-blue-700`}><FontAwesomeIcon icon={faLink} /> Diproses</span>;
      case "selesai":
        return <span className={`${base} bg-green-100 text-green-700`}><FontAwesomeIcon icon={faCheckCircle} /> Selesai</span>;
      case "ditolak":
        return <span className={`${base} bg-red-100 text-red-600`}><FontAwesomeIcon icon={faTimesCircle} /> Ditolak</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>;
    }
  };

  return (
    <section className="py-16 px-4 bg-white font-['Work_Sans']">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-red-600 text-center mb-10">
          Pengaduan Terbaru
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Memuat data pengaduan...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            {reports.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/detail/${item.id}`, { state: { from: "/pengaduanhome", fromName: "Pengaduan Home" } })}
                className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Foto laporan */}
               {(() => {
  const files = item.bukti_fotos || [];
  const firstFile = files.length > 0 ? files[0].photo_url : null;

  if (!firstFile) {
    return (
      <div className="w-full aspect-[3/2] bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
        <FontAwesomeIcon icon={faImage} />
      </div>
    );
  }

  // Cek apakah file adalah PDF
  const isPdf = firstFile.toLowerCase().endsWith(".pdf");

  return isPdf ? (
    <div className="w-full aspect-[3/2] bg-gray-200 flex items-center justify-center text-red-500 text-6xl">
      <FontAwesomeIcon icon={faFilePdf} />
    </div>
  ) : (
    <div className="w-full aspect-[3/2] overflow-hidden">
      <img
        src={`http://localhost:8080/${firstFile}`}
        alt="Lampiran laporan"
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
})()}


                {/* Konten dalam card */}
                <div className="p-4 flex flex-col justify-between">
                  {/* Judul dan wilayah */}
                  <div className="text-base font-semibold text-red-700 mb-2 line-clamp-1">
                    {(item.title && item.title.trim().length > 0
                      ? item.title.split(" ").slice(0, 3).join(" ")
                      : "Tanpa Kategori") +
                      ` di ${item.wilayah || "tidak diketahui"}`}
                  </div>

                  {/* Deskripsi */}
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Nama user */}
                  <div className="text-[15px] text-sm text-gray-500 flex items-center gap-2">
                    <FontAwesomeIcon icon={faUserCircle} />
                    {item.user?.name || "Anonymous"}
                  </div>

                  <div className="text-[9px] text-gray-400 mb-2 ml-5 flex flex-nowrap items-center space-x-2">
                    <span>
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-gray-500 italic whitespace-nowrap">
                      Melalui Website Pengaduan
                    </span>
                  </div>

                  {/* Status */}
                  <div>{renderStatusBadge(item.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PengaduanHome;
