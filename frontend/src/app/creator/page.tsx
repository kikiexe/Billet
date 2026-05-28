"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { ConnectKitButton } from "connectkit";
import {
  Sparkles,
  Calculator,
  Ticket,
  Percent,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  PlusCircle,
  Coins,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Zap,
  ArrowRight
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/config/contracts";
import { parseUnits } from "viem";
import { toast } from "sonner";

// ─── Calculator Presets ──────────────────────────────────────────────────

const eventCategories = [
  { name: "Konser Musik", defaultPrice: 250000, royaltyRate: 0.05, resaleRate: 0.15 },
  { name: "Seminar & Kelas", defaultPrice: 100000, royaltyRate: 0.02, resaleRate: 0.05 },
  { name: "Pertandingan Olahraga", defaultPrice: 150000, royaltyRate: 0.03, resaleRate: 0.10 },
  { name: "Pertunjukan Seni", defaultPrice: 80000, royaltyRate: 0.04, resaleRate: 0.08 }
];

// ─── Feature list ────────────────────────────────────────────────────────

const features = [
  {
    icon: ShieldCheck,
    title: "NFT Ticketing (ERC-1155)",
    desc: "Tiket di-mint sebagai token ERC-1155 di Base L2. Nol pemalsuan."
  },
  {
    icon: Percent,
    title: "Price Ceiling Otomatis",
    desc: "Harga resale dibatasi smart contract. Calo tak bisa markup berlebihan."
  },
  {
    icon: Coins,
    title: "Resale Royalty (ERC-2981)",
    desc: "Terima royalti otomatis setiap tiket berpindah tangan di pasar sekunder."
  },
  {
    icon: Zap,
    title: "Check-in Gasless",
    desc: "Verifikasi tiket di pintu masuk secara instan via tanda tangan cryptographic."
  },
  {
    icon: Activity,
    title: "Laporan Real-Time",
    desc: "Data penjualan tiket dan mutasi resale langsung dari blockchain."
  },
  {
    icon: Layers,
    title: "Multi-Kategori",
    desc: "Format tiket Reguler, VIP, hingga VVIP dengan metadata eksklusif."
  }
];

export default function CreatorPage() {
  const { isConnected, address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // ─── Calculator State ───────────────────────────────────────────────────

  const [selectedCat, setSelectedCat] = useState(eventCategories[0]);
  const [ticketPrice, setTicketPrice] = useState<number>(250000);
  const [ticketVolume, setTicketVolume] = useState<number>(1000);

  // ─── Form State ────────────────────────────────────────────────────────

  const [eventName, setEventName] = useState("");
  const [eventCategory, setEventCategory] = useState("1"); // 1=Reguler, 2=VIP, 3=VVIP
  const [eventPrice, setEventPrice] = useState<number>(150000);
  const [eventVolume, setEventVolume] = useState<number>(500);
  const [eventCity, setEventCity] = useState("Jakarta");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [priceCeilingMarkup, setPriceCeilingMarkup] = useState<number>(10); // 10%
  const [isLaunching, setIsLaunching] = useState(false);

  // ─── Read Contract Owner (OnlyOwner listPrimary checks) ──────────────────

  const { data: contractOwner } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "owner"
  });

  const isOwner = !!(contractOwner && address && contractOwner.toString().toLowerCase() === address.toLowerCase());

  // ─── Real-time Calculator Math ──────────────────────────────────────────

  const grossSales = ticketPrice * ticketVolume;
  const platformFeeRate = 0.0; // 0% PROMO (instead of standard 1.5%)
  const platformFee = grossSales * platformFeeRate;

  // Secondary market resale simulation
  const resaleVolume = Math.round(ticketVolume * selectedCat.resaleRate);
  const avgResalePrice = ticketPrice * 1.10; // Assuming 10% average markup
  const resaleRoyalties = Math.round(resaleVolume * avgResalePrice * selectedCat.royaltyRate);

  const netEarnings = grossSales - platformFee + resaleRoyalties;

  // Percentage calculations for graphics
  const primaryPercentage = Math.min(100, Math.round((grossSales / netEarnings) * 100));
  const royaltyPercentage = Math.min(100, Math.round((resaleRoyalties / netEarnings) * 100));

  // ─── Handle Launch Event (Simulated / On-Chain) ─────────────────────────

  const handleLaunchEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventVenue || !eventDate) {
      toast.error("Formulir tidak lengkap!", {
        description: "Harap isi Nama Event, Lokasi, dan Tanggal Acara."
      });
      return;
    }

    setIsLaunching(true);

    try {
      // 1. If user is the Contract Owner, try actual blockchain launch
      if (isOwner) {
        toast.info("Memulai transaksi on-chain ke Base Sepolia...", {
          description: "Harap setujui permintaan tanda tangan di wallet Anda."
        });

        // Price per unit in wei (18 decimals for IDRX)
        const priceInWei = parseUnits(eventPrice.toString(), 18); // Calibrated to 18 decimals standard

        // TODO / TECH DEBT WARNING: priceCeilingMarkup dropdown is currently a dead UI option in on-chain mode
        // because the listPrimary transaction does not accept ceiling parameters. The ceiling parameter is defined
        // inside the TicketNFT contract (TicketNFT.sol) using configureTicketCategory().
        // To fix this fully, the creator UI must execute a two-step transaction:
        // 1. Write to TicketNFT.configureTicketCategory(eventCategory, eventVolume, priceInWei, 10000 + priceCeilingMarkup * 100, royaltyBps, start, end)
        // 2. Write to TicketMarketplace.listPrimary(eventCategory, eventVolume, priceInWei)
        // Currently, we fallback to the default 10% ceiling (11000 bps) pre-configured in the smart contract deployment.
        
        const tx = await writeContractAsync({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: "listPrimary",
          args: [BigInt(eventCategory), BigInt(eventVolume), priceInWei]
        });

        toast.success("Transaksi Sukses! Tiket Berhasil Diluncurkan On-Chain!", {
          description: `Tx Hash: ${tx.slice(0, 10)}...`,
          duration: 5000
        });
      }

      // 2. Always register in Local Sandbox database (localStorage) so homepage can fetch it!
      const simulatedListing = {
        listingId: Math.floor(Math.random() * 900) + 200, // random simulated ID
        seller: address || "0x0000000000000000000000000000000000000000",
        tokenId: Number(eventCategory),
        amount: Number(eventVolume),
        pricePerUnit: parseUnits(eventPrice.toString(), 18).toString(), // Calibrated to 18 decimals and serialized as string
        originalPrice: parseUnits(eventPrice.toString(), 18).toString(),
        priceCeilingBps: Number(10000 + (isOwner ? 10 : priceCeilingMarkup) * 100), // Enforce selected price ceiling limit (e.g., 10% = 11000 bps)
        active: true,
        isResale: false,
        title: eventName,
        category: eventCategory === "1" ? "Musik" : eventCategory === "2" ? "Seminar" : "Olahraga",
        city: eventCity,
        date: eventDate,
        venue: eventVenue,
        isMock: true, // Treated as simulated sandbox
        bannerGradient: eventCategory === "1" ? "from-purple-500 to-indigo-600" :
                        eventCategory === "2" ? "from-blue-500 to-cyan-600" :
                        "from-green-500 to-teal-600"
      };

      // Read existing simulated listings
      const rawSimulated = localStorage.getItem("billet_simulated_events");
      const simulatedList = rawSimulated ? JSON.parse(rawSimulated) : [];
      
      // Append new event
      simulatedList.push(simulatedListing);
      localStorage.setItem("billet_simulated_events", JSON.stringify(simulatedList));

      toast.success(isOwner ? "Sandbox Terdaftar!" : "Mode Sandbox Sukses!", {
        description: `Event "${eventName}" berhasil dibuat dalam Mode Sandbox dan terdaftar secara lokal. Anda bisa melihatnya langsung di halaman Pembeli sekarang!`,
        duration: 6000,
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });

      // Clear Form
      setEventName("");
      setEventVenue("");
      setEventDate("");
    } catch (error) {
      const err = error as any;
      console.error(err);
      toast.error("Transaksi Gagal!", {
        description: err.message || "Gagal mengirimkan transaksi on-chain."
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col neo-grid-bg relative text-black">
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════
            SECTION 1: Hero — Clean & Focused
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24" id="hero-creator">
          <div className="section-container">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              {/* Text */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white neo-border neo-shadow p-6 relative overflow-hidden -rotate-1 hover:rotate-0 transition-transform duration-200">
                  <div className="absolute top-2 right-3 flex items-center gap-1.5 font-pixel-sm text-[9px] border-2 border-black px-1.5 py-0.5 bg-neutral-200">
                    <span>CREATOR.EXE</span>
                    <span className="font-bold border-l-2 border-black pl-1.5">X</span>
                  </div>
                  <div className="pt-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF5722]/15 border-2 border-black text-[#FF5722] font-pixel-sm text-[8px] uppercase tracking-wide mb-4">
                      <Sparkles className="w-3.5 h-3.5" />
                      Billet untuk Kreator
                    </span>
                    <h1 className="font-pixel-lg text-4xl sm:text-5xl font-black text-black leading-tight uppercase">
                      Luncurkan Tiket <span className="text-[#FF5722]">On-Chain</span> dalam Hitungan Menit.
                    </h1>
                    <p className="font-pixel-sm text-[10px] text-neutral-850 leading-relaxed mt-4">
                      Buat tiket digital NFT ERC-1155 di Base L2. Terlindungi dari pemalsuan dan calo, 
                      dengan batas resale otomatis dan royalti langsung ke wallet Anda.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-6">
                      <a
                        href="#calculator-section"
                        className="px-4 py-2.5 bg-black border-[3px] border-black text-white font-pixel-sm text-[9px] uppercase shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-neutral-900 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                      >
                        Kalkulator Pendapatan
                      </a>
                      <a
                        href="#launcher-section"
                        className="px-4 py-2.5 bg-[#FF5722] border-[3px] border-black text-white font-pixel-sm text-[9px] uppercase shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-[#E64A19] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                      >
                        Luncurkan Event
                      </a>
                    </div>
                  </div>
                </div>

                {/* Trust Stats Bar in Retro Box */}
                <div className="bg-white neo-border neo-shadow p-5 grid grid-cols-3 gap-4 text-center">
                  {[
                    { value: "30.000+", label: "Creator Terdaftar" },
                    { value: "Rp 0", label: "Biaya Pembuatan" },
                    { value: "5 M+", label: "Volume Transaksi" }
                  ].map((stat, i) => (
                    <div key={i}>
                      <h3 className="font-pixel-lg text-2xl font-bold text-black uppercase">{stat.value}</h3>
                      <p className="font-pixel-sm text-[8px] text-neutral-500 mt-1 uppercase leading-none">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard Mockup (compact) */}
              <div className="lg:col-span-5 relative">
                <div className="bg-white neo-border neo-shadow">
                  {/* Title Bar */}
                  <div className="bg-[#4CAF50]/20 border-b-[3.5px] border-black px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FF5722] border-2 border-black" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#4CAF50] border-2 border-black" />
                    </div>
                    <span className="font-pixel-sm text-[9px] uppercase text-black font-bold">BILLET-DASHBOARD.ETH</span>
                  </div>
                  {/* Stats Body */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neutral-50 p-4 border-[3px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <p className="font-pixel-sm text-[8px] text-neutral-500 uppercase">Tiket Terjual</p>
                        <h4 className="font-pixel-lg text-2xl text-black font-bold mt-1">1.482 / 1.500</h4>
                        <div className="w-full bg-neutral-200 border-2 border-black h-4 mt-2 relative overflow-hidden">
                          <div className="bg-[#FF5722] h-full w-[92%] border-r-2 border-black" />
                        </div>
                      </div>
                      <div className="bg-neutral-50 p-4 border-[3px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <p className="font-pixel-sm text-[8px] text-neutral-500 uppercase">Royalti Resale</p>
                        <h4 className="font-pixel-lg text-2xl text-[#4CAF50] font-bold mt-1">+ Rp 7.4jt</h4>
                        <p className="font-pixel-sm text-[7px] text-neutral-600 mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-[#4CAF50] stroke-[2.5]" /> 148 RESALE
                        </p>
                      </div>
                    </div>

                    {/* Activity */}
                    <div className="space-y-2">
                      <p className="font-pixel-sm text-[9px] font-bold text-black uppercase">Aktivitas Terbaru</p>
                      {[
                        { type: "Primary Buy", desc: "Membeli 2 Tiket VIP", val: "Rp 700.000", ok: true },
                        { type: "Resale Royalty", desc: "Royalti 5%", val: "+ Rp 55.000", ok: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border-2 border-black bg-white text-[10px] font-pixel-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 border border-black ${item.ok ? "bg-[#4CAF50]" : "bg-[#FF5722]"}`} />
                            <div>
                              <p className="font-bold text-black uppercase">{item.type}</p>
                              <p className="text-[8px] text-neutral-500">{item.desc}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${item.ok ? "text-black" : "text-[#4CAF50]"}`}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2: Revenue Calculator
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 border-y-4 border-black bg-white/20 animate-fade-in" id="calculator-section">
          <div className="section-container">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="font-pixel-lg text-4xl text-black flex items-center justify-center gap-3 uppercase font-bold">
                Hitung Pendapatan
                <Calculator className="w-7 h-7 text-[#FF5722]" />
              </h2>
              <p className="font-pixel-sm text-[10px] text-neutral-700 mt-2">
                Lihat estimasi pendapatan dari penjualan primer + royalti resale on-chain.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Input Panel */}
              <div className="lg:col-span-5 bg-white border-[3.5px] border-black p-6 space-y-6 shadow-shadow neo-shadow">
                <h3 className="font-pixel-lg text-2xl font-bold text-black border-b-[3px] border-black pb-3 uppercase">
                  Konfigurasi
                </h3>
                
                {/* Event Category Select */}
                <div className="space-y-2">
                  <label className="font-pixel-sm text-[9px] font-semibold text-black block uppercase tracking-wider">Jenis Event</label>
                  <div className="relative">
                    <select
                      value={selectedCat.name}
                      onChange={(e) => {
                        const cat = eventCategories.find((c) => c.name === e.target.value);
                        if (cat) {
                          setSelectedCat(cat);
                          setTicketPrice(cat.defaultPrice);
                        }
                      }}
                      className="w-full pl-4 pr-10 py-3 border-[3px] border-black bg-white font-pixel-sm text-[9px] appearance-none cursor-pointer"
                    >
                      {eventCategories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none stroke-[2.5]" />
                  </div>
                </div>

                {/* Ticket Price Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-pixel-sm text-[9px]">
                    <label className="font-bold text-black uppercase">Harga Per Tiket</label>
                    <span className="text-[#FF5722]">Rp {ticketPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="2000000"
                    step="10000"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between font-pixel-sm text-[8px] text-neutral-500">
                    <span>Rp 30rb</span>
                    <span>Rp 2jt</span>
                  </div>
                </div>

                {/* Ticket Volume Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-pixel-sm text-[9px]">
                    <label className="font-bold text-black uppercase">Jumlah Tiket</label>
                    <span className="text-[#FF5722]">{ticketVolume.toLocaleString("id-ID")} LBR</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="25000"
                    step="50"
                    value={ticketVolume}
                    onChange={(e) => setTicketVolume(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between font-pixel-sm text-[8px] text-neutral-500">
                    <span>50</span>
                    <span>25.000</span>
                  </div>
                </div>
              </div>

              {/* Output Panel */}
              <div className="lg:col-span-7 bg-white border-[3.5px] border-black p-6 sm:p-8 flex flex-col justify-between shadow-shadow neo-shadow">
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4CAF50]/15 border-2 border-black text-[#4CAF50] font-pixel-sm text-[8px] uppercase tracking-wider font-bold">
                    <Coins className="w-3.5 h-3.5 stroke-[2.5]" />
                    0% Platform Fee — Promo!
                  </span>

                  <h3 className="font-pixel-lg text-3xl font-bold uppercase text-black">Estimasi Pendapatan</h3>

                  {/* Breakdown */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 p-4 border-[3px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <p className="font-pixel-sm text-[8px] text-neutral-500 uppercase">Penjualan Utama</p>
                      <h4 className="font-pixel-lg text-2xl text-black font-bold mt-1">
                        Rp {grossSales.toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="bg-neutral-50 p-4 border-[3px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <p className="font-pixel-sm text-[8px] text-neutral-500 uppercase">Royalti Resale</p>
                      <h4 className="font-pixel-lg text-2xl text-[#4CAF50] font-bold mt-1">
                        + Rp {resaleRoyalties.toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="bg-[#FF5722]/10 p-4 border-[3px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <p className="font-pixel-sm text-[8px] text-[#FF5722] uppercase">Platform Fee</p>
                      <h4 className="font-pixel-lg text-2xl text-[#FF5722] font-bold mt-1">
                        Rp 0
                      </h4>
                      <p className="font-pixel-sm text-[7px] text-[#FF5722] font-bold uppercase tracking-wider mt-1">PROMO!</p>
                    </div>
                  </div>

                  {/* Proportion Bar */}
                  <div className="space-y-2">
                    <p className="font-pixel-sm text-[9px] text-black uppercase font-bold">Proporsi Pendapatan:</p>
                    <div className="w-full bg-neutral-200 border-[3px] border-black h-6 flex overflow-hidden">
                      <div className="bg-[#FF5722] h-full border-r-[3px] border-black" style={{ width: `${primaryPercentage}%` }} />
                      <div className="bg-[#4CAF50] h-full" style={{ width: `${royaltyPercentage}%` }} />
                    </div>
                    <div className="flex gap-4 font-pixel-sm text-[8px] text-neutral-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#FF5722] border border-black" /> Primer ({primaryPercentage}%)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#4CAF50] border border-black" /> Royalti ({royaltyPercentage}%)</span>
                    </div>
                  </div>
                </div>

                {/* Net total */}
                <div className="pt-6 mt-6 border-t-[3px] border-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-pixel-sm text-[8px] text-neutral-500 uppercase font-bold">Total Pendapatan Bersih</p>
                    <h2 className="font-pixel-lg text-3xl sm:text-4xl text-black font-bold leading-tight mt-1">
                      Rp {netEarnings.toLocaleString("id-ID")}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 font-pixel-sm text-[8px] uppercase bg-neutral-50 border-2 border-black p-2.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <Info className="w-4 h-4 text-[#FF5722] shrink-0 stroke-[2.5]" />
                    <span>Hingga 112% lebih tinggi dari konvensional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3: Features
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 section-container">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-pixel-lg text-4xl text-black uppercase font-bold">
              Fitur Unggulan
            </h2>
            <p className="font-pixel-sm text-[10px] text-neutral-700 mt-2">
              Teknologi Web3 tercanggih untuk event creator.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="group bg-white border-[3px] border-black p-5 hover:-translate-y-0.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] transition-all duration-100 flex gap-4 items-start"
              >
                <div className="w-11 h-11 border-[3px] border-black bg-[#FF5722] text-white flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] group-hover:scale-105 transition-transform">
                  <feat.icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-pixel-lg text-2xl font-bold text-black mb-1.5 uppercase">{feat.title}</h3>
                  <p className="font-pixel-sm text-[9px] text-neutral-600 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4: Event Launcher Form
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 bg-white/20 border-t-4 border-black" id="launcher-section">
          <div className="section-container max-w-3xl">
            <div className="bg-white neo-border neo-shadow p-6 sm:p-8">
              
              {/* Header */}
              <div className="text-center max-w-md mx-auto mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5722]/15 border-2 border-black text-[#FF5722] font-pixel-sm text-[9px] uppercase tracking-wider font-bold mb-3">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Creator Portal
                </span>
                <h2 className="font-pixel-lg text-4xl text-black font-bold uppercase">
                  Luncurkan Tiket Acara Baru
                </h2>
                <p className="font-pixel-sm text-[10px] text-neutral-700 mt-2">
                  Hubungkan wallet untuk on-chain, atau coba langsung dalam Mode Sandbox.
                </p>
              </div>

              {!isConnected ? (
                /* Wallet Lock */
                <div className="flex flex-col items-center justify-center py-12 text-center bg-neutral-50 border-[3px] border-black p-6">
                  <div className="w-12 h-12 border-[3px] border-black bg-white flex items-center justify-center mb-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <Ticket className="w-6 h-6 text-black -rotate-45" />
                  </div>
                  <h4 className="font-pixel-lg text-2xl text-black font-bold uppercase mb-1">
                    Hubungkan Wallet
                  </h4>
                  <p className="font-pixel-sm text-[9px] text-neutral-600 max-w-xs mb-5 uppercase">
                    Hubungkan wallet Anda untuk membuka formulir.
                  </p>
                  <div className="neo-border-button"><ConnectKitButton /></div>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleLaunchEvent} className="space-y-6">
                  {/* Mode Banner */}
                  <div className={`p-4 border-[3px] border-black text-xs flex gap-3 ${
                    isOwner
                      ? "bg-[#4CAF50]/15 text-black"
                      : "bg-[#FF5722]/15 text-black"
                  }`}>
                    {isOwner ? (
                      <CheckCircle2 className="w-5 h-5 text-[#4CAF50] shrink-0 mt-0.5 stroke-[2.5]" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-[#FF5722] shrink-0 mt-0.5 stroke-[2.5]" />
                    )}
                    <div className="font-pixel-sm">
                      <p className="font-bold text-[10px] uppercase">
                        {isOwner ? "Mode: On-Chain (Base Sepolia)" : "Mode: Sandbox / Simulasi"}
                      </p>
                      <p className="text-[8px] text-neutral-600 mt-1.5 leading-relaxed uppercase">
                        {isOwner
                          ? "Tiket akan ter-mint di blockchain Base Sepolia secara permanen."
                          : "Event disimpan di browser lokal (localStorage) sebagai demo simulasi."}
                      </p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Nama Event</label>
                      <input
                        type="text"
                        placeholder="Contoh: Coldplay Jakarta"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-[3px] border-black bg-white font-pixel-sm text-[9px] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Kategori NFT</label>
                      <div className="relative">
                        <select
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                          className="w-full pl-4 pr-10 py-3 border-[3px] border-black bg-white font-pixel-sm text-[9px] appearance-none cursor-pointer"
                        >
                          <option value="1">Reguler (Token #1)</option>
                          <option value="2">VIP (Token #2)</option>
                          <option value="3">VVIP (Token #3)</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none stroke-[2.5]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Harga (IDRX)</label>
                      <input
                        type="number"
                        min="1000"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(Number(e.target.value))}
                        required
                        className="w-full px-4 py-3 border-[3px] border-black bg-white font-mono text-xs text-black focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Jumlah Tiket</label>
                      <input
                        type="number"
                        min="1"
                        value={eventVolume}
                        onChange={(e) => setEventVolume(Number(e.target.value))}
                        required
                        className="w-full px-4 py-3 border-[3px] border-black bg-white font-mono text-xs text-black focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Kota</label>
                      <div className="relative">
                        <select
                          value={eventCity}
                          onChange={(e) => setEventCity(e.target.value)}
                          className="w-full pl-4 pr-10 py-3 border-[3px] border-black bg-white font-pixel-sm text-[9px] appearance-none cursor-pointer"
                        >
                          <option value="Jakarta">Jakarta</option>
                          <option value="Bandung">Bandung</option>
                          <option value="Yogyakarta">Yogyakarta</option>
                          <option value="Surabaya">Surabaya</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none stroke-[2.5]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Venue</label>
                      <input
                        type="text"
                        placeholder="Contoh: Stadion GBK"
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-[3px] border-black bg-white font-pixel-sm text-[9px] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Tanggal</label>
                      <input
                        type="text"
                        placeholder="Contoh: 12 Juli 2026"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-[3px] border-black bg-white font-pixel-sm text-[9px] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-pixel-sm text-[9px] font-bold text-black block uppercase tracking-wider">Price Ceiling</label>
                      <div className="relative">
                        <select
                          disabled={isOwner}
                          value={isOwner ? 10 : priceCeilingMarkup}
                          onChange={(e) => {
                            if (!isOwner) setPriceCeilingMarkup(Number(e.target.value));
                          }}
                          className={`w-full pl-4 pr-10 py-3 border-[3px] border-black bg-white font-pixel-sm text-[9px] appearance-none ${
                            isOwner ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <option value="0">0% (Sama Harga)</option>
                          <option value="5">5% (1.05x)</option>
                          <option value="10">10% (1.1x)</option>
                          <option value="20">20% (1.2x)</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none stroke-[2.5]" />
                      </div>
                      {isOwner && (
                        <p className="font-pixel-sm text-[8px] text-amber-600 leading-relaxed flex items-start gap-1 uppercase mt-1">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 stroke-[2.5]" />
                          Mode On-Chain: Ceiling dikunci 10% di smart contract.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLaunching}
                    className="w-full py-4 border-[3px] border-black bg-[#FF5722] text-white font-pixel-sm text-[10px] uppercase font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-[#E64A19] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                      {isLaunching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Meluncurkan...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          {isOwner ? "Luncurkan On-Chain" : "Simulasikan (Sandbox)"}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
