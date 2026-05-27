"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectKitButton } from "connectkit";
import { Ticket, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isCreatorMode = pathname.startsWith("/creator");

  // Track scroll for subtle background change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = isCreatorMode
    ? [
        { href: "/creator", label: "Portal Creator" },
        { href: "/", label: "Halaman Pembeli" },
      ]
    : [
        { href: "/", label: "Beranda" },
        { href: "/events", label: "Event" },
        { href: "/my-tickets", label: "Tiket Saya" },
      ];

  return (
    <nav
      id="main-navbar"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-strong shadow-card border-b border-white/20"
          : "bg-cream/80 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="section-container">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* ─── Logo ─────────────────────────────────────────── */}
          <Link
            href={isCreatorMode ? "/creator" : "/"}
            className="flex items-center gap-2.5 group shrink-0"
            id="navbar-logo"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-warm-500 to-warm-700 flex items-center justify-center shadow-warm transition-transform group-hover:scale-105">
              <Ticket className="w-5 h-5 text-white -rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl tracking-tight text-bark leading-none">
                Billet
              </span>
              {isCreatorMode && (
                <span className="text-[9px] font-extrabold text-warm-600 tracking-wider uppercase mt-0.5">
                  Creator
                </span>
              )}
            </div>
          </Link>

          {/* ─── Desktop Navigation ───────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "text-bark font-semibold"
                      : "text-stone hover:text-bark"
                    }
                  `}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-warm-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ─── Right Side ───────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {/* Role Switcher */}
            <div className="hidden sm:flex p-0.5 rounded-xl bg-sand/70 border border-bark/5 items-center gap-0.5">
              <Link
                href="/"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-heading transition-all duration-200 ${
                  !isCreatorMode
                    ? "bg-bark text-white shadow-sm"
                    : "text-stone hover:text-bark"
                }`}
                id="switcher-buyer"
              >
                Pembeli
              </Link>
              <Link
                href="/creator"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-heading transition-all duration-200 ${
                  isCreatorMode
                    ? "bg-warm-500 text-white shadow-warm"
                    : "text-stone hover:text-bark"
                }`}
                id="switcher-creator"
              >
                Kreator
              </Link>
            </div>

            <div className="hidden sm:block">
              <ConnectKitButton />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-warm-50/60 text-stone transition-colors"
              id="mobile-menu-toggle"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Navigation ─────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden pb-5 pt-3 border-t border-bark/5 animate-slide-up space-y-4">
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${isActive
                        ? "bg-warm-500/10 text-warm-700 font-semibold"
                        : "text-stone hover:text-bark hover:bg-warm-50/60"
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Switcher */}
            <div className="px-4 pt-3 border-t border-bark/5 space-y-2">
              <p className="text-[10px] text-stone/50 font-semibold font-heading uppercase tracking-wider">Mode</p>
              <div className="flex p-0.5 rounded-xl bg-sand/70 border border-bark/5 items-center gap-0.5">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold font-heading transition-all duration-200 ${
                    !isCreatorMode
                      ? "bg-bark text-white shadow-sm"
                      : "text-stone hover:text-bark"
                  }`}
                >
                  Pembeli
                </Link>
                <Link
                  href="/creator"
                  onClick={() => setMobileOpen(false)}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold font-heading transition-all duration-200 ${
                    isCreatorMode
                      ? "bg-warm-500 text-white shadow-warm"
                      : "text-stone hover:text-bark"
                  }`}
                >
                  Kreator
                </Link>
              </div>
            </div>

            <div className="pt-2 px-4 sm:hidden">
              <ConnectKitButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
