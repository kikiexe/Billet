#!/bin/bash

echo "Memulai kompilasi Smart Contract..."
cd contracts && forge build
cd ..

echo "Menyinkronkan ABI ke Frontend..."
mkdir -p frontend/src/config/abi

# Verifikasi keberadaan file sebelum menyalin
if [ -f "contracts/out/TicketMarketplace.sol/TicketMarketplace.json" ]; then
  cp contracts/out/TicketMarketplace.sol/TicketMarketplace.json frontend/src/config/abi/
  echo "✓ TicketMarketplace ABI disinkronkan."
else
  echo "⚠ TicketMarketplace.json belum ditemukan. Tulis kontraknya terlebih dahulu."
fi

if [ -f "contracts/out/TicketNFT.sol/TicketNFT.json" ]; then
  cp contracts/out/TicketNFT.sol/TicketNFT.json frontend/src/config/abi/
  echo "✓ TicketNFT ABI disinkronkan."
else
  echo "⚠ TicketNFT.json belum ditemukan. Tulis kontraknya terlebih dahulu."
fi

echo "Sinkronisasi ABI selesai! ✨"
