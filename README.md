# Feed Belajar

Feed belajar ala TikTok — pengganti doomscroll. 100% gratis, tanpa login, tanpa
server berbayar. Semua data pribadi (simpanan, kosakata, streak, pengaturan)
tersimpan di HP Anda sendiri (localStorage browser).

## Daftar isi
1. [Menjalankan di laptop](#1-menjalankan-di-laptop)
2. [Deploy ke GitHub Pages](#2-deploy-ke-github-pages)
3. [Pasang di HP](#3-pasang-di-hp)
4. [Menambah kartu sendiri](#4-menambah-kartu-sendiri)
5. [Update aplikasi setelah online](#5-update-aplikasi-setelah-online)
6. [Ide fitur lanjutan (gratis)](#6-ide-fitur-lanjutan-gratis)

---

## 1. Menjalankan di laptop

Karena aplikasi ini pakai Service Worker (untuk mode offline) dan modul
JavaScript, Anda **tidak bisa** buka `index.html` langsung dengan dobel-klik
(protokol `file://` tidak didukung browser untuk ini). Harus lewat server
lokal kecil. Paling gampang pakai Python (biasanya sudah ada di laptop):

```bash
cd "C:\Data D\Aplikasi Tiktok"
python -m http.server 8787
```

Lalu buka `http://localhost:8787` di browser. Kalau `python` tidak dikenali,
coba `py -m http.server 8787`.

Coba semua fitur: scroll kartu, tap kata (mode English), tombol Simpan,
halaman Tersimpan/Kosakata/Pengaturan. Tekan `Ctrl+C` di terminal untuk
mematikan server.

---

## 2. Deploy ke GitHub Pages

**Status: sudah live** di https://fashioneternalmanufacturer-code.github.io/feed-belajar/
Repo: https://github.com/fashioneternalmanufacturer-code/feed-belajar

Langkah di bawah ini untuk referensi kalau perlu bikin ulang dari nol (repo
baru, akun baru, dsb).

### a. Buat akun & repo GitHub (kalau belum punya)
1. Buat akun di [github.com](https://github.com) kalau belum punya.
2. Klik tombol **New repository**.
3. Nama repo: `feed-belajar` (tanpa spasi, huruf kecil).
4. Pilih **Public**, jangan centang "Add README" (kita sudah punya).
5. Klik **Create repository**.

### b. Unggah file project
Paling mudah lewat terminal (ganti `USERNAME` dengan username GitHub Anda):

```bash
cd "C:\Data D\Aplikasi Tiktok"
git init
git add .
git commit -m "Initial commit: feed belajar"
git branch -M main
git remote add origin https://github.com/USERNAME/feed-belajar.git
git push -u origin main
```

Kalau belum pernah pakai git dari terminal, git akan minta login — ikuti
instruksi di layar (biasanya buka browser untuk login GitHub).

Alternatif tanpa terminal: di halaman repo GitHub, klik **Add file → Upload
files**, lalu seret semua file & folder dari `C:\Data D\Aplikasi Tiktok`.

### c. Aktifkan GitHub Pages
1. Di halaman repo, buka tab **Settings**.
2. Di sidebar kiri, klik **Pages**.
3. Di bagian **Source**, pilih branch `main`, folder `/ (root)`.
4. Klik **Save**.
5. Tunggu 1–2 menit, lalu refresh halaman itu — akan muncul link:
   `https://USERNAME.github.io/feed-belajar/`

Buka link itu di browser — aplikasi Anda sudah online!

---

## 3. Pasang di HP

### Android (Chrome)
1. Buka link `https://fashioneternalmanufacturer-code.github.io/feed-belajar/` di Chrome.
2. Ketuk menu titik tiga (⋮) di kanan atas.
3. Pilih **Add to Home screen** / **Tambahkan ke layar utama**.
4. Konfirmasi nama, ketuk **Add**.

### iPhone (Safari)
1. Buka `https://fashioneternalmanufacturer-code.github.io/feed-belajar/` di Safari (harus Safari, bukan Chrome, untuk fitur ini).
2. Ketuk ikon **Share** (kotak dengan panah ke atas).
3. Scroll, pilih **Add to Home Screen**.
4. Ketuk **Add**.

Setelah terpasang, ikon muncul di layar utama seperti aplikasi biasa dan
terbuka full-screen tanpa address bar.

---

## 4. Menambah cerita sendiri (Bank Cerita)

Konten utama feed sekarang bukan lagi artikel Wikipedia acak, tapi cerita
bilingual (ID/EN) buatan sendiri, disimpan per kategori di
`content/stories/<kategori>.json` (misalnya `sejarah-dunia.json`). Tiap
cerita berisi `key`, `category`, `emoji`, `sourceUrl`, blok `images`
(hero + gambar adegan), lalu blok `id` dan `en` masing-masing dengan
`title`, `hook`, `story`, `whyItMatters`, `keyFacts`, `quiz`.

Aturan penulisan lengkap (akurasi, gaya bahasa, variasi pembukaan, dll) ada
di [`content/STYLE_GUIDE.md`](content/STYLE_GUIDE.md). Resep gaya gambar ada
di [`content/IMAGE_STYLE_GUIDE.md`](content/IMAGE_STYLE_GUIDE.md).

Mode Jelajah (live artikel Wikipedia) masih ada sebagai opsi di Pengaturan,
default mati.

Setelah menambah/mengubah cerita, commit & push lagi ke GitHub (lihat
bagian 5) — dan jangan lupa naikkan `CACHE_VERSION` di `sw.js` supaya HP
yang sudah install tidak nyangkut di data lama.

---

## 5. Update aplikasi setelah online

**Paling gampang: pakai `deploy.py` / `deploy.bat`.** Ini satu perintah yang
otomatis menaikkan `CACHE_VERSION` di `sw.js`, commit, dan push — supaya
tidak ada yang lupa menaikkan versi cache (lihat kenapa itu penting di
bawah).

- Lewat terminal: `python deploy.py "pesan commit singkat"`
- Lewat File Explorer: dobel-klik `deploy.bat`, ketik pesan commit saat diminta.

Kalau dijalankan tanpa ada perubahan apa pun, script cuma bilang "Tidak ada
perubahan untuk di-deploy" dan tidak melakukan apa-apa (aman dijalankan
berkali-kali).

<details>
<summary>Kenapa harus naikkan CACHE_VERSION (detail teknis)</summary>

Service Worker (`sw.js`) meng-cache semua file app shell dengan nama cache
yang mengandung `CACHE_VERSION`. Selama nama cache itu sama, Service Worker
tidak akan mengambil ulang file dari internet — jadi kalau Anda push
perubahan tanpa menaikkan versi ini, HP yang sudah pernah membuka aplikasi
bisa nyangkut di versi lama tanpa sadar. `deploy.py` menangani ini otomatis.

Kalau pakai git manual (tanpa `deploy.py`):
```bash
cd "C:\Data D\Aplikasi Tiktok"
git add .
git commit -m "Update: <jelaskan perubahannya>"
git push
```
Jangan lupa naikkan angka di `const CACHE_VERSION = "v5";` (jadi `"v6"`, dst.)
di `sw.js` SEBELUM commit.
</details>

GitHub Pages otomatis update beberapa menit setelah push. Di HP, cukup
tutup aplikasi dari recent apps lalu buka lagi (atau refresh kalau lewat
browser biasa) — Service Worker baru otomatis mengambil alih begitu
`CACHE_VERSION` berbeda dari yang tersimpan di HP.

---

## 6. Ide fitur lanjutan (gratis)

Semua ide berikut tetap bisa 100% gratis tanpa backend:

- **Notifikasi harian** pakai `Notification` API + `periodicSync` (dukungan
  terbatas, terutama di Android) untuk pengingat belajar.
- **Mode highlight teks**: simpan potongan kalimat favorit, bukan cuma kata.
- **Spaced repetition** sederhana untuk Kosakata Saya (ulangi kata yang lama
  tidak dibuka).
- **Statistik lebih detail**: grafik mingguan/bulanan pakai Chart.js (via CDN,
  masih gratis & tanpa server).
- **Export/Import data**: tombol di Pengaturan untuk download/upload file
  JSON berisi semua data localStorage, buat pindah HP atau backup manual.
- **Mode belajar fokus per-topik**: urutan kartu disusun seperti kurikulum,
  bukan acak murni.
- **Dukungan bahasa lain** (misal Jepang/Korea) — Wikipedia REST API
  mendukung banyak bahasa, tinggal tambah pilihan di Pengaturan.
- **Widget Android** via PWA (Web App Manifest shortcuts) untuk akses cepat.

---

## Struktur project

```
index.html, manifest.json, sw.js   — shell PWA (ingat naikkan CACHE_VERSION di sw.js tiap update)
css/style.css                      — semua styling
js/app.js                          — init & routing antar layar
js/feed.js                         — pemilihan & urutan cerita, shuffle-bag per kategori
js/quiz.js                         — kuis dari cerita yang sudah dibaca
js/vocab.js                        — tap-kata & kosakata
js/storage.js                      — localStorage (settings/saved/vocab/stats)
js/ui.js                           — pembuatan elemen DOM (kartu, halaman detail cerita)
js/sources/stories.js              — load & localize Bank Cerita
js/sources/wikipedia.js            — Mode Jelajah (live Wikipedia, default mati)
js/sources/dictionary.js           — Free Dictionary API
content/stories/<kategori>.json    — Bank Cerita, 9 kategori
content/STYLE_GUIDE.md             — panduan menulis cerita
content/IMAGE_STYLE_GUIDE.md       — panduan gaya gambar
assets/img/<story-key>/            — gambar hero + adegan tiap cerita
```
