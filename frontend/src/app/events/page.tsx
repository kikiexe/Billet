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
        {/* Page Header */}
        <section className="relative overflow-hidden" id="events-header">
          {/* Subtle background orb */}
          <div
            className="absolute -top-40 -right-40 w-125 h-125 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #FFB07A 0%, transparent 60%)",
            }}
          />

          <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <h1 className="font-heading font-bold text-3xl sm:text-4xl text-bark mb-2">
                  Jelajahi Event
                </h1>
                <p className="text-stone text-base max-w-md">
                  Temukan tiket acara yang tersedia. Beli langsung dari organizer
                  atau dari penjual resale terverifikasi.
                </p>
              </div>

              {/* Stats badge */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass text-sm shrink-0">
                <Ticket className="w-4 h-4 text-warm-500" />
                <span className="text-bark font-medium">
                  {activeListings.length} listing aktif
                </span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mt-8">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`
                    px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${filter === tab.id
                      ? "bg-bark text-white shadow-sm"
                      : "glass text-stone hover:text-bark hover:bg-white/70"
                    }
                  `}
                  id={`filter-${tab.id}`}
                >
                  {tab.label}
                  {tab.id === "all" && activeListings.length > 0 && (
                    <span className="ml-1.5 text-xs opacity-60">
                      ({activeListings.length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20" id="events-grid">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-warm-500 animate-spin mb-4" />
              <p className="text-stone text-sm">Memuat listing dari blockchain...</p>
            </div>
          ) : displayedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sand/60 flex items-center justify-center mb-5">
                <Search className="w-7 h-7 text-stone/40" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-bark mb-2">
                Belum Ada Listing
              </h3>
              <p className="text-stone text-sm max-w-xs">
                {filter !== "all"
                  ? `Tidak ada listing ${filter} yang aktif saat ini. Coba filter lain.`
                  : "Belum ada tiket yang tersedia. Cek kembali nanti!"}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
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
