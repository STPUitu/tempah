# 🐣 Sistem Tempahan Produk Unggas (S.T.P.U)

![Tahun](https://img.shields.io/badge/Tahun-2026-green)
![Platform](https://img.shields.io/badge/Platform-PWA%20%2B%20Google%20Apps%20Script-blue)
![Agensi](https://img.shields.io/badge/Agensi-ITU%20%7C%20JPV-orange)

Sistem Tempahan Produk Unggas (S.T.P.U) ialah aplikasi web ringkas, responsif, dan **boleh dipasang sebagai aplikasi (PWA)** yang dibangunkan untuk **Institut Teknologi Unggas (ITU), Jabatan Perkhidmatan Veterinar (JPV)**. Sistem ini berfungsi sebagai hab sehenti bagi pelanggan untuk membuat tempahan produk unggas (puyuh dan ayam kampung) serta menyemak status tempahan mereka secara telus.

🔗 **Akses sistem:** [stpuitu.github.io/tempah](https://stpuitu.github.io/tempah/)

---

## 🗺️ Aliran Data & Seni Bina Sistem

Sistem ini dibina berasaskan ekosistem Google tanpa memerlukan pelayan (serverless) luaran, dengan **GitHub Pages** sebagai hos antara muka utama:

1. **Frontend / PWA (`index.html`)**: Antara muka pengguna (*Single Page Application*) menggunakan HTML5, CSS3 (Plus Jakarta Sans, Font Awesome), dan JavaScript. Dihoskan di **GitHub Pages** (`stpuitu.github.io/tempah`) dan boleh dipasang ke skrin utama telefon ("Add to Home Screen") melalui `manifest.json` dan `sw.js` (service worker).
2. **Borang Pengesahan**: Menggunakan Google Forms untuk mengutip data tempahan bagi mengelakkan isu limpahan trafik langsung ke pangkalan data.
3. **Backend / API (`Code.gs`)**: Berjalan di atas **Google Apps Script** sebagai **API** sahaja. Endpoint `/exec?action=semak&ic=xxxxx` melakukan carian silang produk menggunakan No. Kad Pengenalan (IC) dan mengembalikan keputusan dalam format JSON. Melawat `/exec` tanpa parameter akan redirect terus ke `stpuitu.github.io/tempah`.
4. **Pangkalan Data (Google Sheets)**: Setiap produk mempunyai fail Google Sheets tersendiri untuk menyimpan maklumat pelanggan, status tempahan, dan pautan slip pesanan.

### Carta Aliran Ringkas

```
Pengguna
  |
  v
stpuitu.github.io/tempah (PWA, index.html)
  |  - Senarai Produk -> Google Forms (tempahan)
  |  - Semakan Status -> fetch() ke Apps Script API
  v
/exec?action=semak&ic=xxxxx  (Code.gs, doGet)
  |
  v
Google Sheets (6 produk) -> JSON { ok, results: [...] }
```

---

## 📦 Komponen Fail

| Fail | Fungsi |
| :--- | :--- |
| `index.html` | Antara muka pengguna penuh (PWA) — Senarai Produk, Semakan Status, Maklumbalas. Dihoskan di GitHub Pages. |
| `manifest.json` | Konfigurasi PWA (nama, ikon, `start_url`, mod `standalone`) untuk "Add to Home Screen". |
| `sw.js` | Service worker — cache shell statik untuk akses pantas, network-first untuk panggilan API. |
| `icon-192.png`, `icon-512.png` | Ikon aplikasi S.T.P.U. |
| `Code.gs` | Backend Google Apps Script — konfigurasi ID Spreadsheet, `doGet` (API + redirect), dan logik carian `semakTempahan`. |
| `appsscript.json` | Manifest projek Apps Script (timezone, akses web app). |
| `.clasp.json` / `.claspignore` | Konfigurasi [clasp](https://github.com/google/clasp) untuk sync `Code.gs` & `appsscript.json` terus ke Apps Script Editor. |

---

## 📋 Senarai Produk & Padanan Data

Sistem ini memantau **6 produk utama** yang diuruskan melalui pautan Google Sheets berbeza:

| Bil | Produk Unggas | Kategori | Had Minimum | Kolum Status | Kolum Slip |
| :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | Telur Bernas Ayam Kampung | Ayam Kampung | 200 biji | M (13) | O (15) |
| 2 | Anak Ayam Kampung | Ayam Kampung | 50 ekor | M (13) | O (15) |
| 3 | Telur Bernas Puyuh Pedaging (IKTA) | Puyuh · Pedaging | 1,000 biji | L (12) | N (14) |
| 4 | Anak Puyuh Pedaging (IKTA) | Puyuh · Pedaging | 100 ekor | L (12) | N (14) |
| 5 | Telur Bernas Puyuh Penelur | Puyuh · Penelur | 1,000 biji | L (12) | N (14) |
| 6 | Anak Puyuh Penelur | Puyuh · Penelur | 100 ekor | L (12) | O (15) |

> Nota: nombor lajur (M, L, O, N) merujuk lajur sebenar pada setiap helaian Google Sheets, dan boleh berbeza antara produk kerana struktur borang yang sedikit berbeza. Lihat [`TECHNICAL_SPEC.md`](./TECHNICAL_SPEC.md) untuk pemetaan penuh.

---

## 🛠️ Langkah Pemasangan & Pembangunan

Sila rujuk fail [**`DEPLOYMENT.md`**](./DEPLOYMENT.md) untuk panduan lengkap langkah demi langkah cara memasang dan menyebarkan sistem ini (GitHub Pages + Google Apps Script).

## 👥 Hak Cipta & Penafian
* **Hak Cipta © 2026 Institut Teknologi Unggas, JPV.**
* Sistem ini menegaskan polisi tanpa ejen/orang tengah. Segala urus niaga dan bayaran hanya dilakukan secara bersemuka semasa pengambilan produk di lokasi Masjid Tanah, Melaka.
