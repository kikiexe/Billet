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
    } catch (err: any) {
      console.error(err);
      toast.error("Transaksi Gagal!", {
        description: err.message || "Gagal mengirimkan transaksi on-chain."
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream relative">
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════
            SECTION 1: Hero — Clean & Focused
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28" id="hero-creator">
          {/* Subtle background orb */}
          <div className="absolute inset-0 -z-10">
            <div
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full animate-orb-1 opacity-20"
              style={{ background: "radial-gradient(circle, #FF8A50 0%, #FFE0C2 50%, transparent 80%)" }}
            />
          </div>

          <div className="section-container">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              {/* Text */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold border border-warm-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  Billet untuk Kreator
                </span>
                
                <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.1] text-bark">
                  Luncurkan Tiket{" "}
                  <span className="text-gradient-warm">On-Chain</span>
                  <br className="hidden sm:block" />
                  dalam Hitungan Menit.
                </h1>
                
                <p className="text-stone text-sm sm:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Buat tiket digital NFT ERC-1155 di Base L2. Terlindungi dari pemalsuan dan calo, 
                  dengan batas resale otomatis dan royalti langsung ke wallet Anda.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <a
                    href="#calculator-section"
                    className="px-5 py-3 rounded-xl bg-bark text-white font-heading font-semibold text-sm hover:bg-bark-light transition-colors"
                  >
                    Hitung Pendapatan
                  </a>
                  <a
                    href="#launcher-section"
                    className="px-5 py-3 rounded-xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-semibold text-sm shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all"
                  >
                    Luncurkan Event
                  </a>
                </div>

                {/* Trust Stats */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-bark/6 text-center lg:text-left">
                  {[
                    { value: "30.000+", label: "Creator Terdaftar" },
                    { value: "Rp 0", label: "Biaya Pembuatan" },
                    { value: "5 M+", label: "Volume Transaksi" }
                  ].map((stat, i) => (
                    <div key={i}>
                      <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-bark">{stat.value}</h3>
                      <p className="text-stone text-[11px] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard Mockup (compact) */}
              <div className="lg:col-span-5 relative">
                <div className="rounded-2xl bg-white border border-bark/6 p-5 shadow-card space-y-4">
                  {/* Window chrome */}
                  <div className="flex items-center justify-between pb-3 border-b border-bark/6">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-[9px] font-mono text-stone/50">billet-dashboard.eth</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-sand/30 p-3.5 rounded-xl border border-bark/4">
                      <p className="text-[9px] text-stone/50 font-semibold uppercase tracking-wider">Tiket Terjual</p>
                      <h4 className="font-heading font-bold text-lg text-bark mt-1">1.482 / 1.500</h4>
                      <div className="w-full bg-sand/60 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-warm-500 h-full rounded-full w-[92%]" />
                      </div>
                    </div>
                    <div className="bg-sand/30 p-3.5 rounded-xl border border-bark/4">
                      <p className="text-[9px] text-stone/50 font-semibold uppercase tracking-wider">Royalti Resale</p>
                      <h4 className="font-heading font-bold text-lg text-green-600 mt-1">+ Rp 7.4jt</h4>
                      <p className="text-[9px] text-stone/40 mt-2 flex items-center gap-1 font-mono">
                        <TrendingUp className="w-3 h-3 text-green-500" /> 148 resale
                      </p>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-bark">Aktivitas Terbaru</p>
                    {[
                      { type: "Primary Buy", desc: "Membeli 2 Tiket VIP", val: "Rp 700.000", ok: true },
                      { type: "Resale Royalty", desc: "Royalti 5%", val: "+ Rp 55.000", ok: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/50 border border-bark/4 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-green-500" : "bg-warm-500"}`} />
                          <div>
                            <p className="font-semibold text-bark">{item.type}</p>
                            <p className="text-[9px] text-stone/50">{item.desc}</p>
                          </div>
                        </div>
                        <span className={`font-bold font-mono ${item.ok ? "text-bark" : "text-green-600"}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="section-divider" />

        {/* ═══════════════════════════════════════════════════════
            SECTION 2: Revenue Calculator
        ═══════════════════════════════════════════════════════ */}
        <section className="section-spacing bg-white/40 border-y border-bark/4" id="calculator-section">
          <div className="section-container">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark flex items-center justify-center gap-2">
                Hitung Pendapatan
                <Calculator className="w-6 h-6 text-warm-500" />
              </h2>
              <p className="text-stone text-sm mt-2">
                Lihat estimasi pendapatan dari penjualan primer + royalti resale on-chain.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Input Panel */}
              <div className="lg:col-span-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 space-y-5 shadow-card">
                <h3 className="font-heading font-bold text-base text-bark border-b border-bark/6 pb-3">
                  Konfigurasi
                </h3>
                
                {/* Event Category Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Jenis Event</label>
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
                      className="input-field appearance-none cursor-pointer pr-10"
                    >
                      {eventCategories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/40 pointer-events-none" />
                  </div>
                </div>

                {/* Ticket Price */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-bark uppercase tracking-wider">Harga Per Tiket</label>
                    <span className="text-[11px] text-stone font-mono">Rp {ticketPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="2000000"
                    step="10000"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="w-full accent-warm-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-stone/40 font-mono">
                    <span>Rp 30rb</span>
                    <span>Rp 2jt</span>
                  </div>
                </div>

                {/* Ticket Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-bark uppercase tracking-wider">Jumlah Tiket</label>
                    <span className="text-[11px] text-stone font-mono">{ticketVolume.toLocaleString("id-ID")} lembar</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="25000"
                    step="50"
                    value={ticketVolume}
                    onChange={(e) => setTicketVolume(Number(e.target.value))}
                    className="w-full accent-warm-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-stone/40 font-mono">
                    <span>50</span>
                    <span>25.000</span>
                  </div>
                </div>
              </div>

              {/* Output Panel */}
              <div className="lg:col-span-7 rounded-2xl bg-bark text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-card">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-warm-500/8 blur-[80px]" />

                <div className="space-y-5 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-[10px] font-bold border border-green-500/15 uppercase tracking-wider">
                    <Coins className="w-3 h-3" />
                    0% Platform Fee — Promo!
                  </span>

                  <h3 className="font-heading font-extrabold text-xl sm:text-2xl">Estimasi Pendapatan</h3>

                  {/* Breakdown */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[9px] text-white/40 uppercase font-semibold tracking-wider">Penjualan Utama</p>
                      <h4 className="font-heading font-bold text-lg text-white mt-1">
                        Rp {grossSales.toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[9px] text-white/40 uppercase font-semibold tracking-wider">Royalti Resale</p>
                      <h4 className="font-heading font-bold text-lg text-green-400 mt-1">
                        + Rp {resaleRoyalties.toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[9px] text-white/40 uppercase font-semibold tracking-wider">Platform Fee</p>
                      <h4 className="font-heading font-bold text-lg text-warm-400 mt-1">
                        Rp 0
                      </h4>
                      <p className="text-[8px] text-warm-400/70 mt-1 font-bold uppercase tracking-wider">PROMO!</p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-white/50 font-semibold">Proporsi Pendapatan:</p>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden flex">
                      <div className="bg-warm-500 h-full transition-all duration-300" style={{ width: `${primaryPercentage}%` }} />
                      <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${royaltyPercentage}%` }} />
                    </div>
                    <div className="flex gap-4 text-[9px] text-white/40 font-mono">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-warm-500 rounded" /> Primer ({primaryPercentage}%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded" /> Royalti ({royaltyPercentage}%)</span>
                    </div>
                  </div>
                </div>

                {/* Net total */}
                <div className="pt-5 mt-5 border-t border-white/10 relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Total Pendapatan Bersih</p>
                    <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-gradient-warm leading-tight mt-0.5">
                      Rp {netEarnings.toLocaleString("id-ID")}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/4 px-3 py-2 rounded-lg border border-white/5">
                    <Info className="w-3.5 h-3.5 text-warm-400 shrink-0" />
                    <span>Hingga 112% lebih tinggi dari konvensional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="section-divider" />

        {/* ═══════════════════════════════════════════════════════
            SECTION 3: Features (Compact 2x3 Grid)
        ═══════════════════════════════════════════════════════ */}
        <section className="section-spacing section-container">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark">
              Fitur Unggulan
            </h2>
            <p className="text-stone text-sm mt-2">
              Teknologi Web3 tercanggih untuk event creator.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="group rounded-2xl bg-white/60 border border-bark/6 p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-warm-400 to-warm-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <feat.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-bark mb-1">{feat.title}</h3>
                  <p className="text-stone text-xs leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="section-divider" />

        {/* ═══════════════════════════════════════════════════════
            SECTION 4: Event Launcher Form
        ═══════════════════════════════════════════════════════ */}
        <section className="section-spacing" id="launcher-section">
          <div className="section-container max-w-3xl">
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 sm:p-8 shadow-card relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-warm-500/5 blur-[60px]" />

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center max-w-md mx-auto mb-8">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warm-50 text-warm-700 text-[11px] font-bold border border-warm-100 uppercase tracking-wider mb-3">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Creator Portal
                  </span>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-bark">
                    Luncurkan Tiket Acara Baru
                  </h2>
                  <p className="text-stone text-xs mt-1.5">
                    Hubungkan wallet untuk on-chain, atau coba langsung dalam Mode Sandbox.
                  </p>
                </div>

                {!isConnected ? (
                  /* Wallet Lock */
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-sand/20 border border-bark/4 rounded-xl p-6">
                    <div className="w-12 h-12 rounded-xl bg-sand/50 flex items-center justify-center mb-4">
                      <Ticket className="w-5 h-5 text-stone/30" />
                    </div>
                    <h4 className="font-heading font-semibold text-base text-bark mb-1">
                      Hubungkan Wallet
                    </h4>
                    <p className="text-stone text-xs max-w-xs mb-5">
                      Hubungkan wallet Anda untuk membuka formulir.
                    </p>
                    <ConnectKitButton />
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleLaunchEvent} className="space-y-5">
                    {/* Mode Banner */}
                    <div className={`p-3.5 rounded-xl border text-xs flex gap-3 ${
                      isOwner
                        ? "bg-green-50/70 border-green-100 text-green-800"
                        : "bg-amber-50/70 border-amber-100 text-amber-800"
                    }`}>
                      {isOwner ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-[11px]">
                          {isOwner ? "Mode: On-Chain (Base Sepolia)" : "Mode: Sandbox / Simulasi"}
                        </p>
                        <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed">
                          {isOwner
                            ? "Tiket akan ter-mint di blockchain Base Sepolia."
                            : "Event disimpan di browser lokal (localStorage) sebagai demo."}
                        </p>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Nama Event</label>
                        <input
                          type="text"
                          placeholder="Contoh: Coldplay Jakarta"
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          required
                          className="input-field"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Kategori NFT</label>
                        <select
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                          className="input-field appearance-none cursor-pointer"
                        >
                          <option value="1">Reguler (Token #1)</option>
                          <option value="2">VIP (Token #2)</option>
                          <option value="3">VVIP (Token #3)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Harga (IDRX)</label>
                        <input
                          type="number"
                          min="1000"
                          value={eventPrice}
                          onChange={(e) => setEventPrice(Number(e.target.value))}
                          required
                          className="input-field font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Jumlah Tiket</label>
                        <input
                          type="number"
                          min="1"
                          value={eventVolume}
                          onChange={(e) => setEventVolume(Number(e.target.value))}
                          required
                          className="input-field font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Kota</label>
                        <select
                          value={eventCity}
                          onChange={(e) => setEventCity(e.target.value)}
                          className="input-field appearance-none cursor-pointer"
                        >
                          <option value="Jakarta">Jakarta</option>
                          <option value="Bandung">Bandung</option>
                          <option value="Yogyakarta">Yogyakarta</option>
                          <option value="Surabaya">Surabaya</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Venue</label>
                        <input
                          type="text"
                          placeholder="Contoh: Stadion GBK"
                          value={eventVenue}
                          onChange={(e) => setEventVenue(e.target.value)}
                          required
                          className="input-field"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Tanggal</label>
                        <input
                          type="text"
                          placeholder="Contoh: 12 Juli 2026"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          required
                          className="input-field"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-semibold text-bark block uppercase tracking-wider">Price Ceiling</label>
                          <span className="text-[10px] text-warm-600 font-bold">
                            {isOwner ? "10% (Default)" : `Max ${priceCeilingMarkup}%`}
                          </span>
                        </div>
                        <select
                          disabled={isOwner}
                          value={isOwner ? 10 : priceCeilingMarkup}
                          onChange={(e) => {
                            if (!isOwner) setPriceCeilingMarkup(Number(e.target.value));
                          }}
                          className={`input-field appearance-none ${
                            isOwner ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <option value="0">0% (Sama Harga)</option>
                          <option value="5">5% (1.05x)</option>
                          <option value="10">10% (1.1x)</option>
                          <option value="20">20% (1.2x)</option>
                        </select>
                        {isOwner && (
                          <p className="text-[9px] text-amber-600 leading-relaxed flex items-start gap-1">
                            <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
                            Mode On-Chain: Ceiling dikunci 10% di smart contract.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLaunching}
                      className="w-full py-3.5 rounded-xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-bold text-sm shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
