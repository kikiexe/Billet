"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectKitButton } from "connectkit";
import { Ticket, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCreatorMode = pathname.startsWith("/creator");

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
      className="sticky top-0 z-50 glass-strong border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href={isCreatorMode ? "/creator" : "/"}
            className="flex items-center gap-2.5 group"
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
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

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Desktop Switcher */}
            <div className="hidden sm:flex p-1 rounded-2xl bg-sand/65 border border-bark/5 items-center gap-1 shadow-inner">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-heading transition-all duration-200 ${
                  !isCreatorMode
                    ? "bg-bark text-white shadow-xs"
                    : "text-stone hover:text-bark"
                }`}
                id="switcher-buyer"
              >
                Beli Tiket
              </Link>
              <Link
                href="/creator"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-heading transition-all duration-200 ${
                  isCreatorMode
                    ? "bg-warm-500 text-white shadow-warm"
                    : "text-stone hover:text-bark"
                }`}
                id="switcher-creator"
              >
                Bikin Event
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

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden pb-5 pt-2 border-t border-white/10 animate-fade-in space-y-4">
            <div className="flex flex-col gap-1">
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
            <div className="px-4 py-2 border-t border-bark/5 space-y-3">
              <p className="text-xs text-stone/60 font-medium font-heading">Pilih Tampilan:</p>
              <div className="flex p-1 rounded-2xl bg-sand/65 border border-bark/5 items-center gap-1 shadow-inner">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold font-heading transition-all duration-200 ${
                    !isCreatorMode
                      ? "bg-bark text-white shadow-xs"
                      : "text-stone hover:text-bark"
                  }`}
                >
                  Beli Tiket
                </Link>
                <Link
                  href="/creator"
                  onClick={() => setMobileOpen(false)}
                  className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold font-heading transition-all duration-200 ${
                    isCreatorMode
                      ? "bg-warm-500 text-white shadow-warm"
                      : "text-stone hover:text-bark"
                  }`}
                >
                  Bikin Event
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
