import { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Leaf, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  // State untuk mengontrol tampil/sembunyi password
  const [showPassword, setShowPassword] = useState(false);

  // Inisialisasi AOS saat komponen dimuat
  useEffect(() => {
    AOS.init({
      duration: 800, // Durasi animasi dalam milidetik
      once: true,    // Animasi hanya berjalan 1 kali saat di-render
      easing: 'ease-out-cubic',
    });
  }, []);

  const submit = (e) => {
    e.preventDefault();
    post('/login');
  };

  const bgImageUrl = 'https://img.magnific.com/foto-gratis/pemetik-teh-bekerja-di-kerela-india_53876-42847.jpg?semt=ais_hybrid&w=740&q=80';

  return ( 
    <>
      <Head title="Masuk — AroidMarket" />
      <div className="min-h-screen grid lg:grid-cols-2 bg-[#f8f7f2] text-emerald-950 overflow-hidden">
        
        {/* Panel Kiri dengan Latar Belakang Gambar & Animasi Fade-Right */}
        <div 
          data-aos="fade-right"
          className="hidden lg:flex flex-col justify-between p-12 text-emerald-50 relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url('${bgImageUrl}')` }}
        >
          {/* Overlay Gradient agar Teks dan Elemen Lain Tetap Jelas */}
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-emerald-950/95 via-emerald-900/80 to-emerald-950/70" />

          {/* Glow Effect Decorative */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3 relative z-10" data-aos="fade-down" data-aos-delay="200">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 bg-white flex items-center justify-center relative z-20">
  <img
    src="/company/logo"
    alt="Logo perusahaan"
    className="w-full h-full object-contain bg-white"
  />
</div>
            <div className="font-[Sora,ui-sans-serif] font-bold text-2xl text-white">
              Aroid<span className="text-amber-300">Market</span>
            </div>
          </div>

          {/* Headline Text */}
          <div className="relative z-10" data-aos="fade-up" data-aos-delay="300">
            <h2 className="font-[Sora,ui-sans-serif] text-4xl font-bold leading-tight tracking-tight">
              Tumbuhkan hasil panen<br />dengan data yang presisi.
            </h2>
            <p className="mt-4 text-emerald-200/90 max-w-md">
              Kelola lahan, kelompok tani, aktivitas harian, dan finansial dalam satu dashboard yang bersih dan cepat.
            </p>
          </div>

          {/* Footer Text */}
          <p className="text-xs text-emerald-300/80 relative z-10" data-aos="fade-up" data-aos-delay="400">
            © {new Date().getFullYear()} AroidMarket
          </p>
        </div>

        {/* Form Kanan dengan Animasi Fade-Up */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          {/* noValidate agar tidak ditahan tooltip bawaan browser */}
          <form 
            onSubmit={submit} 
            noValidate
            className="w-full max-w-md"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            <div className="mb-8">
              <h1 className="font-[Sora,ui-sans-serif] text-3xl font-bold tracking-tight">Selamat datang kembali</h1>
              <p className="text-emerald-800/70 mt-2 text-sm">Masuk ke akun AroidMarket kamu.</p>
            </div>

            {/* Input Email */}
            <div className="mb-4">
              <span className="text-sm font-medium">Email</span>
              <div className="mt-1.5 relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700/60" />
                <input
                  type="text"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white focus:ring-2 outline-none transition ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' 
                      : 'border-emerald-900/15 focus:border-emerald-700 focus:ring-emerald-700/20'
                  }`}
                  placeholder="Masukkan email anda"
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Input Password dengan Tombol Mata */}
            <div className="mb-4">
              <span className="text-sm font-medium">Password</span>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white focus:ring-2 outline-none transition ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' 
                      : 'border-emerald-900/15 focus:border-emerald-700 focus:ring-emerald-700/20'
                  }`}
                  placeholder="••••••••"
                />
                {/* Tombol Ikon Mata */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700/60 hover:text-emerald-900 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 mb-6 text-sm text-emerald-900/80 cursor-pointer">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
                className="rounded border-emerald-900/20 text-emerald-800 focus:ring-emerald-700"
              />
              Ingat saya
            </label>

            <button
              type="submit"
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-lg shadow-emerald-900/20 transition disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {processing ? 'Memproses…' : 'Masuk'}
            </button>

          </form>
        </div>
      </div>
    </>
  );
}