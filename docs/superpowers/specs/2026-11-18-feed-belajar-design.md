# Feed Belajar ala TikTok — Design (disetujui 2026-11-18)

## Tujuan
PWA pribadi, gratis, tanpa backend/login. Feed vertikal full-screen kartu pengetahuan
(Wikipedia) sebagai pengganti doomscroll. Dipasang di HP via "Add to Home Screen".

## Constraints
- Tanpa API key, tanpa backend berbayar, tanpa login.
- Data pribadi (settings, streak, saved, vocab) di localStorage.
- Hosting: GitHub Pages, semua path relatif (repo subpath).
- Vanilla HTML/CSS/JS (ES modules), tanpa build tool.

## Approaches (dipilih bersama user)
- Vite vs vanilla JS: dipilih **vanilla JS tanpa build step** — deploy langsung ke
  GitHub Pages tanpa proses build, lebih mudah dirawat non-programmer.
- Topik filter: Wikipedia tidak punya filter topik resmi yang mudah dipakai tanpa key.
  Dipilih pendekatan **Action API search dengan keyword per topik** (bukan category
  tree yang rapuh), lalu ambil REST summary dari judul hasil pencarian.
- Kualitas konten: pakai heuristik (lihat bagian Quality Filter) dan "if-reroute"
  ke featured/onthisday bila random kualitasnya buruk.
- Storage: localStorage saja (bukan IndexedDB) — cukup untuk ukuran data ini, lebih
  sederhana.

## Default settings
- Bahasa: Campur, 60% English / 40% Indonesia.
- Batas kartu per sesi: 20 (bisa diubah).

## Quality Filter (Wikipedia summary)
Lewati kartu bila:
- `type === "disambiguation"`.
- `extract.length < 200` karakter.
- Deskripsi/extract mengindikasikan stub desa/kecamatan/spesies (daftar kata kunci:
  "village in", "municipality", "commune in", "district in", "genus of", "species of",
  "desa di", "kecamatan di", "genus", "spesies").
Prioritaskan kartu yang punya `thumbnail`. Jika >50% hasil random dalam satu batch
gagal filter, perbanyak porsi featured/most-read/onthisday pada batch berikutnya.

## Fitur MVP
Lihat ringkasan di chat — feed vertikal, filter topik, mode bahasa, tap-word (EN),
kuis ringan tiap 8 kartu, saved & vocab page, limit sesi, streak, PWA offline cache.

## Nama repo yang diusulkan untuk deploy
`feed-belajar`
