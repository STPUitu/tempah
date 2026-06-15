# 🐣 Sistem Tempahan Produk Unggas (S.T.P.U)

![Tahun](https://img.shields.io/badge/Tahun-2026-green)
![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script-blue)
![Agensi](https://img.shields.io/badge/Agensi-ITU%20%7C%20JPV-orange)

Sistem Tempahan Produk Unggas (S.T.P.U) ialah aplikasi web ringkas dan responsif yang dibangunkan untuk **Institut Teknologi Unggas (ITU), Jabatan Perkhidmatan Veterinar (JPV)**. Sistem ini berfungsi sebagai hab sehenti bagi pelanggan untuk membuat tempahan produk unggas (puyuh dan ayam kampung) serta menyemak status tempahan mereka secara telus.

---

## 🗺️ Aliran Data & Seni Bina Sistem

Sistem ini dibina berasaskan ekosistem Google tanpa memerlukan pelayan (serverless) luaran:

1. **Frontend (`index.html`)**: Antara muka pengguna menggunakan HTML5, CSS3 (Plus Jakarta Sans, Font Awesome), dan JavaScript (Google Apps Script API).
2. **Borang Pengesahan**: Menggunakan Google Forms untuk mengutip data tempahan bagi mengelakkan isu limpahan trafik langsung ke pangkalan data.
3. **Backend (`Code.gs`)**: Berjalan di atas Google Apps Script untuk melayan (*serve*) halaman web dan melakukan carian silang produk menggunakan No. Kad Pengenalan (IC).
4. **Pangkalan Data (Google Sheets)**: Setiap produk mempunyai fail Google Sheets tersendiri untuk menyimpan maklumat pelanggan, status tempahan, dan pautan slip pesanan.

---

## 📦 Komponen Fail

Repositori ini mengandungi komponen-komponen utama berikut:

* **`Code.gs`**: Kod backend Google Apps Script yang mengandungi konfigurasi ID Spreadsheet, fungsi pautan pelayan (`doGet`), dan logik carian data (`semakTempahan`).
* **`index.html`**: Fail frontend tunggal yang merangkumi reka bentuk antaramuka (*Single Page Application*), pengurusan tab (Senarai Produk, Semakan, Maklumbalas), serta logik skrip klien.

---

## 📋 Senarai Produk & Padanan Data

Sistem ini memantau **6 produk utama** yang diuruskan melalui pautan Google Sheets berbeza:

| Bil | Produk Unggas | Kategori | Had Minimum | Kolum Status | Kolum Slip |
| :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | Anak Puyuh Pedaging (IKTA) | Puyuh · Pedaging | 100 ekor | M (13) | P (15) |
| 2 | Telur Bernas Puyuh Pedaging (IKTA) | Puyuh · Pedaging | 1,000 biji | L (12) | O (14) |
| 3 | Anak Puyuh Penelur | Puyuh · Penelur | 100 ekor | L (12) | O (14) |
| 4 | Telur Bernas Puyuh Penelur | Puyuh · Penelur | 1,000 biji | L (12) | O (14) |
| 5 | Anak Ayam Kampung | Ayam Kampung | 50 ekor | M (13) | P (15) |
| 6 | Telur Bernas Ayam Kampung | Ayam Kampung | 200 biji | M (12) | P (15) |

---

## 🛠️ Langkah Pemasangan & Pembangunan

Sila rujuk fail [**`DEPLOYMENT.md`**](./DEPLOYMENT.md) untuk panduan lengkap langkah demi langkah cara memasang dan melancarkan sistem ini di akaun Google Apps Script anda.

## 👥 Hak Cipta & Penafian
* **Hak Cipta © 2026 Institut Teknologi Unggas, JPV.**
* Sistem ini menegaskan polisi tanpa ejen/orang tengah. Segala urus niaga dan bayaran hanya dilakukan secara bersemuka semasa pengambilan produk di lokasi Masjid Tanah, Melaka.