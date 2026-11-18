# Panduan Gaya Gambar — Bank Cerita Feed Belajar

Resep gaya untuk semua ilustrasi yang di-generate lewat Cloudflare Workers AI
(FLUX.1 [schnell]), supaya hasilnya konsisten walau dibuat di batch/sesi
berbeda.

**Status: FINAL, sudah dipilih dan diuji.**

## Riwayat singkat (kenapa backend-nya Cloudflare, bukan Pollinations)

Percobaan pertama pakai Pollinations.ai gratis gagal: tier gratisnya cuma
punya satu model ("sana") yang condong kuat ke gaya "lukisan digital
sinematik" apa pun kata kunci gayanya — flat-vector, watercolor, comic, clay,
anime semua keluar mirip (lihat file `piramida-a/b/c/d/...` di
`assets/img/_style-test/`), plus selalu ada watermark dan resolusi dibatasi
768×768. Pindah ke Cloudflare Workers AI (FLUX.1 schnell, gratis 10.000
neuron/hari, ~58 neuron/gambar, tanpa watermark) menyelesaikan semua masalah
itu — FLUX benar-benar mengikuti gaya yang diminta (lihat file
`piramida-cf-a/b/c/d.webp`). User memilih **flat vector** dari 4 opsi.

## Kalimat gaya final

```
Flat vector illustration, bold saturated flat colors, clean simple geometric
shapes, minimal shading, modern flat-design poster art of
```

Dipakai sebagai prefix di setiap prompt (lihat `STYLE_PREFIX` di
`tools/generate-images.py`), diikuti deskripsi adegan spesifik cerita, lalu
baris larangan standar (`NEGATIVE_SUFFIX`): `no text, no words, no logo, no
watermark, no signature`.

## Aturan wajib di setiap prompt (anti-cacat)

- **Tanpa teks/tulisan apa pun di dalam gambar** — selalu tambahkan `no text, no words` di prompt.
- **Tanpa logo/merek** — tambahkan `no logo, no watermark` (watermark Pollinations dari tier gratis tetap muncul di luar kendali prompt, lihat catatan di bawah).
- **Tidak meniru karakter berhak cipta** (Disney, Pixar, dll) atau gaya studio animasi tertentu yang terlalu spesifik/dikenali — pakai istilah generik ("claymation style", bukan "Aardman style"; "flat vector", bukan "merek studio X").
- **Tidak boleh ada objek yang tidak sesuai zamannya** di adegan historis — tidak boleh ada pesawat terbang, mobil, listrik modern, lampu listrik, atau pakaian modern di adegan yang berlatar sebelum teknologi itu ada. Ini sudah otomatis ditambahkan ke `NEGATIVE_SUFFIX` di `tools/generate-images.py`, tapi tetap sebutkan era & lokasi spesifik di `scene` supaya modelnya tidak menebak-nebak.
- Untuk adegan sejarah: sebutkan era, pakaian, lokasi secara spesifik supaya akurat secara visual, tapi ini ilustrasi — bukan rekonstruksi dokumenter.

## Palet warna

Gaya flat-vector dari FLUX secara alami condong ke warna cerah/berani (biru
langit, krem/cokelat tanah, aksen warna solid) — kontras baik dengan dark
mode aplikasi (`css/style.css`): overlay gelap di kartu feed tetap membuat
gambar menonjol di atas latar gelap UI.

## Komposisi

- Hero image: wide/landscape, subjek jelas di tengah atau sepertiga bidang, ruang kosong secukupnya di atas/bawah untuk overlay gelap + teks hook di kartu feed.
- Scene image (1-3 per cerita): lebih dekat ke momen spesifik di paragraf terkait, boleh potret atau landscape sesuai adegan.

## Keterbatasan teknis Cloudflare Workers AI (FLUX.1 schnell)

- Free tier: 10.000 neuron/hari, reset 00:00 UTC. **Realita terpakai jauh lebih besar dari perkiraan rumus resmi Cloudflare** (per-tile + per-step) — dari insiden nyata tanggal 2026-11-18, 90 gambar menghabiskan SELURUH jatah 10.000 neuron (dikonfirmasi lewat pesan error server), jadi realitanya sekitar **111 neuron/gambar**, bukan ~58 seperti perkiraan rumus. Script `tools/generate-images.py` sekarang pakai estimasi flat terkalibrasi (`CF_NEURONS_PER_IMAGE_ESTIMATE = 115`) supaya auto-stop beneran berhenti SEBELUM limit asli tercapai. Artinya realistisnya cuma sekitar **~78 gambar/hari** gratis, bukan ~150. Script melacak estimasi pemakaian di `tools/.cf-usage.json` dan berhenti otomatis sebelum limit, resume besok (file yang sudah ada di-skip).
- Parameter `seed` TIDAK didukung endpoint REST model ini (beda dari contoh di dokumentasi Worker-binding) — jadi gambar tidak reproducible persis, tiap generate ulang hasilnya sedikit berbeda meski prompt sama.
- Autentikasi: lewat token OAuth `wrangler login` (auto-refresh tiap script jalan) atau token manual di `.env` kalau `CLOUDFLARE_ACCOUNT_ID`+`CLOUDFLARE_API_TOKEN` diisi.
- Output JPEG ~1024×1024, script meng-encode ulang ke WebP (~1024px lebar, target <150KB).

## Format field gambar di JSON cerita

Ditambahkan ke tiap objek cerita di `content/stories/<kategori>.json`:

```json
"images": {
  "hero": {
    "file": "hero.webp",
    "scene": "deskripsi adegan hero dalam bahasa Inggris (tanpa prefix gaya, itu ditambahkan otomatis oleh script)",
    "seed": 42,
    "alt": "Deskripsi alt text singkat (ID)",
    "caption": "Keterangan singkat di bawah gambar (opsional)"
  },
  "scene1": { "file": "scene1.webp", "scene": "...", "seed": 43, "alt": "..." },
  "scene2": { "file": "scene2.webp", "scene": "...", "seed": 44, "alt": "..." }
}
```

`scene` HANYA deskripsi adegan itu sendiri — `tools/generate-images.py`
otomatis menempelkan `STYLE_PREFIX` di depan dan `NEGATIVE_SUFFIX` di
belakang saat generate, supaya gaya selalu konsisten tanpa perlu
copy-paste kalimat gaya di tiap cerita.

File fisik disimpan di `assets/img/<story-key>/<file>`, tidak di-hotlink saat
runtime — hanya script lokal (`tools/generate-images.py`) yang memanggil API
generator gambar.

## Foto/lukisan asli (Wikimedia Commons)

Untuk bagian "Lihat Aslinya" di akhir cerita: field tambahan `commonsImage`
berisi `{ file, title, author, license, sourceUrl }`, diisi hanya dari hasil
cek lisensi lewat Commons API (public domain atau CC). Lisensi + kredit
ditampilkan kecil di bawah gambar tersebut di halaman cerita.
