"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Film,
  Star,
  Ticket,
  Tag,
  Volume2,
  Trophy,
  BookOpen,
  Clapperboard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BuyTicketDialog } from "@/components/events/BuyTicketDialog";
import { useListings, type ListingWithId } from "@/hooks/useListings";
import { formatIDRX, getCategoryName, getCategoryGradient } from "@/lib/format";
import { toast } from "sonner";

// ─── Interfaces ──────────────────────────────────────────────────────────

interface RichEvent extends ListingWithId {
  title: string;
  category: "Musik" | "Seminar" | "Olahraga" | "Seni";
  city: "Jakarta" | "Bandung" | "Yogyakarta" | "Surabaya";
  date: string;
  venue: string;
  isMock: boolean;
  bannerGradient: string;
}

// ─── Carousel Banners ────────────────────────────────────────────────────

const carouselBanners = [
  {
    id: 1,
    title: "Tulus: Retrospektif Tour 2026",
    tagline: "Hi, Kawan! Mau bernyanyi bersama?",
    desc: "Konser eksklusif merayakan 15 tahun perjalanan musik Tulus di Stadion Utama Gelora Bung Karno.",
    date: "12 Juli 2026",
    venue: "Stadion Utama GBK, Jakarta",
    category: "Musik",
    gradient: "bg-warm-600",
    badgeText: "Terpopuler"
  },
  {
    id: 2,
    title: "Base Web3 Hackathon Indonesia",
    tagline: "Bangun dApp Masa Depan di Base L2",
    desc: "Hackathon 3 hari dengan bimbingan developer global. Total hadiah Rp 100 Juta dalam IDRX!",
    date: "15-18 Juni 2026",
    venue: "Gedung Sate IT Hub, Bandung",
    category: "Seminar",
    gradient: "bg-bark",
    badgeText: "Rekomendasi"
  },
  {
    id: 3,
    title: "Indonesia Badminton Open 2026",
    tagline: "Kembalinya Kejayaan Bulutangkis",
    desc: "Pertandingan bulutangkis tingkat dunia memperebutkan Piala Billet dan total hadiah Rp 250 Juta.",
    date: "22-26 Juli 2026",
    venue: "Istora Senayan, Jakarta",
    category: "Olahraga",
    gradient: "bg-warm-700",
    badgeText: "Tiket Terbatas"
  }
];

// ─── Mock Events Database ────────────────────────────────────────────────

const mockEvents: RichEvent[] = [
  {
    listingId: 101,
    seller: "0x3D3630A175B5F345672A1BCE3C45FFB123456789",
    tokenId: 2n, // VIP
    amount: 15n,
    pricePerUnit: 350000000000000000000000n, // Rp 350.000 (calibrated to 18 decimals)
    originalPrice: 350000000000000000000000n,
    active: true,
    isResale: false,
    title: "Tulus: Retrospektif Tour 2026",
    category: "Musik",
    city: "Jakarta",
    date: "12 Juli 2026",
    venue: "Stadion Utama GBK",
    isMock: true,
    bannerGradient: "from-purple-500 to-indigo-600"
  },
  {
    listingId: 102,
    seller: "0x8A8078F67A123EBC3D2A1C34FF8A123456789ABC",
    tokenId: 1n, // Reguler
    amount: 45n,
    pricePerUnit: 150000000000000000000000n, // Rp 150.000
    originalPrice: 150000000000000000000000n,
    active: true,
    isResale: false,
    title: "Web3 & AI Summit 2026",
    category: "Seminar",
    city: "Bandung",
    date: "15 Juni 2026",
    venue: "Gedung Sate IT Hub",
    isMock: true,
    bannerGradient: "from-blue-500 to-cyan-600"
  },
  {
    listingId: 103,
    seller: "0x1A1612C28DF0B234D3A1B28C8A54EFB123456789",
    tokenId: 1n, // Reguler
    amount: 20n,
    pricePerUnit: 200000000000000000000000n, // Rp 200.000
    originalPrice: 200000000000000000000000n,
    active: true,
    isResale: false,
    title: "Jakarta Half Marathon",
    category: "Olahraga",
    city: "Jakarta",
    date: "22 Juli 2026",
    venue: "Istora Senayan",
    isMock: true,
    bannerGradient: "from-green-500 to-teal-600"
  },
  {
    listingId: 104,
    seller: "0xE85A2A1A75B5F345672A1BCE3C45FFB123456789",
    tokenId: 1n, // Reguler
    amount: 30n,
    pricePerUnit: 180000000000000000000000n, // Rp 180.000
    originalPrice: 180000000000000000000000n,
    active: true,
    isResale: true,
    title: "Gudang Merdeka: Rock Concert",
    category: "Musik",
    city: "Yogyakarta",
    date: "05 Juni 2026",
    venue: "Stadion Kridosono",
    isMock: true,
    bannerGradient: "from-rose-500 to-[#FF6B35]"
  },
  {
    listingId: 105,
    seller: "0x9A3A1BC28DF0B234D3A1B28C8A54EFB123456789",
    tokenId: 3n, // VVIP
    amount: 8n,
    pricePerUnit: 450000000000000000000000n, // Rp 450.000
    originalPrice: 400000000000000000000000n, // Original Rp 400.000
    active: true,
    isResale: true,
    title: "Svara Festival: Harmoni Alam",
    category: "Musik",
    city: "Surabaya",
    date: "30 Juni 2026",
    venue: "Kawasan Hutan Pinus",
    isMock: true,
    bannerGradient: "from-amber-500 via-orange-500 to-[#FF6B35]"
  },
  {
    listingId: 106,
    seller: "0xC44A22F67A123EBC3D2A1C34FF8A123456789ABC",
    tokenId: 1n, // Reguler
    amount: 25n,
    pricePerUnit: 80000000000000000000000n, // Rp 80.000
    originalPrice: 80000000000000000000000n,
    active: true,
    isResale: false,
    title: "Jogja Art & Culture Show",
    category: "Seni",
    city: "Yogyakarta",
    date: "10 Juni 2026",
    venue: "Taman Budaya Yogyakarta",
    isMock: true,
    bannerGradient: "from-violet-500 to-fuchsia-600"
  },
  {
    listingId: 107,
    seller: "0x2563EBA175B5F345672A1BCE3C45FFB123456789",
    tokenId: 1n, // Reguler
    amount: 50n,
    pricePerUnit: 50000000000000000000000n, // Rp 50.000
    originalPrice: 50000000000000000000000n,
    active: true,
    isResale: false,
    title: "Next-Gen Dev: React & Solidity",
    category: "Seminar",
    city: "Surabaya",
    date: "25 Juni 2026",
    venue: "Grand City Hall",
    isMock: true,
    bannerGradient: "from-[#FF8A50] to-[#E85A2A]"
  }
];

// ─── Movies Database ─────────────────────────────────────────────────────

const mockMovies = [
  {
    id: 1,
    title: "Ghost Cell (2026)",
    genre: "Horor / Sci-Fi",
    rating: "9.2",
    price: 45000,
    duration: "1j 55m",
    imageUrl: "bg-gradient-to-tr from-[#3D3630] to-[#FF6B35]"
  },
  {
    id: 2,
    title: "Gudang Merica",
    genre: "Aksi / Komedi",
    rating: "8.8",
    price: 40000,
    duration: "2j 10m",
    imageUrl: "bg-gradient-to-tr from-bark to-rose-950"
  },
  {
    id: 3,
    title: "Lentera Sepatu Merah",
    genre: "Drama / Romansa",
    rating: "8.5",
    price: 42000,
    duration: "1j 48m",
    imageUrl: "bg-gradient-to-tr from-[#8A8078] to-amber-700"
  }
];

// ─── City List ───────────────────────────────────────────────────────────

const cities = [
  { name: "Jakarta", count: "12 Event", color: "from-[#FF6B35]/15 to-[#FF8A50]/5", icon: "🏢" },
  { name: "Bandung", count: "8 Event", color: "from-[#3B82F6]/15 to-blue-500/5", icon: "🏔️" },
  { name: "Yogyakarta", count: "6 Event", color: "from-[#10B981]/15 to-emerald-500/5", icon: "⛩️" },
  { name: "Surabaya", count: "9 Event", color: "from-[#8B5CF6]/15 to-indigo-500/5", icon: "🦈" }
];

export default function Home() {
  const { activeListings, isLoading, refetch } = useListings();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedListing, setSelectedListing] = useState<ListingWithId | null>(null);
  const [customEvents, setCustomEvents] = useState<RichEvent[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'onchain' | 'sandbox'>('all');

  // ─── Carousel Auto-Play ─────────────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // ─── Filter Events ──────────────────────────────────────────────────────

  const allEvents = useMemo(() => {
    // Convert on-chain active listings to RichEvent structure
    const chainEvents: RichEvent[] = activeListings.map((listing) => {
      const isRes = listing.isResale;
      const catId = Number(listing.tokenId);
      
      let cat: "Musik" | "Seminar" | "Olahraga" | "Seni" = "Musik";
      if (catId === 1) cat = "Musik";
      else if (catId === 2) cat = "Seminar";
      else if (catId === 3) cat = "Olahraga";

      let city: "Jakarta" | "Bandung" | "Yogyakarta" | "Surabaya" = "Jakarta";
      if (listing.listingId % 4 === 1) city = "Bandung";
      else if (listing.listingId % 4 === 2) city = "Yogyakarta";
      else if (listing.listingId % 4 === 3) city = "Surabaya";

      return {
        ...listing,
        title: `Tiket Resmi Billet: ${getCategoryName(listing.tokenId)}`,
        category: cat,
        city: city,
        date: "28 Juni 2026",
        venue: "Billet Arena Base",
        isMock: false,
        bannerGradient: getCategoryGradient(listing.tokenId)
      };
    });

    return [...chainEvents];
  }, [activeListings]);

  // ─── Filter Events ──────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const matchSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory =
        selectedCategory === "Semua" || event.category === selectedCategory;
      
      const matchCity = !selectedCity || event.city === selectedCity;

      return matchSearch && matchCategory && matchCity;
    });
  }, [allEvents, searchQuery, selectedCategory, selectedCity]);

  // ─── Buy / Simulation Action ────────────────────────────────────────────

  const handleBuyClick = (event: RichEvent) => {
    if (event.isMock) {
      // Mock Event Checkout simulation
      toast.success(`[Simulasi] Tiket untuk "${event.title}" berhasil masuk keranjang!`, {
        description: "Hubungkan wallet Anda dan kunjungi halaman /creator untuk meluncurkan tiket asli Anda sendiri secara on-chain.",
        duration: 5000,
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
    } else {
      // Real Blockchain listing opens the buy dialog
      setSelectedListing(event);
    }
  };

  const handleBuySuccess = () => {
    refetch();
    setSelectedListing(null);
  };

  return (
    <div className="min-h-screen flex flex-col neo-grid-bg relative text-black">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* ─── Hero Section (Neo-Brutalist Jendela Retro) ────────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Title Window & Feature List Window */}
            <div className="lg:col-span-7 space-y-8">
              {/* Retro Window 1: Large Tilted Banner */}
              <div className="bg-white neo-border neo-shadow p-6 relative overflow-hidden -rotate-1 hover:rotate-0 transition-transform duration-200">
                <div className="absolute top-2 right-3 flex items-center gap-1.5 font-pixel-sm text-[9px] border-2 border-black px-1.5 py-0.5 bg-neutral-200">
                  <span>TRIAL & ERROR</span>
                  <span className="font-bold border-l-2 border-black pl-1.5">X</span>
                </div>
                <div className="pt-6">
                  <h1 className="font-pixel-lg text-5xl sm:text-6xl md:text-7xl font-bold tracking-widest text-black leading-tight uppercase">
                    Billet L2
                  </h1>
                  <p className="font-pixel-sm text-[9px] mt-3 text-neutral-700 tracking-tight leading-relaxed">
                    DECENTRALIZED EVENT TICKETING ON BASE
                  </p>
                </div>
              </div>

              {/* Retro Window 2: Features List */}
              <div className="bg-white neo-border neo-shadow">
                {/* Title Bar */}
                <div className="bg-[#F3BE22]/30 border-b-[3.5px] border-black px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5722] border-2 border-black" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#4CAF50] border-2 border-black" />
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-black" />
                  </div>
                  <span className="font-pixel-sm text-[9px] uppercase text-black font-bold">INFO_SYSTEM.EXE</span>
                </div>
                {/* Body */}
                <div className="p-6 space-y-6">
                  <h3 className="font-pixel-lg text-3xl font-bold text-black uppercase">
                    E-Learning & Ticketing:
                  </h3>
                  <ul className="space-y-3 font-pixel-sm text-[10px] text-black">
                    <li className="flex items-center gap-2">
                      <span className="text-[#FF5722] text-lg">■</span> - 100% On-Chain Base Sepolia
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#4CAF50] text-lg">■</span> - Price Ceiling Anti-Scalper
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#9C27B0] text-lg">■</span> - Bioskop Bebas Calo / Resale
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 text-lg">■</span> - Instant QR Gatekeeper Verification
                    </li>
                  </ul>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        document.getElementById("events-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-6 py-3 bg-[#FF5722] text-white font-pixel-sm text-[10px] uppercase neo-btn cursor-pointer"
                    >
                      Beli Tiket Sekarang!
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Event Carousel Window (Edward Newgate mockup style) */}
            <div className="lg:col-span-5">
              <div className="bg-white neo-border neo-shadow">
                {/* Title Bar */}
                <div className="bg-[#4CAF50]/20 border-b-[3.5px] border-black px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5722] border-2 border-black" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#4CAF50] border-2 border-black" />
                  </div>
                  <span className="font-pixel-sm text-[9px] uppercase text-black font-bold">BILLET_CAROUSEL.EXE</span>
                </div>
                {/* Body */}
                <div className="p-4">
                  {/* Image/Gradient area resembling photo in reference */}
                  <div className={`h-64 sm:h-72 border-[3.5px] border-black relative overflow-hidden flex flex-col justify-end text-white p-5 ${carouselBanners[carouselIndex].gradient}`}>
                    {/* Retro elements overlay */}
                    <div className="absolute top-3 left-3 bg-black border-2 border-black text-white px-2 py-0.5 font-pixel-sm text-[8px]">
                      {carouselBanners[carouselIndex].badgeText}
                    </div>
                    <div className="absolute top-3 right-3 bg-white border-2 border-black text-black w-8 h-8 flex items-center justify-center font-bold">
                      ★
                    </div>
                    <div className="relative z-10 space-y-2 bg-black/40 p-3 border-2 border-black backdrop-blur-xs">
                      <h4 className="font-pixel-lg text-2xl uppercase font-bold leading-tight line-clamp-1">
                        {carouselBanners[carouselIndex].title}
                      </h4>
                      <p className="font-pixel-sm text-[9px] text-white/90 line-clamp-2 leading-relaxed">
                        {carouselBanners[carouselIndex].desc}
                      </p>
                      <p className="font-pixel-sm text-[8px] text-[#4CAF50]">
                        {carouselBanners[carouselIndex].date} @ {carouselBanners[carouselIndex].venue}
                      </p>
                    </div>
                  </div>

                  {/* Character/Active Tag Badge similar to Edward Newgate */}
                  <div className="mt-4 bg-[#4CAF50] border-[3.5px] border-black p-3 text-center neo-shadow-sm">
                    <span className="font-pixel-sm text-xs text-white uppercase tracking-wider font-bold">
                      ★ HOT DEALS ★
                    </span>
                  </div>

                  {/* Navigation dots */}
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {carouselBanners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={`w-4 h-4 border-2 border-black transition-all cursor-pointer ${
                          idx === carouselIndex ? "bg-[#FF5722] -translate-x-px -translate-y-px shadow-[2px_2px_0_0_rgba(0,0,0,1)]" : "bg-white"
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── Search & Category Selector ───────────────────────────────── */}
        <section id="events-section" className="max-w-7xl mx-auto px-5 sm:px-8 py-8 relative z-30">
          <div className="bg-white neo-border neo-shadow p-6 flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black stroke-[2.5]" />
              <input
                type="text"
                placeholder="Cari event musik, seminar, seni di Base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 border-[3.5px] border-black bg-white focus:bg-yellow-50/20 focus:outline-hidden text-black placeholder:text-neutral-500 font-pixel-sm text-[10px] transition-all"
              />
            </div>

            {/* Quick Category Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {["Semua", "Musik", "Seminar", "Olahraga", "Seni"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4.5 py-2.5 border-[3px] border-black font-pixel-sm text-[10px] uppercase transition-all duration-100 shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] -translate-x-px -translate-y-px"
                      : "bg-white text-black hover:bg-neutral-50 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-x-px hover:-translate-y-px"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Active Event List ─────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
          <div className="bg-white neo-border neo-shadow p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-pixel-lg text-4xl text-black flex items-center gap-3 uppercase font-bold">
                Event Seru Untukmu
                <span className="w-3.5 h-3.5 bg-[#FF5722] border-2 border-black inline-block shrink-0 animate-ping" />
              </h2>
              <p className="font-pixel-sm text-[10px] text-neutral-700 mt-2">
                Beli langsung dari organizer resmi secara 100% on-chain di Base L2.
              </p>
            </div>

            {/* Reset Filter Button */}
            {(selectedCity || selectedCategory !== "Semua" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCity("");
                  setSelectedCategory("Semua");
                  setSearchQuery("");
                }}
                className="px-4 py-2 border-[3px] border-black bg-[#FF5722] text-white font-pixel-sm text-[9px] uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#E64A19] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white neo-border neo-shadow">
              <div className="w-12 h-12 border-4 border-black border-t-[#FF5722] rounded-full animate-spin mb-4" />
              <p className="font-pixel-sm text-xs">Menyelaraskan data tiket dari blockchain...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white neo-border neo-shadow p-6">
              <AlertCircle className="w-12 h-12 text-black mb-4 stroke-[2.5]" />
              <h3 className="font-pixel-lg text-3xl font-bold mb-2 uppercase">
                Event Tidak Ditemukan
              </h3>
              <p className="font-pixel-sm text-[10px] text-neutral-600 max-w-sm">
                Coba sesuaikan kata kunci pencarian Anda, ganti filter kategori, atau klik kota lain.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => {
                const categoryColor = event.category === "Musik" ? "bg-[#9C27B0] text-white" :
                                      event.category === "Seminar" ? "bg-blue-600 text-white" :
                                      event.category === "Olahraga" ? "bg-[#4CAF50] text-white" :
                                      "bg-[#FF5722] text-white";

                return (
                  <div
                    key={event.listingId}
                    onClick={() => handleBuyClick(event)}
                    className="group bg-white neo-border neo-shadow overflow-hidden hover:-translate-y-1 active:translate-y-px transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    {/* Header Image Gradient */}
                    <div className={`h-40 bg-linear-to-br ${event.bannerGradient} relative border-b-[3.5px] border-black overflow-hidden shrink-0`}>
                      {/* Floating Category tag */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center px-2.5 py-1 border-[2.5px] border-black font-pixel-sm text-[8px] uppercase font-bold ${categoryColor}`}>
                          {event.category}
                        </span>
                      </div>

                      {/* Blockchain Verified Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {event.isMock ? (
                          <span className="px-2 py-0.5 border-2 border-black bg-neutral-200 font-pixel-sm text-[8px] text-black uppercase">
                            Demo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 border-2 border-black bg-[#4CAF50] text-white font-pixel-sm text-[8px] uppercase tracking-wider shadow-sm animate-pulse-warm">
                            On-Chain
                          </span>
                        )}
                        {event.isResale && (
                          <span className="px-2 py-0.5 border-2 border-black bg-black text-white font-pixel-sm text-[8px] uppercase">
                            Resale
                          </span>
                        )}
                      </div>

                      {/* City Badge Bottom Left */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white border-2 border-black text-black px-2 py-0.5 font-pixel-sm text-[8px] uppercase">
                        <MapPin className="w-3 h-3 text-[#FF5722] stroke-[2.5]" />
                        {event.city}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Event Title */}
                        <h3 className="font-pixel-lg text-2xl font-bold text-black mb-3.5 leading-tight group-hover:text-[#FF5722] transition-colors uppercase">
                          {event.title}
                        </h3>

                        {/* Location and Date details */}
                        <div className="space-y-2 mb-4 font-pixel-sm text-[9px] text-neutral-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                            <span className="line-clamp-1">{event.venue}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing row */}
                      <div className="pt-4 border-t-[3px] border-black flex items-end justify-between">
                        <div>
                          <p className="font-pixel-sm text-[8px] text-neutral-500 uppercase mb-1">
                            {event.isResale ? "Harga Resale" : "Harga Mulai"}
                          </p>
                          <p className="font-pixel-lg text-2xl font-bold text-black">
                            {formatIDRX(event.pricePerUnit)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-pixel-sm text-[8px] text-black">
                            <strong className="text-[#FF5722]">{event.amount.toString()}</strong> TIKET
                          </span>
                          <div className="w-9 h-9 border-[3px] border-black bg-[#FF5722] text-white flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] group-hover:-translate-x-px group-hover:-translate-y-px group-hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">
                            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── Trending Banner Slider ───────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
          <div className="bg-white neo-border neo-shadow p-8 sm:p-12 relative overflow-hidden">
            <div className="relative max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5722]/15 border-2 border-black text-[#FF5722] font-pixel-sm text-[8px] uppercase tracking-wide">
                <Volume2 className="w-3.5 h-3.5" />
                Anti-Scalper Guarantee
              </span>
              <h2 className="font-pixel-lg text-4xl sm:text-5xl font-black text-black leading-tight uppercase">
                Kesal Dengan Calo? <br />
                Billet Adalah <span className="text-[#FF5722]">Jawabannya!</span>
              </h2>
              <p className="font-pixel-sm text-[10px] text-neutral-800 leading-relaxed">
                Kami menerapkan sistem **Price Ceiling (Batas Harga Maksimum)** otomatis di dalam kontrak pintar ERC-1155. 
                Tiket tidak dapat dijual kembali melebihi batas markup (misal maksimal 1.1x). 
                Pembeli terlindungi, kreator tetap mendapatkan royalti resale otomatis.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-6">
                {[
                  { title: "Price Ceiling", desc: "Batas Markup Otomatis" },
                  { title: "Royalti Kreator", desc: "100% Mengalir Otomatis" },
                  { title: "Verifikasi Base L2", desc: "Tiket NFT ERC-1155 Sah" }
                ].map((stat, i) => (
                  <div key={i} className="flex gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#4CAF50] shrink-0 mt-0.5 stroke-[2.5]" />
                    <div className="font-pixel-sm">
                      <p className="font-bold text-[10px] text-black">{stat.title}</p>
                      <p className="text-neutral-500 text-[8px] mt-0.5">{stat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Billet Cinema Ticket Category ("Billet Bioskop") ─────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
          <div className="bg-white neo-border neo-shadow p-6 mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-pixel-lg text-4xl text-black flex items-center gap-2 uppercase font-bold">
                Billet Bioskop
                <Clapperboard className="w-7 h-7 text-[#FF5722] stroke-2" />
              </h2>
              <p className="font-pixel-sm text-[10px] text-neutral-700 mt-2">
                Tonton film blockbuster favorit Anda dengan sistem tiket digital bebas calo.
              </p>
            </div>
            <Link
              href="/events"
              className="text-[#FF5722] hover:text-[#E64A19] font-pixel-sm text-[10px] uppercase font-bold flex items-center gap-1 group shrink-0"
            >
              Semua
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => {
                  toast.success(`[Simulasi Bioskop] Tiket "${movie.title}" berhasil di-booking!`, {
                    description: "Terima kasih telah menggunakan sistem Billet Cinema.",
                    icon: <Film className="w-5 h-5 text-[#FF5722]" />
                  });
                }}
                className="group bg-white neo-border neo-shadow p-5 hover:-translate-y-1 active:translate-y-px transition-all duration-200 cursor-pointer flex gap-4"
              >
                {/* Poster Placeholder */}
                <div className={`w-24 h-32 border-3 border-black ${movie.imageUrl} shrink-0 relative overflow-hidden flex flex-col justify-between p-3 text-white shadow-md`}>
                  <Film className="w-4 h-4 text-white/50" />
                  <span className="font-pixel-sm text-[7px] font-bold bg-black text-white px-1 py-0.5 text-center">
                    BIOSKOP
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <span className="font-pixel-sm text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                      {movie.genre}
                    </span>
                    <h3 className="font-pixel-lg text-2xl font-bold text-black mt-1 group-hover:text-[#FF5722] transition-colors uppercase">
                      {movie.title}
                    </h3>
                    <p className="font-pixel-sm text-[8px] text-neutral-500 mt-1">Durasi: {movie.duration}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-amber-100 border-2 border-black text-black px-2 py-0.5 font-pixel-sm text-[8px] font-bold">
                      ★ {movie.rating}
                    </div>
                    <p className="font-pixel-lg text-xl font-bold text-black">
                      Rp {movie.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Explore by City ("Jelajahi Event di Kotamu") ─────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
          <div className="bg-white neo-border neo-shadow p-6 mb-8">
            <h2 className="font-pixel-lg text-4xl text-black flex items-center gap-2 uppercase font-bold">
              Jelajahi Event di Kotamu
            </h2>
            <p className="font-pixel-sm text-[10px] text-neutral-700 mt-2">
              Temukan keseruan langsung di kota Anda dengan cepat dan praktis.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {cities.map((city) => {
              const isSelected = selectedCity === city.name;
              return (
                <div
                  key={city.name}
                  onClick={() => {
                    if (isSelected) setSelectedCity(""); // toggle off
                    else {
                      setSelectedCity(city.name);
                      document.getElementById("events-section")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`group p-6 text-center cursor-pointer transition-all duration-200 border-[3.5px] border-black ${
                    isSelected
                      ? "bg-[#FF5722] text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-x-px -translate-y-px"
                      : `bg-white text-black hover:border-[#FF5722] hover:-translate-y-0.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]`
                  }`}
                >
                  <div className="text-4xl mb-3 transition-transform group-hover:scale-110">
                    {city.icon}
                  </div>
                  <h3 className={`font-pixel-lg text-2xl font-bold uppercase ${isSelected ? "text-white" : "text-black"}`}>
                    {city.name}
                  </h3>
                  <p className={`font-pixel-sm text-[8px] mt-1 ${isSelected ? "text-white/80" : "text-neutral-500"}`}>
                    {city.count}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />

      {/* Buy Dialog */}
      {selectedListing && (
        <BuyTicketDialog
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSuccess={handleBuySuccess}
        />
      )}
    </div>
  );
}
