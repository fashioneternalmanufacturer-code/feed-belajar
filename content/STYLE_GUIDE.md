# Panduan Penulisan Cerita — Bank Cerita Feed Belajar

Panduan ini dipakai tiap kali menulis batch cerita baru, supaya gaya konsisten
walau ditulis di sesi/percakapan yang berbeda-beda.

## Akurasi
- Fakta yang sudah mapan (tanggal, nama, angka, kejadian terverifikasi) ditulis tegas, tanpa qualifier.
- Legenda, anekdot populer, atau kutipan yang belum tentu akurat historisnya WAJIB
  ditandai eksplisit di dalam teks cerita: "konon...", "menurut cerita populer...",
  atau sejenisnya. Jangan sajikan anekdot/legenda sebagai fakta pasti.
- Selalu cek fakta ke Wikipedia (atau sumber primer yang kredibel) sebelum menulis
  ulang jadi gaya cerita. Field `sourceUrl` wajib diisi dengan link yang benar-benar
  dipakai untuk cek fakta.
- Hindari angka/tanggal yang tidak pasti atau diperdebatkan sejarawan; kalau
  terpaksa dipakai, beri qualifier ("sekitar", "diperkirakan").
- Setelah menulis satu batch, buat daftar 2-3 fakta yang paling "berani"/kurang
  pasti supaya pengguna bisa mengecek ulang.

## Variasi pembukaan
Jangan selalu mulai dengan pola yang sama ("Kota, tahun." atau "Bayangkan...").
Variasikan antar cerita dalam satu batch dengan pola seperti:
- pertanyaan ke pembaca
- fakta/angka mengejutkan di kalimat pertama
- dialog atau kutipan langsung
- langsung di tengah aksi (in medias res)
- "Kota, tahun." (dipakai sesekali saja)
**Dalam satu batch (±25 cerita), maksimal 3 cerita boleh memakai pola pembukaan yang sama.**

## Gaya bahasa
- Tanda pisah (—): maksimal 2 per cerita.
- Huruf kapital untuk penekanan (misalnya "TERTUA"): maksimal 1 kali per cerita.
- Bahasa santai, seperti ngobrol dengan teman — bukan gaya ensiklopedia.
- Boleh dramatis di gaya, tapi fakta di baliknya harus benar (lihat Akurasi).

## Struktur wajib tiap cerita
- `hook`: 1-2 kalimat yang bikin penasaran.
- `story`: 300-500 kata, storytelling — ada ketegangan/twist, bukan daftar fakta.
- `whyItMatters`: **wajib konkret**, relevansi untuk kehidupan sehari-hari pembaca.
  Bukan kalimat umum seperti "ini penting untuk ilmu pengetahuan", tapi sesuatu
  yang bisa langsung mereka pakai, renungkan, atau sadari dalam hidup sehari-hari.
- `keyFacts`: 3 poin singkat.
- `quiz`: 2-3 soal pilihan ganda dari isi cerita, tiap soal ada `explanation`.

## Versi English
- Level kosakata menengah (B1-B2) — hindari kata sastra/akademis yang jarang dipakai.
- Kalimat tidak terlalu panjang.
- Tetap gaya bercerita; tulis ulang secara natural, bukan terjemahan kata-demi-kata
  dari versi Indonesia.

## Topik
Hindari topik terlalu niche (desa kecil, spesies obskur, tokoh lokal tak dikenal).
Patokan: daftar Wikipedia "Vital Articles" Level 3-4, atau topik yang memang
dianggap "common knowledge" oleh orang Indonesia terdidik pada umumnya.

## Format file
Satu file JSON per kategori di `content/stories/<kategori>.json`, berisi array
objek cerita. Tiap objek: `key` (slug unik), `category`, `emoji`, `sourceUrl`,
lalu `id` dan `en` masing-masing berisi `title`, `hook`, `story`, `whyItMatters`,
`keyFacts` (array), `quiz` (array `{question, options, correctIndex, explanation}`).
