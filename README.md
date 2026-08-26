# Optimusfarm 

Sistem Informasi Manajemen Pertanian berbasis web menggunakan Laravel & Inertia.js (React/JS/Vite).

---

##  Prasyarat Sistem (Prerequisites)

Sebelum menjalankan proyek, pastikan perangkat sudah menginstall:
* **PHP** (minimal versi 8.1 / 8.2)
* **Composer**
* **Node.js** (minimal versi 18+) & **NPM**
* **MySQL** / Database server (XAMPP / Laragon / TablePlus)

---

## Langkah-Langkah Instalasi & Menjalankan Proyek

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di komputer lokal:

### 1. Clone Repository
```bash
git clone [https://github.com/MasAduy4/Optimusfarm.git](https://github.com/MasAduy4/Optimusfarm.git)
cd Optimusfarm

```

### 2. Install Dependency PHP & JavaScript

```bash
composer install
npm install

```

### 3. Konfigurasi Environment (`.env`)

Salin file `.env.example` menjadi `.env`:

* **Windows (Command Prompt):**
```cmd
copy .env.example .env

```


* **Mac / Linux / Git Bash:**
```bash
cp .env.example .env

```



Buka file `.env` yang baru dibuat dan sesuaikan konfigurasi databasenya:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=optimus_farm
DB_USERNAME=root
DB_PASSWORD=

```

### 4. Generate Application Key

```bash
php artisan key:generate

```

### 5. Jalankan Migration Database

```bash
php artisan migrate

```

*(Jika ada data awal/seeder, jalankan: `php artisan migrate --seed`)*

### 6. Jalankan Server

Buka **dua jendela terminal** terpisah:

* **Terminal 1 (Backend Laravel):**
```bash
php artisan serve

```


* **Terminal 2 (Frontend Assets / Vite):**
```bash
npm run dev

```



Akses aplikasi melalui browser di alamat: `http://127.0.0.1:8000`

---

## Akun Login Pengujian (Testing)

Gunakan akun bawaan di bawah ini untuk masuk ke dalam aplikasi:

Admin:
* **Email:** `admin@gmail.com`
* **Password:** `password123`


User:
* **Email:** `gaming@gmail.com`
* **Password:** `papagaben`
