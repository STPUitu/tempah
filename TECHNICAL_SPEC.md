# 📐 Spesifikasi Teknikal & Struktur Data

Dokumen ini memperincikan logik fungsi pembinaan kod untuk rujukan penyelenggaraan sistem atau integrasi ejen pintar (AI/Claude).

---

## 📊 Pemetaan Kolum Spreadsheet

Sistem menggunakan pemetaan objek `COL` malar untuk menjejak indeks lajur berasaskan indeks `0` (0-based indexing):

```javascript
const COL = {
  TIMESTAMP : 0,  // Lajur A
  EMAIL     : 1,  // Lajur B
  NAMA      : 2,  // Lajur C
  IC        : 3,  // Lajur D
  TEL       : 4,  // Lajur E
  ALAMAT    : 5,  // Lajur F
  PRODUK    : 6,  // Lajur G
  KUANTITI  : 7,  // Lajur H
  NOTA      : 8,  // Lajur I
};