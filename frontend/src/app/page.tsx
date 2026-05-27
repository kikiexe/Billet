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
    gradient: "from-[#FF6B35] via-[#E85A2A] to-[#1A1612]",
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
    gradient: "from-[#2563EB] via-[#FF8A50] to-[#0F0D0B]",
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
    gradient: "from-[#10B981] via-[#3B82F6] to-[#1A1612]",
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
    pricePerUnit: 35000000000000000000000n, // Rp 350.000
    originalPrice: 35000000000000000000000n,
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
    pricePerUnit: 15000000000000000000000n, // Rp 150.000
    originalPrice: 15000000000000000000000n,
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
    pricePerUnit: 20000000000000000000000n, // Rp 200.000
    originalPrice: 20000000000000000000000n,
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
    pricePerUnit: 18000000000000000000000n, // Rp 180.000
    originalPrice: 18000000000000000000000n,
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
    pricePerUnit: 45000000000000000000000n, // Rp 450.000
    originalPrice: 40000000000000000000000n, // Original Rp 400.000
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
    pricePerUnit: 8000000000000000000000n, // Rp 80.000
    originalPrice: 8000000000000000000000n,
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
    pricePerUnit: 5000000000000000000000n, // Rp 50.000
    originalPrice: 5000000000000000000000n,
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

  // ─── Carousel Auto-Play ─────────────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // ─── Load Simulated Sandbox Events ──────────────────────────────────────

  useEffect(() => {
    try {
      const rawSimulated = localStorage.getItem("billet_simulated_events");
      if (rawSimulated) {
        const parsed = JSON.parse(rawSimulated);
        const formatted: RichEvent[] = parsed.map((item: any) => ({
          ...item,
          tokenId: BigInt(item.tokenId),
          amount: BigInt(item.amount),
          pricePerUnit: BigInt(item.pricePerUnit),
          originalPrice: BigInt(item.originalPrice)
        }));
        setCustomEvents(formatted);
      }
    } catch (e) {
      console.error("Error reading simulated sandbox events:", e);
    }
  }, []);

  // ─── Merge On-Chain Listings & Mock Events ──────────────────────────────

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

    return [...chainEvents, ...customEvents, ...mockEvents];
  }, [activeListings, customEvents]);

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
    <div className="min-h-screen flex flex-col bg-cream relative">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* ─── Carousel Hero Banner ──────────────────────────────────────── */}
        <section className="relative overflow-hidden w-full h-95 sm:h-105 md:h-115 bg-bark text-white">
          {carouselBanners.map((banner, i) => {
            const isActive = i === carouselIndex;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 w-full h-full flex flex-col justify-end transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-0 scale-105 pointer-events-none z-0"
                }`}
              >
                {/* Visual Background Pattern */}
                <div
                  className={`absolute inset-0 bg-linear-to-r ${banner.gradient} opacity-90`}
                />
                <div className="absolute inset-0 bg-black/40" />

                {/* Aesthetic shapes for Wow factor */}
                <div className="absolute -top-12 right-1/4 w-87.5 h-87.5 rounded-full bg-warm-500/10 blur-[90px] animate-pulse-warm" />
                <div className="absolute top-12 -right-12 w-62.5 h-62.5 rounded-full bg-orange-400/20 blur-[60px]" />

                {/* Banner Content */}
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-12 sm:pb-16 w-full relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-warm-200 mb-4 border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-warm-400" />
                      {banner.badgeText}
                    </span>
                    <p className="text-sm font-heading font-semibold text-warm-400 tracking-wide mb-1 uppercase">
                      {banner.tagline}
                    </p>
                    <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-4">
                      {banner.title}
                    </h1>
                    <p className="text-white/80 text-sm sm:text-base max-w-lg mb-4 line-clamp-2">
                      {banner.desc}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-white/60">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-warm-400" />
                        {banner.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-warm-400" />
                        {banner.venue}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <Link
                      href="/events"
                      className="group px-6 py-3 rounded-2xl bg-linear-to-r from-warm-500 to-warm-600 text-white font-heading font-bold text-sm shadow-warm-lg hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
                    >
                      Beli Tiket
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Navigation Controls */}
          <div className="absolute bottom-6 right-8 z-30 flex items-center gap-2">
            {carouselBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === carouselIndex ? "w-6 bg-warm-500" : "w-2 bg-white/40"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ─── Search & Category Selector ───────────────────────────────── */}
        <section className="relative z-30 -mt-8 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="rounded-3xl glass-strong p-5 shadow-warm-lg flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone/50" />
              <input
                type="text"
                placeholder="Cari konser musik, webinar, olahraga di Billet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-bark/10 bg-cream/30 focus:bg-white focus:border-warm-500 focus:outline-hidden text-bark placeholder:text-stone/40 text-sm font-medium transition-all"
              />
            </div>

            {/* Quick Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {["Semua", "Musik", "Seminar", "Olahraga", "Seni"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-heading transition-all duration-200 shrink-0 ${
                    selectedCategory === cat
                      ? "bg-bark text-white shadow-xs"
                      : "glass text-stone hover:text-bark hover:bg-white/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Active Event List ("Event Seru Untukmu") ─────────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark flex items-center gap-2">
                Event Seru Untukmu
                <span className="w-2.5 h-2.5 rounded-full bg-warm-500 animate-ping shrink-0" />
              </h2>
              <p className="text-stone text-sm sm:text-base mt-1">
                Beli langsung dari organizer atau penjual resale resmi terverifikasi Base L2.
              </p>
            </div>

            {/* Filter Reset Badge */}
            {(selectedCity || selectedCategory !== "Semua" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCity("");
                  setSelectedCategory("Semua");
                  setSearchQuery("");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-warm-100 text-warm-700 text-xs font-semibold hover:bg-warm-200 transition-colors border border-warm-200"
              >
                Reset Filter
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-3xl border border-bark/5">
              <div className="w-10 h-10 border-4 border-warm-200 border-t-warm-500 rounded-full animate-spin mb-4" />
              <p className="text-stone text-sm">Menyelaraskan data tiket dari blockchain...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/40 rounded-3xl border border-bark/5 p-6">
              <AlertCircle className="w-12 h-12 text-stone/40 mb-4" />
              <h3 className="font-heading font-semibold text-lg text-bark mb-1">
                Event Tidak Ditemukan
              </h3>
              <p className="text-stone text-sm max-w-sm">
                Coba sesuaikan kata kunci pencarian Anda, ganti filter kategori, atau klik kota lain.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const categoryColor = event.category === "Musik" ? "bg-purple-100 text-purple-700" :
                                      event.category === "Seminar" ? "bg-blue-100 text-blue-700" :
                                      event.category === "Olahraga" ? "bg-green-100 text-green-700" :
                                      "bg-orange-100 text-orange-700";

                return (
                  <div
                    key={event.listingId}
                    onClick={() => handleBuyClick(event)}
                    className="group relative rounded-3xl glass overflow-hidden hover:shadow-warm-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    {/* Header Image Gradient */}
                    <div className={`h-36 bg-linear-to-br ${event.bannerGradient} relative overflow-hidden shrink-0`}>
                      {/* Grid overlays */}
                      <div className="absolute inset-0 bg-black/10 opacity-30" />
                      <div className="absolute inset-0 bg-radial-at-t from-white/20 to-transparent" />

                      {/* Floating Category tag */}
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${categoryColor}`}>
                          {event.category}
                        </span>
                      </div>

                      {/* Blockchain Verified Badge */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        {event.isMock ? (
                          <span className="px-2.5 py-1 rounded-full bg-bark/40 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                            Demo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm animate-pulse-warm">
                            On-Chain
                          </span>
                        )}
                        {event.isResale && (
                          <span className="px-2.5 py-1 rounded-full bg-bark/85 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                            Resale
                          </span>
                        )}
                      </div>

                      {/* City Badge Bottom Left */}
                      <div className="absolute bottom-3 left-4 flex items-center gap-1 text-white/95 text-xs font-semibold drop-shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-warm-400" />
                        {event.city}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Event Title */}
                        <h3 className="font-heading font-extrabold text-lg text-bark mb-1.5 leading-tight group-hover:text-warm-600 transition-colors">
                          {event.title}
                        </h3>

                        {/* Location and Date details */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center gap-2 text-stone text-xs">
                            <Calendar className="w-3.5 h-3.5 text-stone/50" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone text-xs">
                            <MapPin className="w-3.5 h-3.5 text-stone/50" />
                            <span className="line-clamp-1">{event.venue}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing row */}
                      <div className="pt-4 border-t border-bark/5 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-stone/60 font-medium uppercase tracking-wider mb-0.5">
                            {event.isResale ? "Harga Resale" : "Harga Mulai"}
                          </p>
                          <p className="font-heading font-extrabold text-xl text-bark">
                            {formatIDRX(event.pricePerUnit)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-stone font-medium">
                            <strong className="text-bark">{event.amount.toString()}</strong> tiket
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-warm-500 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                            <ArrowRight className="w-4 h-4" />
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
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-20">
          <div className="rounded-3xl bg-linear-to-br from-bark-light to-bark p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Design decorations */}
            <div className="absolute top-0 right-0 w-100 h-100 rounded-full bg-warm-500/10 blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-radial-gradient opacity-10" />

            <div className="relative max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-500/20 text-warm-300 text-xs font-bold border border-warm-500/20 uppercase tracking-wide">
                <Volume2 className="w-3.5 h-3.5" />
                Anti-Scalper Guarantee
              </span>
              <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
                Kesal Dengan Calo? <br />
                Billet Adalah <span className="text-gradient-warm">Jawabannya!</span>
              </h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
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
                    <CheckCircle2 className="w-5 h-5 text-warm-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs sm:text-sm">{stat.title}</p>
                      <p className="text-white/50 text-[11px] sm:text-xs">{stat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Billet Cinema Ticket Category ("Billet Bioskop") ─────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark flex items-center gap-2">
                Billet Bioskop
                <Clapperboard className="w-6 h-6 text-warm-500" />
              </h2>
              <p className="text-stone text-sm sm:text-base mt-1">
                Tonton film blockbuster favorit Anda dengan sistem tiket digital bebas calo.
              </p>
            </div>
            <Link
              href="/events"
              className="text-warm-600 hover:text-warm-700 font-semibold text-sm flex items-center gap-1 group shrink-0"
            >
              Lihat Semua
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => {
                  toast.success(`[Simulasi Bioskop] Tiket "${movie.title}" berhasil di-booking!`, {
                    description: "Terima kasih telah menggunakan sistem Billet Cinema.",
                    icon: <Film className="w-5 h-5 text-warm-500" />
                  });
                }}
                className="group relative rounded-3xl glass p-5 hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex gap-4"
              >
                {/* Poster Placeholder */}
                <div className={`w-24 h-32 rounded-2xl ${movie.imageUrl} shrink-0 relative overflow-hidden flex flex-col justify-between p-3 text-white shadow-md`}>
                  <Film className="w-4 h-4 text-white/50" />
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-center">
                    BIOSKOP
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <span className="text-[10px] font-bold text-stone/50 uppercase tracking-widest">
                      {movie.genre}
                    </span>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-bark mt-0.5 group-hover:text-warm-600 transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-stone text-xs mt-1">Durasi: {movie.duration}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {movie.rating}
                    </div>
                    <p className="font-heading font-extrabold text-sm sm:text-base text-bark">
                      Rp {movie.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Explore by City ("Jelajahi Event di Kotamu") ─────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-20">
          <div className="mb-8">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-bark flex items-center gap-2">
              Jelajahi Event di Kotamu
            </h2>
            <p className="text-stone text-sm sm:text-base mt-1">
              Temukan keseruan langsung di kota Anda dengan cepat dan praktis.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cities.map((city) => {
              const isSelected = selectedCity === city.name;
              return (
                <div
                  key={city.name}
                  onClick={() => {
                    if (isSelected) setSelectedCity(""); // toggle off
                    else {
                      setSelectedCity(city.name);
                      // Scroll event grid into view
                      document.getElementById("events-header")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`group rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 border ${
                    isSelected
                      ? "bg-warm-500 text-white border-warm-600 scale-[1.02] shadow-warm"
                      : `bg-linear-to-br ${city.color} border-bark/5 hover:border-warm-500/20 hover:scale-[1.01] hover:shadow-xs`
                  }`}
                >
                  <div className="text-3xl sm:text-4xl mb-3 transition-transform group-hover:scale-110">
                    {city.icon}
                  </div>
                  <h3 className={`font-heading font-bold text-base sm:text-lg ${isSelected ? "text-white" : "text-bark"}`}>
                    {city.name}
                  </h3>
                  <p className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-stone/60"}`}>
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
