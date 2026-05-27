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
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  PlusCircle,
  Coins,
  Share2,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Zap
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

  const isOwner = contractOwner && address && contractOwner.toString().toLowerCase() === address.toLowerCase();

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
        const priceInWei = parseUnits(eventPrice.toString(), 2); // 2 decimals for IDRX

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
        priceCeilingBps: Number(10000 + priceCeilingMarkup * 100), // Enforce selected price ceiling limit (e.g., 10% = 11000 bps)
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

      <main className="flex-1 pb-24">
        {/* ─── Hero Marketing Section ───────────────────────────────────── */}
        <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36" id="hero-creator">
          {/* Neon warm orbs background */}
          <div className="absolute inset-0 -z-10">
            <div
              className="absolute -top-32 -right-32 w-137.5 h-137.5 rounded-full animate-orb-1 opacity-30"
              style={{
                background: "radial-gradient(circle, #FF8A50 0%, #FFE0C2 50%, transparent 80%)",
              }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-112.5 h-112.5 rounded-full animate-orb-2 opacity-20"
              style={{
                background: "radial-gradient(circle, #FFCCA3 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Text Area */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-semibold text-warm-700 animate-fade-in-up">
                  <Sparkles className="w-4 h-4" />
                  Billet untuk Kreator — Solusi Event On-Chain
                </span>
                
                <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl tracking-tight leading-none text-bark">
                  Hi, <span className="text-gradient-warm">Event Creator!</span> <br />
                  Mau bikin konser musik? <br />
                  Billet siap jadi #SolusiEvent kamu.
                </h1>
                
                <p className="text-stone text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Luncurkan tiket digital aman dalam bentuk NFT ERC-1155 di jaringan Base L2. 
                  Terlindungi sepenuhnya dari pemalsuan dan calo liar dengan batas resale otomatis.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <a
                    href="#calculator-section"
                    className="px-7 py-3.5 rounded-2xl bg-bark text-white font-heading font-semibold text-sm hover:shadow-lg transition-all"
                  >
                    Hitung Pendapatan
                  </a>
                  <a
                    href="#launcher-section"
                    className="px-7 py-3.5 rounded-2xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-semibold text-sm hover:shadow-warm-lg hover:scale-[1.02] transition-all"
                  >
                    Luncurkan Event Baru
                  </a>
                </div>

                {/* Trust Stats */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-bark/5 text-center lg:text-left">
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark">30.000+</h3>
                    <p className="text-stone text-xs">Event Creator Terdaftar</p>
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark">Rp 0</h3>
                    <p className="text-stone text-xs">Biaya Pembuatan Tiket</p>
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark">5 M+</h3>
                    <p className="text-stone text-xs">Volume Transaksi On-Chain</p>
                  </div>
                </div>
              </div>

              {/* Graphic Mockup Dashboard */}
              <div className="lg:col-span-5 relative">
                <div className="absolute inset-0 bg-linear-to-tr from-warm-500/10 to-orange-400/5 rounded-3xl blur-2xl -z-10" />
                <div className="rounded-3xl glass p-6 border border-white/40 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-bark/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                      <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
                    </div>
                    <span className="text-[10px] font-mono text-stone">billet-creator-dashboard.eth</span>
                  </div>

                  {/* Mock Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cream/40 p-4 rounded-2xl border border-bark/5">
                      <p className="text-[10px] text-stone font-semibold uppercase tracking-wider">Tiket Terjual</p>
                      <h4 className="font-heading font-extrabold text-xl text-bark mt-1">1.482 / 1.500</h4>
                      <div className="w-full bg-sand h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-warm-500 h-full rounded-full w-[92%]" />
                      </div>
                    </div>
                    <div className="bg-cream/40 p-4 rounded-2xl border border-bark/5">
                      <p className="text-[10px] text-stone font-semibold uppercase tracking-wider">Royalti Resale</p>
                      <h4 className="font-heading font-extrabold text-xl text-green-600 mt-1">+ Rp 7.410.000</h4>
                      <p className="text-[9px] text-stone/60 mt-2 flex items-center gap-1 font-mono">
                        <TrendingUp className="w-3 h-3 text-green-500" /> 148 kali resale aktif
                      </p>
                    </div>
                  </div>

                  {/* Mock Activity List */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-bark">Aktivitas Tiket Terbaru (Real-Time)</p>
                    <div className="space-y-2">
                      {[
                        { type: "Primary Buy", addr: "0x3D36...789", desc: "Membeli 2 Tiket VIP", val: "Rp 700.000", ok: true },
                        { type: "Resale Royalty", addr: "0x8A80...ABC", desc: "Menerima Royalti Resale 5%", val: "+ Rp 55.000", ok: false },
                        { type: "Primary Buy", addr: "0x1A16...D3A", desc: "Membeli 1 Tiket Reguler", val: "Rp 150.000", ok: true }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 border border-bark/5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.ok ? "bg-green-500 animate-pulse-warm" : "bg-warm-500"}`} />
                            <div>
                              <p className="font-bold text-bark">{item.type}</p>
                              <p className="text-[10px] text-stone">{item.desc} ({item.addr})</p>
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
          </div>
        </section>

        {/* ─── Revenue Calculator Section ───────────────────────────────── */}
        <section className="py-20 bg-white/40 border-y border-bark/5" id="calculator-section">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="font-heading font-extrabold text-3xl text-bark flex items-center justify-center gap-2">
                Hitung Perkiraan Pendapatan Event Kamu
                <Calculator className="w-7 h-7 text-warm-500" />
              </h2>
              <p className="text-stone text-sm sm:text-base mt-2">
                Bandingkan bagaimana sistem Billet memberi Anda untung lebih banyak melalui passive income royalti resale on-chain!
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Input Panel */}
              <div className="lg:col-span-5 rounded-3xl glass p-6 border border-white/50 space-y-6">
                <h3 className="font-heading font-bold text-lg text-bark border-b border-bark/5 pb-3">Konfigurasi Penjualan</h3>
                
                {/* Event Category Select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-bark block">Kategori / Jenis Event</label>
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
                      className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark font-semibold text-sm appearance-none focus:outline-hidden focus:border-warm-500 transition-all cursor-pointer"
                    >
                      {eventCategories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
                  </div>
                </div>

                {/* Ticket Price Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-bark">Harga Per Tiket (Rupiah)</label>
                    <span className="text-[10px] text-stone font-mono">Rp {ticketPrice.toLocaleString("id-ID")}</span>
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
                  <div className="flex justify-between text-[10px] text-stone font-semibold">
                    <span>Rp 30rb</span>
                    <span>Rp 1jt</span>
                    <span>Rp 2jt</span>
                  </div>
                </div>

                {/* Ticket Volume Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-bark">Jumlah Tiket Yang Dijual</label>
                    <span className="text-[10px] text-stone font-mono">{ticketVolume.toLocaleString("id-ID")} Lembar</span>
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
                  <div className="flex justify-between text-[10px] text-stone font-semibold">
                    <span>50</span>
                    <span>10rb</span>
                    <span>25rb</span>
                  </div>
                </div>
              </div>

              {/* Output Results Panel */}
              <div className="lg:col-span-7 rounded-3xl bg-bark text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-warm-500/10 blur-[80px]" />

                <div className="space-y-6 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20 uppercase tracking-wider">
                    <Coins className="w-3.5 h-3.5" />
                    Billet Fee-Saver Enabled
                  </span>

                  <h3 className="font-heading font-black text-2xl sm:text-3xl">Estimasi Pendapatan Event</h3>

                  {/* Calculations Details */}
                  <div className="grid sm:grid-cols-3 gap-5 pt-4">
                    {/* Primary Sale */}
                    <div className="bg-white/5 p-4.5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/50 uppercase font-semibold">1. Penjualan Tiket Utama</p>
                      <h4 className="font-heading font-black text-xl text-white mt-1">
                        Rp {grossSales.toLocaleString("id-ID")}
                      </h4>
                      <p className="text-[9px] text-white/40 mt-2 font-mono">Primary Sale 100%</p>
                    </div>

                    {/* Resale Royalty */}
                    <div className="bg-white/5 p-4.5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/50 uppercase font-semibold">2. Royalti Resale (Secondary)</p>
                      <h4 className="font-heading font-black text-xl text-green-400 mt-1">
                        + Rp {resaleRoyalties.toLocaleString("id-ID")}
                      </h4>
                      <p className="text-[9px] text-green-400/60 mt-2 font-mono">
                        Asumsi {Math.round(selectedCat.resaleRate * 100)}% resale aktif, royalti {Math.round(selectedCat.royaltyRate * 100)}%
                      </p>
                    </div>

                    {/* Platform Fee */}
                    <div className="bg-white/5 p-4.5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/50 uppercase font-semibold">3. Platform Fee</p>
                      <h4 className="font-heading font-black text-xl text-warm-400 mt-1">
                        - Rp {platformFee.toLocaleString("id-ID")}
                      </h4>
                      <p className="text-[9px] text-warm-400/80 mt-2 font-bold uppercase tracking-wider">
                        PROMO 0% PLATFORM FEE!
                      </p>
                    </div>
                  </div>

                  {/* Visual Bar Breakdown Chart */}
                  <div className="space-y-2 pt-4">
                    <p className="text-xs text-white/70 font-semibold">Proporsi Struktur Pendapatan Bersih:</p>
                    <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden flex">
                      <div className="bg-warm-500 h-full transition-all duration-300" style={{ width: `${primaryPercentage}%` }} />
                      <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${royaltyPercentage}%` }} />
                    </div>
                    <div className="flex gap-4 text-[10px] text-white/50 font-semibold font-mono">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-warm-500 rounded" /> Penjualan Utama ({primaryPercentage}%)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded" /> Royalti Resale ({royaltyPercentage}%)</span>
                    </div>
                  </div>
                </div>

                {/* Final Net Profits */}
                <div className="pt-6 mt-6 border-t border-white/10 relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Estimasi Total Pendapatan Bersih (Net)</p>
                    <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-gradient-warm leading-tight mt-1">
                      Rp {netEarnings.toLocaleString("id-ID")}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/60 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <Info className="w-4 h-4 text-warm-400 shrink-0" />
                    <span>Hingga 112% profit lebih tinggi dibanding sistem konvensional!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Grid Section ────────────────────────────────────── */}
        <section className="py-20 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading font-extrabold text-3xl text-bark">
              Tingkatkan Event Dengan Fitur Unggulan
            </h2>
            <p className="text-stone text-sm sm:text-base mt-2">
              Billet menghadirkan teknologi Web3 tercanggih untuk melipatgandakan kepuasan fans dan organizer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Smart NFT Ticketing (ERC-1155)",
                desc: "Seluruh tiket di-mint sebagai token ERC-1155 di Base L2. Nol pemalsuan tiket, perlindungan kepemilikan 100% on-chain."
              },
              {
                icon: Percent,
                title: "Price Ceiling Otomatis",
                desc: "Kontrak pintar membatasi harga resale. Calo tidak bisa menjual di atas markup wajar (e.g. max 1.1x dari harga orisinal)."
              },
              {
                icon: Coins,
                title: "Resale Royalty (ERC-2981)",
                desc: "Menerima royalti otomatis setiap kali tiket berpindah tangan di pasar sekunder. Keuntungan pasif instan langsung ke wallet."
              },
              {
                icon: Activity,
                title: "Laporan Penjualan Real-Time",
                desc: "Akses data penjualan tiket, grafik registrasi pemegang tiket, dan mutasi resale langsung dari blockchain secara transparan."
              },
              {
                icon: Zap,
                title: "Check-in Pintu Masuk Gasless",
                desc: "Verifikasi kepemilikan tiket di pintu masuk secara instan via tanda tangan cryptographic (tanpa gas fee) hanya dalam 1 detik."
              },
              {
                icon: Layers,
                title: "Multi-Kategori Kustom",
                desc: "Format pasokan tiket Anda secara dinamis dari kelas Reguler, VIP, hingga VVIP dengan metadata gambar dan ornamen eksklusif."
              }
            ].map((feat, i) => (
              <div
                key={feat.title}
                className="group relative rounded-3xl glass p-6 hover:shadow-warm-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-warm-400 to-warm-600 text-white flex items-center justify-center mb-5 shadow-warm transition-transform group-hover:scale-105">
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-bark mb-2">{feat.title}</h3>
                  <p className="text-stone text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Sandbox Event Creator Launcher Panel ──────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10" id="launcher-section">
          <div className="rounded-3xl glass-strong border border-white/50 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Background design */}
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-warm-500/10 blur-[80px]" />

            <div className="relative z-10">
              <div className="text-center max-w-xl mx-auto mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-500/10 text-warm-700 text-xs font-bold border border-warm-200 uppercase tracking-wider mb-3">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Creator Portal Sandbox
                </span>
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark">Luncurkan Tiket Acara Baru</h2>
                <p className="text-stone text-xs sm:text-sm mt-1">
                  Hubungkan wallet Anda untuk membuat event on-chain di Base Sepolia, atau simulasikan langsung dalam Mode Sandbox.
                </p>
              </div>

              {!isConnected ? (
                /* Wallet Lock Panel */
                <div className="flex flex-col items-center justify-center py-12 text-center bg-cream/30 border border-bark/5 rounded-2xl p-6">
                  <div className="w-14 h-14 rounded-2xl bg-sand/60 flex items-center justify-center mb-4">
                    <Ticket className="w-6 h-6 text-stone/40" />
                  </div>
                  <h4 className="font-heading font-semibold text-base text-bark mb-1">
                    Hubungkan Wallet Anda
                  </h4>
                  <p className="text-stone text-xs max-w-xs mb-5">
                    Hubungkan wallet kripto Anda untuk membuka formulir launcher tiket event on-chain.
                  </p>
                  <ConnectKitButton />
                </div>
              ) : (
                /* Active Form Launcher Panel */
                <form onSubmit={handleLaunchEvent} className="space-y-6">
                  {/* Mode Banner Indicator */}
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex gap-3 ${
                    isOwner
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                    {isOwner ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">
                        {isOwner ? "Mode Aktif: On-Chain (Base Sepolia)" : "Mode Aktif: Sandbox / Simulasi"}
                      </p>
                      <p className="text-xs opacity-90 mt-0.5">
                        {isOwner
                          ? "Anda terdeteksi sebagai owner smart contract! Tiket baru yang Anda buat akan langsung ter-mint di blockchain Base Sepolia."
                          : "Anda terdeteksi sebagai creator demo. Halaman akan menjalankan simulasi penerbitan tiket dan meregistrasikannya secara instan di database browser lokal Anda (localStorage)."}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Event Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-bark block">Nama Acara / Event</label>
                      <input
                        type="text"
                        placeholder="Contoh: Coldplay Music of the Spheres"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark text-sm font-semibold focus:outline-hidden focus:border-warm-500 transition-all"
                      />
                    </div>

                    {/* Kategori Tiket */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-bark block">Kategori NFT Kelas</label>
                      <select
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value)}
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark font-semibold text-sm focus:outline-hidden focus:border-warm-500 transition-all cursor-pointer"
                      >
                        <option value="1">Reguler (Token #1)</option>
                        <option value="2">VIP (Token #2)</option>
                        <option value="3">VVIP (Token #3)</option>
                      </select>
                    </div>

                    {/* Ticket Price */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-bark block">Harga Tiket Primer (IDRX)</label>
                      <input
                        type="number"
                        min="1000"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(Number(e.target.value))}
                        required
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark text-sm font-mono font-semibold focus:outline-hidden focus:border-warm-500 transition-all"
                      />
                    </div>

                    {/* Ticket Pasokan */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-bark block">Pasokan Tiket (Jumlah Lembar)</label>
                      <input
                        type="number"
                        min="1"
                        value={eventVolume}
                        onChange={(e) => setEventVolume(Number(e.target.value))}
                        required
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark text-sm font-mono font-semibold focus:outline-hidden focus:border-warm-500 transition-all"
                      />
                    </div>

                    {/* City Select */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-bark block">Kota Lokasi Acara</label>
                      <select
                        value={eventCity}
                        onChange={(e) => setEventCity(e.target.value)}
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark font-semibold text-sm focus:outline-hidden focus:border-warm-500 transition-all cursor-pointer"
                      >
                        <option value="Jakarta">Jakarta</option>
                        <option value="Bandung">Bandung</option>
                        <option value="Yogyakarta">Yogyakarta</option>
                        <option value="Surabaya">Surabaya</option>
                      </select>
                    </div>

                    {/* Venue */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-bark block">Venue / Tempat Acara</label>
                      <input
                        type="text"
                        placeholder="Contoh: Stadion Utama GBK"
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        required
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark text-sm font-semibold focus:outline-hidden focus:border-warm-500 transition-all"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-bark block">Tanggal Acara</label>
                      <input
                        type="text"
                        placeholder="Contoh: 12 Juli 2026"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark text-sm font-semibold focus:outline-hidden focus:border-warm-500 transition-all"
                      />
                    </div>

                    {/* Price Ceiling */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-bark block">Batas Price Ceiling Markup</label>
                        <span className="text-[10px] text-warm-600 font-extrabold uppercase">Markup Max {priceCeilingMarkup}%</span>
                      </div>
                      <select
                        value={priceCeilingMarkup}
                        onChange={(e) => setPriceCeilingMarkup(Number(e.target.value))}
                        className="w-full bg-cream/50 px-4 py-3 rounded-2xl border border-bark/10 text-bark font-semibold text-sm focus:outline-hidden focus:border-warm-500 transition-all cursor-pointer"
                      >
                        <option value="0">0% (Beli & Resale Hanya Bisa Sama Harga)</option>
                        <option value="5">5% Maksimum Markup (1.05x)</option>
                        <option value="10">10% Maksimum Markup (1.1x)</option>
                        <option value="20">20% Maksimum Markup (1.2x)</option>
                      </select>
                      <p className="text-[10px] text-stone/60 leading-normal">
                        * Catatan: Dalam Sandbox Mode, batas ini langsung diuji pada pasar sekunder. Pada On-Chain Mode, parameter ini dikunci per kategori tiket di kontrak NFT.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLaunching}
                    className="w-full py-4 rounded-2xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-black text-base shadow-warm-lg hover:shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {isLaunching ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Meluncurkan Tiket Acara...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5" />
                        {isOwner ? "Luncurkan Tiket Sekarang (On-Chain)" : "Simulasikan Tiket Acara Baru (Sandbox)"}
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
