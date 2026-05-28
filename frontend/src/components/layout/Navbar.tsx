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
  const isGatekeeperMode = pathname.startsWith("/gatekeeper");

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
    : isGatekeeperMode
    ? [
        { href: "/gatekeeper", label: "Scanner Area" },
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
      className="sticky top-0 z-50 bg-white border-b-[5px] border-black shadow-[0_5px_0_0_rgba(0,0,0,1)]"
    >
      <div className="section-container">
        <div className="h-20 flex items-center justify-between gap-4">
          {/* ─── Logo ─────────────────────────────────────────── */}
          <Link
            href={isCreatorMode ? "/creator" : "/"}
            className="flex items-center gap-3 group shrink-0"
            id="navbar-logo"
          >
            <div className="w-11 h-11 bg-white border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all group-hover:translate-x-px group-hover:translate-y-px group-hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Ticket className="w-6 h-6 text-black -rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-pixel-lg font-bold text-3xl tracking-wider text-black leading-none uppercase">
                Billet
              </span>
              {isCreatorMode && (
                <span className="font-pixel-sm text-[8px] bg-[#FF5722] text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase mt-1 leading-none tracking-tight">
                  Creator
                </span>
              )}
              {isGatekeeperMode && (
                <span className="font-pixel-sm text-[8px] bg-[#9C27B0] text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase mt-1 leading-none tracking-tight">
                  Gatekeeper
                </span>
              )}
            </div>
          </Link>

          {/* ─── Desktop Navigation ───────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`
                    px-4 py-2 border-[3px] border-black font-pixel-sm text-[11px] uppercase transition-all duration-100
                    ${isActive
                      ? "bg-black text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-x-px -translate-y-px"
                      : "bg-white text-black hover:bg-neutral-100 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                    }
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ─── Right Side ───────────────────────────────────── */}
          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="hidden sm:flex p-1 bg-neutral-100 border-[3px] border-black items-center gap-1 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <Link
                href="/"
                className={`px-3 py-1.5 border-2 border-transparent font-pixel-sm text-[9px] uppercase transition-all duration-100 ${
                  !isCreatorMode && !isGatekeeperMode
                    ? "bg-[#4CAF50] text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    : "text-black hover:border-black/30"
                }`}
                id="switcher-buyer"
              >
                Pembeli
              </Link>
              <Link
                href="/creator"
                className={`px-3 py-1.5 border-2 border-transparent font-pixel-sm text-[9px] uppercase transition-all duration-100 ${
                  isCreatorMode
                    ? "bg-[#FF5722] text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    : "text-black hover:border-black/30"
                }`}
                id="switcher-creator"
              >
                Kreator
              </Link>
              <Link
                href="/gatekeeper"
                className={`px-3 py-1.5 border-2 border-transparent font-pixel-sm text-[9px] uppercase transition-all duration-100 ${
                  isGatekeeperMode
                    ? "bg-[#9C27B0] text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    : "text-black hover:border-black/30"
                }`}
                id="switcher-gatekeeper"
              >
                Panitia
              </Link>
            </div>

            <div className="hidden sm:block neo-border-button">
              <ConnectKitButton />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 border-[3px] border-black bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-black transition-all"
              id="mobile-menu-toggle"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Navigation ─────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden pb-6 pt-4 border-t-[3px] border-black animate-slide-up space-y-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      px-4 py-3 border-[3px] border-black font-pixel-sm text-xs uppercase text-center transition-all
                      ${isActive
                        ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                        : "bg-white text-black hover:bg-neutral-50"
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Switcher */}
            <div className="pt-3 border-t-[3px] border-black space-y-3">
              <p className="text-[10px] text-black font-pixel-sm uppercase tracking-wider pl-1">Mode</p>
              <div className="flex flex-col p-1 bg-neutral-100 border-[3px] border-black gap-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className={`text-center py-2.5 border-2 font-pixel-sm text-[10px] uppercase transition-all duration-100 ${
                    !isCreatorMode && !isGatekeeperMode
                      ? "bg-[#4CAF50] text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      : "text-black hover:border-black/30"
                  }`}
                >
                  Pembeli
                </Link>
                <Link
                  href="/creator"
                  onClick={() => setMobileOpen(false)}
                  className={`text-center py-2.5 border-2 font-pixel-sm text-[10px] uppercase transition-all duration-100 ${
                    isCreatorMode
                      ? "bg-[#FF5722] text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      : "text-black hover:border-black/30"
                  }`}
                >
                  Kreator
                </Link>
                <Link
                  href="/gatekeeper"
                  onClick={() => setMobileOpen(false)}
                  className={`text-center py-2.5 border-2 font-pixel-sm text-[10px] uppercase transition-all duration-100 ${
                    isGatekeeperMode
                      ? "bg-[#9C27B0] text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      : "text-black hover:border-black/30"
                  }`}
                >
                  Panitia
                </Link>
              </div>
            </div>

            <div className="pt-2 sm:hidden flex justify-center">
              <ConnectKitButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
