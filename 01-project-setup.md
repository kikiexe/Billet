# 01 — Project Setup & Folder Architecture

> Stack: Solidity `^0.8.24` · Foundry · Base L2 · ERC-1155 · ERC-2981 · Next.js · Wagmi

---

## Prerequisites

| Tool | Install |
|------|---------|
| Foundry | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Node.js (opsional, untuk scripts) | `https://nodejs.org` |
| Git | sudah tersedia di kebanyakan sistem |

---

## Inisialisasi Project

```bash
forge init smart-ticketing
cd smart-ticketing

# Install OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Verifikasi instalasi
forge build
```

---

## Konfigurasi `foundry.toml`

```toml
[profile.default]
src      = "src"
out      = "out"
libs     = ["lib"]
optimizer       = true
optimizer_runs  = 200

remappings = [
  "@openzeppelin/=lib/openzeppelin-contracts/"
]

[profile.default.fuzz]
runs = 256

[profile.default.invariant]
runs  = 64
depth = 15
```

---

## File `.env`

```env
PRIVATE_KEY=0xyour_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

> ⚠️ Jangan pernah commit `.env` ke Git. Tambahkan ke `.gitignore`.

---

## `.gitignore`

```
.env
out/
cache/
broadcast/
```

---

## Arsitektur Folder Lengkap (Monorepo)

Struktur proyek ini menggunakan pola Monorepo untuk memisahkan *smart contract* dan *frontend*.

```text
billet-monorepo/
│
├── contracts/                       # Direktori Smart Contract (Fokus File 01, 02, 03)
│   ├── foundry.toml
│   ├── .env
│   ├── src/
│   │   ├── interfaces/
│   │   │   └── ITicketMarketplace.sol   # Interface publik marketplace
│   │   ├── libraries/
│   │   │   └── PriceLib.sol             # Helper kalkulasi price ceiling & royalti
│   │   ├── mock/
│   │   │   └── MockERC20.sol            # Mock ERC20 Token untuk IDRX (Stablecoin)
│   │   ├── TicketNFT.sol                # ERC-1155 + transfer gating
│   │   └── TicketMarketplace.sol        # Monolithic marketplace + escrow (IDRX Payment)
│   │
│   ├── script/
│   │   ├── Deploy.s.sol                 # Deploy ke Base / Base Sepolia
│   │   └── Seed.s.sol                   # Seed listing untuk demo/testing manual
│   │
│   └── test/
│       ├── helpers/
│       ├── unit/
│       └── integration/
│
└── frontend/                        # Direktori Web3 DApp (Fokus File 04)
    ├── src/
    │   ├── app/                     # Routing & Pages (Next.js App Router)
    │   ├── components/              # UI & Web3 Components
    │   ├── hooks/                   # Custom Wagmi Hooks (Multi-step tx, Error Decoding)
    │   └── config/                  # Konfigurasi Wagmi & ABI Contracts
    ├── package.json
    └── tailwind.config.ts
```

---

## Penjelasan Singkat Per Folder

### `src/`
Berisi semua source contract. Dipisah menjadi:
- **`interfaces/`** — ABI publik, memudahkan integrasi frontend dan contract lain.
- **`libraries/`** — Pure functions reusable agar logic kontrak utama tetap bersih.
- Contract utama di root `src/` langsung.

### `script/`
Berisi Foundry scripts untuk deployment dan interaksi on-chain. Foundry scripts dijalankan dengan `forge script`.

### `test/`
- **`helpers/`** — Shared setup: deploy fixture, address dummy, event assertions.
- **`unit/`** — Tes per fungsi secara terisolasi (mock dependency jika perlu).
- **`integration/`** — Tes alur lengkap tanpa mock, semua contract deployed sungguhan.

---

## Sinkronisasi ABI Otomatis (Jembatan Contracts -> Frontend)

Karena proyek ini menggunakan arsitektur Monorepo, hasil kompilasi *smart contract* oleh Foundry (berada di `contracts/out/`) perlu dikirimkan ke *frontend* (`frontend/src/config/`) agar Wagmi dan Viem bisa mengenali fungsi-fungsi *blockchain*. Melakukan *copy-paste* ABI secara manual setiap kali kodingan Solidity diubah sangat melelahkan dan rentan akan kesalahan (*human error*).

**Solusi (Trik Senior):** Buat sebuah Bash Script sederhana di root direktori proyek Anda untuk menyalin ABI secara otomatis.

Buat file `sync-abi.sh` di *root* folder:

```bash
#!/bin/bash

echo "Memulai kompilasi Smart Contract..."
cd contracts && forge build
cd ..

echo "Menyinkronkan ABI ke Frontend..."
mkdir -p frontend/src/config/abi

# Menyalin file hasil kompilasi Foundry ke frontend
cp contracts/out/TicketMarketplace.sol/TicketMarketplace.json frontend/src/config/abi/
cp contracts/out/TicketNFT.sol/TicketNFT.json frontend/src/config/abi/

echo "Sinkronisasi ABI selesai! ✨"
```

Beri izin eksekusi pada file tersebut:
```bash
chmod +x sync-abi.sh
```
Sekarang, cukup jalankan `./sync-abi.sh` di terminal setiap kali Anda mengubah kode Solidity.

---

## Verifikasi Setup Berhasil

```bash
forge build          # harus: Compiler run successful
forge test           # harus: semua test pass (setelah file test dibuat)
forge coverage       # lihat coverage report
```
