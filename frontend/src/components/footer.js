import React from 'react';
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaFax,
  FaEnvelope,
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaInstagram,
} from 'react-icons/fa';

function Footer() {
  return (
    <div className="relative mt-16 bg-red-700 text-white">
      <svg
        className="absolute top-0 w-full h-6 -mt-5 sm:-mt-10 sm:h-16 text-red-700"
        preserveAspectRatio="none"
        viewBox="0 0 1440 54"
      >
        <path
          fill="currentColor"
          d="M0 22L120 16.7C240 11 480 1.00001 720 0.700012C960 1.00001 1200 11 1320 16.7L1440 22V54H1320C1200 54 960 54 720 54C480 54 240 54 120 54H0V22Z"
        />
      </svg>

      <div className="px-4 pt-12 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8">
        <div className="grid gap-16 row-gap-10 mb-8 lg:grid-cols-3">
          {/* Lokasi */}
          <div>
            <p className="font-semibold tracking-wide text-white">LOKASI</p>
            <div className="mt-2 space-y-2 text-sm">
              <p className="flex items-start"><FaMapMarkerAlt className="mt-1 mr-2" /> Jl. Brigjen Katamso Komplek THR, Keparakan, Mergangsan, Kota Yogyakarta 55152</p>
              <p className="flex items-center"><FaPhoneAlt className="mr-2" /> (0274) 374496</p>
              <p className="flex items-center"><FaFax className="mr-2" /> (0274) 373444</p>
              <p className="flex items-center"><FaEnvelope className="mr-2" /> diskominfo@jogjaprov.go.id</p>
            </div>
          </div>

          {/* Media Sosial */}
          <div>
            <p className="font-semibold tracking-wide text-center">MEDIA SOSIAL</p>
            <div className="flex justify-center mt-4 space-x-4">
              <a
                href="https://www.facebook.com/share/1Japj5gZVN/"
                target="_blank"
                rel="noreferrer"
                className="text-white hover:text-red-700"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://x.com/kominfodiy?t=OiF6eWRwgn5N7KOIjlWWKw&s=08"
                target="_blank"
                rel="noreferrer"
                className="text-white hover:text-red-700"
              >
                <FaTwitter />
              </a>
              <a
                href="https://youtube.com/@kominfodiy?si=LfE76ZtISkp47Onb"
                target="_blank"
                rel="noreferrer"
                className="text-white hover:text-red-700"
              >
                <FaYoutube />
              </a>
              <a
                href="https://www.instagram.com/kominfodiy?igsh=MWpoYjhzam50cnE4ag=="
                target="_blank"
                rel="noreferrer"
                className="text-white hover:text-red-700"
              >
                <FaInstagram />
              </a>
            </div>

          </div>

          {/* Tentang */}
          <div>
            <p className="font-semibold tracking-wide">TENTANG KOMINFO DIY</p>
            <p className="mt-2 text-sm">
              Dinas Komunikasi dan Informatika DIY merupakan instansi pemerintah yang bertugas dalam pengelolaan informasi, layanan publik digital, serta transparansi pemerintahan.
            </p>
          </div>
        </div>

        <div className="flex justify-center items-center pt-5 pb-10 border-t border-red-700">
          <p className="text-sm text-center">
            &copy; 2025 Dinas Komunikasi dan Informatika DIY. All rights reserved.
          </p>
        </div>

      </div>
    </div>

  );
}

export default Footer;
