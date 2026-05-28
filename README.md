# Billet: On-Chain Smart Ticketing Protocol

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-e6e6e6?style=flat-square&logo=solidity&logoColor=black)
![Foundry](https://img.shields.io/badge/Foundry-FF8000?style=flat-square)
![Ponder](https://img.shields.io/badge/Ponder-8A2BE2?style=flat-square)
![Base](https://img.shields.io/badge/Base-0052FF?style=flat-square&logo=base&logoColor=white)

**Billet** adalah protokol smart ticketing on-chain berbasis **ERC-1155** dengan mekanisme *trustless escrow* dan restriksi ekonomi untuk mitigasi *scalping* tiket. Protokol ini menciptakan ekosistem tertutup yang memberdayakan penyelenggara acara (promotor) dan melindungi konsumen dari praktik calo tiket, kerentanan *bot*, serta penipuan di pasar sekunder.

Sistem ini berjalan sepenuhnya secara Web3 di atas jaringan **Base (Layer 2)**, mendelegasikan seluruh aturan bisnis dan penyimpanan status kepemilikan langsung ke jaringan blockchain tanpa bergantung pada *database* terpusat.

---

## Fitur Utama

### Anti-OTC Bypass (Restriksi Transfer Mandiri)
Memaksa seluruh transaksi sekunder tunduk pada aturan *Price Ceiling* dan pembagian royalti. Tiket NFT tidak dapat dikirim secara mandiri secara *Peer-to-Peer* (P2P), melainkan wajib melalui *Smart Contract Marketplace* resmi.

### Customizable Price Ceiling Enforcement
Penyelenggara acara dapat menentukan batas harga jual kembali sekunder secara spesifik untuk setiap kategori tiket (misal 110% dari harga *face-value*). Sistem secara otomatis menolak transaksi yang melampaui batas harga ini.

### Conditional & Customizable Royalty (ERC-2981)
Menerapkan persentase royalti dinamis untuk penyelenggara acara. Royalti ditarik secara langsung (*direct routing*) jika tiket dijual dengan keuntungan. Jika tiket dijual rugi atau impas, royalti secara otomatis dinonaktifkan (0%) untuk menjaga likuiditas penggemar.

### Sales Time Window Validation
Menyediakan fitur pengaturan rentang waktu (*saleStart* dan *saleEnd*) penjualan tiket perdana secara *on-chain* untuk otomatisasi pengelolaan jadwal penjualan (seperti *presale* atau *early bird*), sekaligus memblokir *bot* yang mencoba membeli di luar waktu resmi.

### On-Chain Identity Gating & Gatekeeper Used Marking
Memastikan keamanan verifikasi pada gerbang masuk dengan menyimpan asosiasi identitas fisik (Nama & NIK) pemegang tiket secara *on-chain*. Pengunjung cukup memindai QR code dari *public address* dompet mereka tanpa dikenakan biaya gas.

---

## Teknologi & Arsitektur

Project ini dibangun menggunakan arsitektur **Monorepo** yang memisahkan *Smart Contract*, *Indexer*, dan *Frontend* untuk pengelolaan sistem yang terukur.

### Blockchain (Smart Contract)
* **Base (Layer 2):** Jaringan L2 EVM yang dirancang untuk transaksi sangat murah dan cepat.
* **Solidity 0.8.x:** Bahasa pemrograman *Smart Contract*.
* **Foundry:** Framework pengembangan untuk kompilasi, *testing*, dan *deployment*.

### Indexer
* **Ponder:** Framework indexing yang cepat dan efisien untuk membaca serta menyajikan data *event* *smart contract* dari blockchain menggunakan GraphQL API lokal.

### Frontend (DApp)
* **Next.js:** Framework React untuk membangun antarmuka web dengan skalabilitas tinggi.
* **Wagmi / Viem:** Interaksi dan integrasi dengan jaringan Ethereum.
* **Tailwind CSS:** *Utility-first styling* untuk UI/UX yang responsif dan elegan.

---

## Struktur Direktori

```bash
Billet/
├── contracts/                 # SMART CONTRACT (Foundry Environment)
│   ├── src/                   # Source Code (.sol)
│   ├── test/                  # Unit & Integration Tests
│   └── script/                # Deployment Scripts
│
├── indexer/                   # INDEXER (Ponder Environment)
│   ├── src/                   # Event Handlers & Schema
│   ├── abis/                  # Contract ABIs
│   └── ponder.config.ts       # Indexer Configuration
│
└── frontend/                  # FRONTEND (Next.js Environment)
    ├── src/                   # App Router & UI Components
    ├── public/                # Static Assets
    └── package.json           # Frontend Dependencies
```

---

## Panduan Instalasi & Pengembangan

Ikuti langkah berikut untuk menjalankan proyek di lingkungan lokal.

### Prasyarat

* Node.js (v18+)
* Foundry
* Git
* Dompet Web3 dengan konfigurasi RPC Base / Base Sepolia.

### 1. Setup Smart Contract (Backend)

Masuk ke direktori `contracts`:

```bash
cd contracts
```

Install dependensi dan compile kontrak:

```bash
forge install
forge build
```

Jalankan Unit Test untuk memvalidasi logika:

```bash
forge test -vv
```

*(Catatan: Anda dapat mengonfigurasi file `.env` di direktori ini dengan parameter seperti `RPC_URL` dan `PRIVATE_KEY` sebelum melakukan proses deployment).*

### 2. Setup Indexer (Data Layer)

Masuk ke direktori `indexer`:

```bash
cd indexer
```

Install dependensi:

```bash
npm install
```

Konfigurasi Environment Variable:
Gandakan file contoh dan sesuaikan kredensial RPC:

```bash
cp .env.local.example .env.local
```

Jalankan Server Development Ponder:

```bash
npm run dev
```

### 3. Setup Frontend (Client)

Masuk ke direktori `frontend`:

```bash
cd frontend
```

Install dependensi:

```bash
npm install
```

Jalankan Server Development Next.js:

```bash
npm run dev
```

Aplikasi frontend akan dapat diakses secara default melalui `http://localhost:3000`.

---

## Security & Testing

Sistem ini didesain dengan ketahanan tingkat tinggi, yang dievaluasi menggunakan metode:
* **Correctness & Unit Testing:** Menguji seluruh fitur utama (Listing, Buy, Resale) melalui *Foundry* untuk memastikan tidak ada kesalahan logika.
* **Edge Cases Validation:** Memvalidasi *revert error* pada situasi ekstrem seperti *PriceCeilingExceeded* dan manipulasi transfer ilegal.
* **Security Audit:** Dukungan pemindaian otomatis (seperti *Slither*) untuk mencegah kerentanan krusial (misal: *Reentrancy*, otoritas transfer yang lemah).

---

## Lisensi

Didistribusikan di bawah lisensi **MIT**. Lihat `LICENSE` untuk informasi lebih lanjut.
