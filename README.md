# Billet: On-Chain Smart Ticketing Protocol

<div align="left" style="display: flex; gap: 8px; margin-bottom: 20px;">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square" height="20" alt="Next.js" />
  <img src="https://img.shields.io/badge/Solidity-363636?style=flat-square" height="20" alt="Solidity" />
  <img src="https://img.shields.io/badge/Foundry-FF8000?style=flat-square" height="20" alt="Foundry" />
  <img src="https://img.shields.io/badge/Ponder-8A2BE2?style=flat-square" height="20" alt="Ponder" />
  <img src="https://img.shields.io/badge/Base-0052FF?style=flat-square" height="20" alt="Base" />
</div>

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

## Panduan Instalasi & Pengembangan (Local Setup)

Ikuti langkah-langkah terurut di bawah ini untuk menjalankan seluruh ekosistem Billet (Smart Contract, Indexer, dan Frontend) di lingkungan lokal Anda.

### Prasyarat System
Sebelum memulai, pastikan perangkat Anda telah terinstal perkakas berikut:
* **Node.js (v18+)** & **npm**
* **Foundry (`forge`)** — [Panduan Instalasi Foundry](https://book.getfoundry.sh/getting-started/installation)
* **jq** — Parser JSON CLI (diperlukan untuk script sinkronisasi ABI). Instal via apt: `sudo apt install jq`
* **Git**

---

### Alur Eksekusi & Langkah Setup

Jalankan perintah berikut secara berurutan sesuai dengan direktori monorepo masing-masing:

#### Langkah 1: Setup Smart Contract & Uji Coba
Masuk ke direktori `contracts` untuk menginstal library dependencies dan memvalidasi seluruh unit tests:
```bash
cd contracts
forge install
forge build
forge test -vv
```

*(Opsional)* **Deploy ke Base Sepolia (On-Chain):**
Jika ingin mendeploy smart contract Anda secara nyata ke testnet Base Sepolia dan memverifikasinya secara otomatis:
1. Lengkapi variabel `PRIVATE_KEY`, `BASE_SEPOLIA_URL`, dan `ETHERSCAN_API_KEY` di file `contracts/.env`.
2. Jalankan script deployment otomatis berikut dari dalam folder `contracts`:
```bash
chmod +x deploy-and-verify.sh
./deploy-and-verify.sh
```

#### Langkah 2: Sinkronisasi ABI ke Frontend & Indexer (Paling Krusial!)
Kembali ke root directory proyek dan jalankan script bash `sync-abi.sh` untuk mengekstrak ABI kontrak pintar hasil kompilasi Foundry secara otomatis dan menyebarkannya ke folder konfigurasi frontend serta indexer:
```bash
cd ..
chmod +x sync-abi.sh
./sync-abi.sh
```

#### Langkah 3: Setup Indexer (Data Layer)
Masuk ke direktori `indexer` untuk melacak event on-chain secara lokal:
```bash
cd indexer
npm install
cp .env.local.example .env.local   # Konfigurasi RPC URL di file .env.local ini
npm run dev
```

#### Langkah 4: Setup Frontend (Client UI)
Masuk ke direktori `frontend` untuk menjalankan antarmuka dApp Billet:
```bash
cd ../frontend
npm install
npm run dev
```

Aplikasi frontend kini aktif dan dapat diakses di browser melalui tautan default: `http://localhost:3000`.

---

## Security & Testing

Sistem ini didesain dengan ketahanan tingkat tinggi, yang dievaluasi menggunakan metode:
* **Correctness & Unit Testing:** Menguji seluruh fitur utama (Listing, Buy, Resale) melalui *Foundry* untuk memastikan tidak ada kesalahan logika.
* **Edge Cases Validation:** Memvalidasi *revert error* pada situasi ekstrem seperti *PriceCeilingExceeded* dan manipulasi transfer ilegal.
* **Security Audit:** Dukungan pemindaian otomatis (seperti *Slither*) untuk mencegah kerentanan krusial (misal: *Reentrancy*, otoritas transfer yang lemah).

---

## Lisensi

Didistribusikan di bawah lisensi **MIT**. Lihat `LICENSE` untuk informasi lebih lanjut.
