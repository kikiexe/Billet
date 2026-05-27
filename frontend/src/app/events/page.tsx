"use client";

import { useState } from "react";
import { Loader2, Ticket, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EventCard } from "@/components/events/EventCard";
import { BuyTicketDialog } from "@/components/events/BuyTicketDialog";
import { useListings, type ListingWithId } from "@/hooks/useListings";

type FilterTab = "all" | "primary" | "resale";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "primary", label: "Primary" },
  { id: "resale", label: "Resale" },
];

export default function EventsPage() {
  const { activeListings, primaryListings, resaleListings, isLoading, refetch } =
    useListings();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedListing, setSelectedListing] = useState<ListingWithId | null>(null);

  const displayedListings =
    filter === "primary"
      ? primaryListings
      : filter === "resale"
        ? resaleListings
        : activeListings;

  const handleBuySuccess = () => {
    refetch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1">
        {/* ─── Page Header ──────────────────────────────────── */}
        <section className="relative overflow-hidden" id="events-header">
          {/* Subtle background orb */}
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #FFB07A 0%, transparent 60%)",
            }}
          />

          <div className="section-container pt-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              <div>
                <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-bark mb-1.5">
                  Jelajahi Event
                </h1>
                <p className="text-stone text-sm max-w-md leading-relaxed">
                  Temukan tiket acara yang tersedia langsung dari organizer
                  atau penjual resale terverifikasi di Base L2.
                </p>
              </div>

              {/* Stats badge */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 border border-bark/6 text-sm shrink-0 shadow-card">
                <Ticket className="w-4 h-4 text-warm-500" />
                <span className="text-bark font-medium">
                  {activeListings.length} listing aktif
                </span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 mt-7">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                    ${filter === tab.id
                      ? "bg-bark text-white shadow-sm"
                      : "text-stone hover:text-bark hover:bg-sand/60"
                    }
                  `}
                  id={`filter-${tab.id}`}
                >
                  {tab.label}
                  {tab.id === "all" && activeListings.length > 0 && (
                    <span className="ml-1.5 text-xs opacity-50">
                      ({activeListings.length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Listings Grid ────────────────────────────────── */}
        <section className="section-container pb-20" id="events-grid">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-warm-500 animate-spin mb-4" />
              <p className="text-stone text-sm">Memuat listing dari blockchain...</p>
            </div>
          ) : displayedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sand/50 flex items-center justify-center mb-5">
                <Search className="w-6 h-6 text-stone/30" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-bark mb-1.5">
                Belum Ada Listing
              </h3>
              <p className="text-stone text-sm max-w-xs leading-relaxed">
                {filter !== "all"
                  ? `Tidak ada listing ${filter} yang aktif saat ini. Coba filter lain.`
                  : "Belum ada tiket yang tersedia. Cek kembali nanti!"}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedListings.map((listing) => (
                <EventCard
                  key={listing.listingId}
                  listing={listing}
                  onBuy={setSelectedListing}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Buy Dialog */}
      {selectedListing && (
        <BuyTicketDialog
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSuccess={handleBuySuccess}
        />
      )}

      <Footer />
    </div>
  );
}
