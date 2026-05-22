# 01 — Project Setup & Folder Architecture

> Stack: Solidity `^0.8.24` · Foundry · Base L2 · ERC-1155 · ERC-2981

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

## Arsitektur Folder Lengkap

```
smart-ticketing/
│
├── foundry.toml
├── .env
├── .gitignore
│
├── src/
│   ├── interfaces/
│   │   └── ITicketMarketplace.sol   # Interface publik marketplace
│   ├── libraries/
│   │   └── PriceLib.sol             # Helper kalkulasi price ceiling & royalti
│   ├── mock/
│   │   └── MockERC20.sol            # Mock ERC20 Token untuk IDRX (Stablecoin)
│   ├── TicketNFT.sol                # ERC-1155 + transfer gating
│   └── TicketMarketplace.sol        # Monolithic marketplace + escrow (IDRX Payment)
│
├── script/
│   ├── Deploy.s.sol                 # Deploy ke Base / Base Sepolia
│   └── Seed.s.sol                   # Seed listing untuk demo/testing manual
│
├── test/
│   ├── helpers/
│   │   └── TestHelper.sol           # Base contract & shared fixtures
│   ├── unit/
│   │   ├── TicketNFT.t.sol          # Unit test ERC-1155 & transfer gating
│   │   └── TicketMarketplace.t.sol  # Unit test listing, buy, resale, royalti
│   └── integration/
│       └── FullFlow.t.sol           # End-to-end: mint → list → buy → resale
│
└── lib/
    └── openzeppelin-contracts/      # Auto-generated oleh forge install
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

## Verifikasi Setup Berhasil

```bash
forge build          # harus: Compiler run successful
forge test           # harus: semua test pass (setelah file test dibuat)
forge coverage       # lihat coverage report
```
