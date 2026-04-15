# Product Requirement Document (PRD): AuraTrack

## 1. Identitas Proyek
* **Nama Produk:** AuraTrack (Strava Clone)
* **Platform:** Android (React Native)
* **Target User:** Pelari, Pesepeda, dan Penggemar Kebugaran.
* **Tujuan:** Menyediakan alat pelacak aktivitas yang akurat dengan fitur berbagi pencapaian yang estetik.

---

## 2. Fitur Utama (Core Features)

### 2.1. Pelacakan Aktivitas (Tracking)
* **GPS Real-time:** Mencatat koordinat setiap 1 detik.
* **Metrik Performa:** Menghitung Jarak, Durasi, Pace (menit/km), dan Elevasi.
* **Background Service:** Pelacakan tetap berjalan meskipun aplikasi di-minimize atau layar mati.
* **Auto-Pause:** Berhenti mencatat saat kecepatan di bawah 0.5 m/s.

### 2.2. Visualisasi Rute (Mapping)
* **Dynamic Polyline:** Menggambar jalur lari di peta secara langsung.
* **Pace Heatmap:** Garis rute berubah warna berdasarkan kecepatan (Merah: Lambat, Hijau: Cepat).
* **Split Markers:** Penanda otomatis setiap kelipatan 1 km.

### 2.3. Fitur Berbagi (Social Share) - **HIGH PRIORITY**
* **Snapshot Engine:** Mengonversi UI ringkasan menjadi gambar (JPG/PNG).
* **Stats Overlay:** Menampilkan Pace, Jarak, dan Map Snippet di atas foto atau background peta.
* **Social Integration:** Berbagi langsung ke Instagram Stories, WhatsApp, dan platform sosial lainnya.

---

## 3. Spesifikasi Teknis (Technical Stack)

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | React Native (TypeScript) | Struktur kode yang kuat dan reusable. |
| **Peta** | React Native Maps (Google SDK) | Render rute dan heatmap. |
| **Location** | RN Geolocation Service | High accuracy GPS tracking. |
| **Backend** | Node.js (Fastify) | Penanganan data koordinat JSON yang cepat. |
| **Database** | PostgreSQL + PostGIS | Kalkulasi geometri rute di sisi server. |
| **Image Process** | RN View Shot | Untuk fitur "Share Track". |

---

## 4. Alur Kerja Fitur Berbagi (Social Share Flow)

1.  **Penyelesaian Aktivitas:** User menekan tombol 'Finish'.
2.  **Generasi Data:** Aplikasi menghitung total jarak dan rata-rata pace.
3.  **Kustomisasi Kartu:** User memilih apakah ingin menggunakan background peta atau foto galeri.
4.  **Capture:** Fungsi `captureRef()` mengambil screenshot pada komponen kartu statistik.
5.  **Distribusi:** Memanggil `Share.open()` untuk membagikan URI gambar ke media sosial.

---

## 5. Kebutuhan Non-Fungsional
* **Akurasi:** Toleransi kesalahan GPS maksimal 2-5% dari jarak asli.
* **Efisiensi Baterai:** Optimalisasi interval GPS agar tidak menguras baterai secara ekstrem.
* **Offline Capability:** Data harus tersimpan di lokal (SQLite/MMKV) sebelum berhasil di-upload ke server.