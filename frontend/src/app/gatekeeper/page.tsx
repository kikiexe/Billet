"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ConnectKitButton } from "connectkit";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { NFT_ABI, NFT_ADDRESS } from "@/config/contracts";
import type { Abi } from "viem";
import { baseSepolia } from "viem/chains";
import { Shield, ScanLine, Loader2, ArrowLeft, Search, User } from "lucide-react";
import { Scanner } from "@/components/gatekeeper/Scanner";
import { getCategoryName, getCategoryGradient } from "@/lib/format";
import type { TicketHolder } from "@/hooks/useMyTickets";

const TOKEN_IDS = [1, 2, 3];

export default function GatekeeperPage() {
  const { address, isConnected } = useAccount();
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  // 1. Verify Gatekeeper Role
  const { data: isGateKeeper, isLoading: checkingRole } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI as Abi,
    functionName: "isGateKeeper",
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // 2. Fetch User Tickets
  const contracts = scannedAddress
    ? TOKEN_IDS.flatMap((tokenId) => [
        {
          address: NFT_ADDRESS,
          abi: NFT_ABI as Abi,
          functionName: "balanceOf" as const,
          args: [scannedAddress as `0x${string}`, BigInt(tokenId)] as const,
          chainId: baseSepolia.id,
        },
        {
          address: NFT_ADDRESS,
          abi: NFT_ABI as Abi,
          functionName: "getTicketHolders" as const,
          args: [scannedAddress as `0x${string}`, BigInt(tokenId)] as const,
          chainId: baseSepolia.id,
        },
      ])
    : [];

  const { data: userTicketsData, isLoading: fetchingTickets, refetch: refetchTickets } = useReadContracts({
    contracts,
    query: {
      enabled: !!scannedAddress,
    },
  });

  // 3. Process Ticket Data
  const tickets: { tokenId: number; holders: TicketHolder[] }[] = [];
  if (userTicketsData) {
    for (let i = 0; i < TOKEN_IDS.length; i++) {
      const balanceResult = userTicketsData[i * 2];
      const holdersResult = userTicketsData[i * 2 + 1];

      const balance = balanceResult?.status === "success" ? (balanceResult.result as bigint) : BigInt(0);
      const holders = holdersResult?.status === "success" ? (holdersResult.result as unknown as TicketHolder[]) : [];

      if (balance > BigInt(0) || holders.length > 0) {
        tickets.push({ tokenId: TOKEN_IDS[i], holders });
      }
    }
  }

  // 4. Check-In Transaction
  const { writeContract, data: txHash, isPending: isCheckingIn } = useWriteContract();
  const { isLoading: isWaitingTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleCheckIn = (tokenId: number, index: number) => {
    if (!scannedAddress) return;
    writeContract({
      address: NFT_ADDRESS,
      abi: NFT_ABI as Abi,
      functionName: "checkInFromGate",
      args: [scannedAddress as `0x${string}`, BigInt(tokenId), BigInt(index)],
    });
  };

  useEffect(() => {
    if (isTxSuccess) {
      refetchTickets();
    }
  }, [isTxSuccess, refetchTickets]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^0x[a-fA-F0-9]{40}$/.test(manualInput)) {
      setScannedAddress(manualInput);
    } else {
      alert("Format alamat dompet tidak valid.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col neo-grid-bg relative text-black">
      <Navbar />

      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="bg-white neo-border neo-shadow p-6 relative overflow-hidden -rotate-1 hover:rotate-0 transition-transform duration-200 text-center mb-10">
            <div className="absolute top-2 right-3 flex items-center gap-1.5 font-pixel-sm text-[9px] border-2 border-black px-1.5 py-0.5 bg-neutral-200">
              <span>GATEKEEPER.EXE</span>
              <span className="font-bold border-l-2 border-black pl-1.5">X</span>
            </div>
            <div className="pt-6 flex flex-col items-center">
              <div className="w-14 h-14 bg-white border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] mb-4">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h1 className="font-pixel-lg text-4xl font-bold uppercase text-black">Gatekeeper Scanner</h1>
              <p className="font-pixel-sm text-[9px] text-neutral-600 mt-2">Verifikasi & Check-In tiket pengunjung secara on-chain.</p>
            </div>
          </div>

          {!isConnected ? (
            <div className="bg-white neo-border neo-shadow p-8 text-center space-y-4">
              <Shield className="w-12 h-12 text-black mx-auto stroke-[2.5]" />
              <h3 className="font-pixel-lg text-2xl font-bold uppercase">Akses Terbatas</h3>
              <p className="font-pixel-sm text-[10px] text-neutral-600">Hubungkan wallet dengan akses Panitia (Gatekeeper) untuk melanjutkan.</p>
              <div className="flex justify-center neo-border-button"><ConnectKitButton /></div>
            </div>
          ) : checkingRole ? (
            <div className="flex flex-col items-center py-10 bg-white neo-border neo-shadow">
              <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin mb-4" />
              <p className="font-pixel-sm text-xs">Memverifikasi otorisasi...</p>
            </div>
          ) : !isGateKeeper ? (
            <div className="bg-white border-[3px] border-red-500 neo-shadow p-8 text-center space-y-4">
              <Shield className="w-12 h-12 text-red-500 mx-auto stroke-[2.5]" />
              <h3 className="font-pixel-lg text-2xl font-bold text-red-600 uppercase">Akses Ditolak</h3>
              <p className="font-pixel-sm text-[10px] text-red-800">Wallet Anda ({address?.slice(0,6)}...{address?.slice(-4)}) tidak terdaftar sebagai Gatekeeper.</p>
              <div className="flex justify-center neo-border-button"><ConnectKitButton /></div>
            </div>
          ) : !scannedAddress ? (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white neo-border neo-shadow p-4">
                {/* Title bar */}
                <div className="bg-[#4CAF50]/20 border-b-[3px] border-black px-3 py-1.5 flex items-center justify-between mb-4">
                  <span className="font-pixel-sm text-[9px] uppercase font-bold text-black">LIVE_CAMERA_SCANNER</span>
                  <div className="w-3 h-3 rounded-full bg-[#4CAF50] border border-black animate-pulse" />
                </div>
                <Scanner onScan={setScannedAddress} />
              </div>
              
              <div className="relative flex items-center py-2">
                <div className="grow border-t-3 border-black"></div>
                <span className="shrink-0 px-4 font-pixel-sm text-[9px] font-bold text-black uppercase tracking-wider">ATAU</span>
                <div className="grow border-t-3 border-black"></div>
              </div>

              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black stroke-[2.5]" />
                  <input
                    type="text"
                    placeholder="Masukkan Address 0x..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 border-[3.5px] border-black bg-white focus:outline-hidden font-mono text-xs text-black"
                  />
                </div>
                <button type="submit" className="px-6 py-3.5 bg-black hover:bg-neutral-900 text-white font-pixel-sm text-[10px] uppercase border-[3.5px] border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] shrink-0 cursor-pointer">
                  Cari
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={() => setScannedAddress(null)}
                className="flex items-center gap-2 border-[2.5px] border-black bg-white text-black px-3.5 py-1.5 font-pixel-sm text-[9px] uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] mb-6 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                Kembali ke Scanner
              </button>

              <div className="bg-white neo-border neo-shadow p-6 md:p-8">
                {/* Title bar */}
                <div className="bg-[#FF5722]/10 border-b-[3.5px] border-black px-4 py-2.5 flex items-center justify-between -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6">
                  <span className="font-pixel-sm text-[9px] uppercase font-bold text-black">RESULT_TICKET_DECRYPTION.EXE</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5722] border-2 border-black" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#4CAF50] border-2 border-black" />
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="font-pixel-sm text-[8px] text-neutral-500 uppercase mb-1">Hasil Scan Wallet</h2>
                  <p className="font-mono text-xs md:text-sm text-black break-all bg-neutral-50 border-2 border-black p-3 font-bold">{scannedAddress}</p>
                </div>

                {fetchingTickets ? (
                  <div className="flex flex-col items-center py-10">
                    <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin mb-4" />
                    <p className="font-pixel-sm text-[9px] text-neutral-600">Memuat data tiket pengunjung...</p>
                  </div>
                ) : tickets.length === 0 || tickets.every(t => t.holders.filter(h => h.registered).length === 0) ? (
                  <div className="bg-neutral-50 border-[3px] border-black rounded-none p-8 text-center">
                    <ScanLine className="w-10 h-10 text-black mx-auto mb-3 stroke-[2.5]" />
                    <h3 className="font-pixel-lg text-2xl font-bold uppercase mb-1">Tidak Ada Tiket</h3>
                    <p className="font-pixel-sm text-[9px] text-neutral-600">Pengunjung ini tidak memiliki tiket aktif yang terdaftar.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {tickets.map((ticket) => {
                      const registeredHolders = ticket.holders
                        .map((h, i) => ({ ...h, originalIndex: i }))
                        .filter((h) => h.registered);
                      
                      if (registeredHolders.length === 0) return null;

                      return (
                        <div key={ticket.tokenId} className="space-y-4">
                          <h3 className="font-pixel-lg text-2xl font-bold uppercase text-black border-b-[3px] border-black pb-2">
                            {getCategoryName(ticket.tokenId)}
                          </h3>
                          
                          <div className="grid gap-4">
                            {registeredHolders.map((holder) => (
                              <div key={holder.originalIndex} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-[3px] border-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
                                <div className={`absolute top-0 bottom-0 left-0 w-2.5 bg-linear-to-b ${getCategoryGradient(ticket.tokenId)} border-r-3 border-black`} />
                                
                                <div className="pl-4 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <User className="w-4 h-4 text-black stroke-[2.5]" />
                                    <p className="font-pixel-sm text-[10px] text-black font-bold uppercase">{holder.name || "—"}</p>
                                  </div>
                                  <p className="font-pixel-sm text-[8px] text-neutral-600 uppercase">NIK: {holder.nik || "—"} • ID: {ticket.tokenId}-{holder.originalIndex}</p>
                                </div>

                                <div className="shrink-0 pl-4 sm:pl-0">
                                  {holder.used ? (
                                    <div className="px-4 py-2 border-[2.5px] border-black bg-[#4CAF50] text-white font-pixel-sm text-[9px] uppercase font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                      Telah Check-in
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleCheckIn(ticket.tokenId, holder.originalIndex)}
                                      disabled={isCheckingIn || isWaitingTx}
                                      className="w-full sm:w-auto px-6 py-2 border-[2.5px] border-black bg-[#FF5722] text-white font-pixel-sm text-[9px] uppercase font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#E64A19] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      {isCheckingIn || isWaitingTx ? (
                                        <><Loader2 className="w-3 h-3 animate-spin" /> Memproses...</>
                                      ) : (
                                        <>Check-in Masuk</>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
