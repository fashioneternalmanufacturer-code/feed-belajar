# Progress — Feed Belajar

Status per 2026-11-18. Baca ini dulu kalau melanjutkan proyek di sesi baru.

## Status saat ini

- **Live di**: https://fashioneternalmanufacturer-code.github.io/feed-belajar/
- **Repo**: https://github.com/fashioneternalmanufacturer-code/feed-belajar (public)
- **Bank Cerita batch 1 selesai**: 30 cerita bilingual (5 contoh awal + 25 batch 1),
  9 kategori, semua sudah punya ilustrasi (hero + 2 gambar adegan tiap cerita =
  90 file gambar).
- **Gaya gambar final**: flat vector illustration, digenerate via Cloudflare
  Workers AI (FLUX.1 schnell), gratis, tanpa watermark. Lihat
  `content/IMAGE_STYLE_GUIDE.md`.
- **Aturan penulisan cerita**: lihat `content/STYLE_GUIDE.md` (akurasi, hedging
  "konon", variasi pembukaan, dll — ini aturan baku, ikuti di batch berikutnya).

## Yang TIDAK ikut ke repo publik (sengaja)

- `tools/` (generator gambar, `gallery.html` review tool) — dev-only, lokal saja.
- `.env`, `.env.example` — kredensial Cloudflare.
- `assets/img/_pollinations-backup/` — cadangan gambar lama (watermarked, tidak dipakai).
- `assets/img/_style-test/` — riwayat percobaan gaya gambar.

Semua itu masih ada di laptop lokal, cuma tidak di-commit. Kalau pindah laptop,
backup folder `tools/` secara manual.

## Cara lanjut generate gambar (di laptop ini)

```bash
cd "C:\Data D\Aplikasi Tiktok"
python tools/generate-images.py batch --backend cloudflare
```

Otomatis skip cerita yang sudah punya gambar. Autentikasi pakai token OAuth
`wrangler` (auto-refresh) — kalau error "tidak ada kredensial", jalankan
`npx wrangler login` dulu. Kalau kena rate-limit (HTTP 429) setelah batch besar,
tunggu beberapa menit lalu ulangi — ini batas burst Cloudflare, bukan soal kuota
harian (kuota 10.000 neuron/hari, ~58 neuron/gambar).

## Yang masih di-cek per 2026-11-18

Dua gambar sedang di-generate ulang (rate-limited, retry otomatis sedang
berjalan di background saat catatan ini ditulis):
- `krakatau-1883-suara-terkeras/hero` — versi lama ada pesawat terbang yang
  anakronistik untuk tahun 1883.
- `dopamin-notifikasi-hp/hero` — versi lama ada angka "77"/"8" di mesin slot.

Kalau sesi baru melihat file-file itu masih berupa gambar lama (bukan yang baru),
jalankan ulang perintah batch di atas untuk menyelesaikannya (keduanya sudah
dihapus dari `assets/img/`, jadi script otomatis akan generate ulang).

## Langkah selanjutnya (sesuai rencana awal user)

1. Setelah batch 1 dikonfirmasi oke (sudah, lanjut dikerjakan), lanjut batch-batch
   berikutnya sampai ~100 cerita total. User bisa minta spesifik, misalnya
   "tambah 25 cerita kategori Psikologi & Kebiasaan".
2. Tiap batch baru: tulis cerita ikuti `content/STYLE_GUIDE.md`, tulis field
   `images` tiap cerita ikuti `content/IMAGE_STYLE_GUIDE.md`, generate gambar,
   update galeri (`tools/gallery.html`, lokal saja) untuk direview user, baru
   commit + push.
3. **Wajib tiap kali push perubahan konten/kode**: naikkan
   `CACHE_VERSION` di `sw.js` (sekarang `"v3"`) supaya HP yang sudah install
   tidak nyangkut di versi lama.
4. Fitur "Lihat Aslinya" (foto/lukisan asli dari Wikimedia Commons dengan
   kredit+lisensi) sudah ada skeleton kodenya di `js/ui.js`
   (`card.commonsImage`) tapi belum ada satu pun cerita yang diisi datanya.
   Masih perlu: cek lisensi lewat Commons API per cerita, isi field
   `commonsImage` di JSON.
5. Ide fitur lanjutan lain: lihat bagian akhir `README.md`.

## Kredensial & akses

- Login GitHub CLI (`gh`) sudah dilakukan di sesi ini, tersimpan di keyring
  Windows laptop ini.
- Login Cloudflare (`wrangler`) juga sudah dilakukan, token OAuth tersimpan di
  `%APPDATA%\xdg.config\.wrangler\config\default.toml`, auto-refresh.
- Repo GitHub: public, dimiliki akun `fashioneternalmanufacturer-code`.
