# ⚡ PARANOID NOISE - OFFICIAL BAND WEBSITE

> **Raw Punk Rock & 90's Seattle Grunge Trio from Jakarta, Indonesia.**  
> *"Rooted in the gritty, distortion-heavy guitar riffs of Nirvana and Seattle sound, layered with deep emotional intensity and explosive rhythms reminiscent of the 90's grunge scene."*

---

## 🎸 Lineup Personil
* **Arief** : Guitar, Vocals
* **Ganjar** : Bass
* **Kimao** : Drum

---

## 🚀 Fitur Utama Website
1. **Rock Stompbox Pedal Aesthetic**:
   * Desain bertema hitam-putih dengan gradasi merah gelap bernuansa 90's Seattle Grunge & Punk Rock.
   * Logo stompbox overdrive pedal Paranoid Noise terintegrasi dengan aksen petir dan efek glow neon.
   * Tombol interaktif **FOOTSWITCH STOMP (DISTORTION ON/OFF)** dengan suara klik mekanik realistis dan lampu LED menyala.
2. **Audio Synth & 7 Singles Discography Player**:
   * **Web Audio API Engine**: Pemutar riff rock distorsi interaktif yang langsung bersuara saat tombol putar ditekan!
   * Visualizer gelombang suara dinamis (*canvas audio frequency bars*).
   * 7 Single Resmi Paranoid Noise:
     1. *Mesin Waktu* (Jan 2021)
     2. *Diamkan Aku* (Jan 2022)
     3. *I Don't Surrender* (Mar 2022)
     4. *Aku Trauma* (Apr 2022)
     5. *On Antarctica* (Mei 2022)
     6. *Pengkhianat* (Jul 2022)
     7. *I've Got My Vision* (Okt 2022)
   * Tautan langsung ke Spotify, YouTube, dan SoundCloud untuk setiap single.
3. **Profil & Sejarah Band Lengkap**:
   * Menampilkan narasi resmi pergerakan Paranoid Noise dari panggung underground Bekasi-Jakarta-Bandung hingga panggung festival besar.
   * Dokumentasi panggung live otentik dan galeri amplifier Marshall stack.
4. **Lineup Personil Interaktif**:
   * Kartu profil individual untuk **Arief**, **Ganjar**, dan **Kimao**.
   * Foto otentik, deskripsi peran, spesifikasi instrumen/gear, dan tombol tes audio instrumen.
5. **Jadwal Gigs & Sistem Tiket / RSVP**:
   * Daftar event tour mendatang di Jakarta, Bandung, Bekasi, dll.
   * Modal interaktif reservasi tiket / RSVP langsung tersimpan ke Supabase (dengan fallback penyimpanan lokal) serta tombol konfirmasi instan ke WhatsApp.
6. **Official Merchandise Store**:
   * Katalog merch: Kaos Stompbox Vintage Wash, Hoodie Seattle Sound, Kaset Pita Limited, Topi Trucker, Set Pin Enamel & Pick Gitar, dan Stiker Pack.
   * Pemilih ukuran (S, M, L, XL, XXL) dan keranjang belanja interaktif.
   * Fitur **Pesan Cepat via WhatsApp** (otomatis memformat nama barang, ukuran, dan total harga ke WhatsApp band).
7. **Kontak Booking & Integrasi Sosial Media**:
   * Formulir pengajuan booking gig untuk promotor/EO.
   * Tombol unduh Technical Rider & EPK.
   * Tautan langsung ke kanal media resmi:
     * **Instagram**: [@paranoid.noise](https://instagram.com/paranoid.noise)
     * **Spotify**: [Paranoid Noise](https://open.spotify.com/artist/paranoidnoise)
     * **YouTube**: [@paranoid.noise](https://youtube.com/@paranoid.noise)
     * **SoundCloud**: [Paranoid Noise](https://soundcloud.com/paranoidnoise)
     * **WhatsApp Booking**: `+6281-Paranoid Noise`
     * **Email**: `official.paranoidnoise@gmail.com`

---

## 🛠️ Tech Stack
* **Frontend**: React 19 + Vite 6
* **Styling**: Tailwind CSS v4
* **Animations**: Framer Motion
* **Icons**: Lucide React + Custom SVG Icons
* **Audio Engine**: Web Audio API (Custom Distortion Waveshaper & Lowpass Filter)
* **Backend (Opsional/Ready)**: Supabase (`@supabase/supabase-js`)
* **Deployment Target**: Vercel

---

## 💻 Cara Menjalankan di Komputer Lokal

1. Buka terminal di folder project (`D:\PN`).
2. Jalankan perintah instalasi dependency (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server lokal:
   ```bash
   npm run dev
   ```
4. Buka browser di [http://localhost:5173](http://localhost:5173).

---

## 🐙 Cara Push ke GitHub

Repository Git lokal sudah diinisialisasi dan di-commit. Untuk menghubungkannya ke akun GitHub Anda:

1. Buat repository baru di [GitHub](https://github.com/new) bernama `paranoid-noise` (biarkan kosong tanpa README).
2. Di terminal folder `D:\PN`, jalankan perintah berikut:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<USERNAME_GITHUB_ANDA>/paranoid-noise.git
   git push -u origin main
   ```

---

## ☁️ Cara Deploy ke Vercel

File konfigurasi `vercel.json` sudah disiapkan. Ada dua cara mudah untuk deploy:

### Opsi A: Lewat Dashboard Vercel (Paling Mudah)
1. Buka [vercel.com](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Klik **"Add New..."** &rarr; **"Project"**.
3. Pilih repository `paranoid-noise` yang baru Anda push ke GitHub.
4. Pada bagian **Environment Variables** (opsional jika memakai Supabase):
   * `VITE_SUPABASE_URL` : URL proyek Supabase Anda
   * `VITE_SUPABASE_ANON_KEY` : Anon key Supabase Anda
5. Klik **"Deploy"**. Website Anda akan live dalam waktu sekitar 30 detik!

### Opsi B: Lewat Terminal (Vercel CLI)
```bash
npx vercel
```
Ikuti instruksi di terminal (tekan Enter untuk opsi default).

---

## 🗄️ Menghubungkan ke Supabase (Database Backend)

Website ini sudah didesain 100% fungsional tanpa backend (otomatis menyimpan ke LocalStorage), namun siap terhubung ke Supabase kapan saja:

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor** di dashboard Supabase.
3. Salin seluruh isi file `supabase-schema.sql` dan klik **Run**.
4. Buat file `.env` di folder project (atau isi di environment variable Vercel):
   ```env
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
Semua booking panggung dan pemesanan tiket RSVP akan otomatis tersinkronisasi ke tabel database Supabase Anda.
