import { formatUnits } from "viem";

/**
 * Format IDRX amount from wei (18 decimals) to human-readable Rp string.
 * Example: 50000000000000000000000n → "Rp 50.000" (if using 18 decimals)
 */
export function formatIDRX(weiAmount: bigint): string {
  const raw = formatUnits(weiAmount, 18);
  const num = parseFloat(raw);
  return `Rp ${num.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

/**
 * Format IDRX amount from wei to a shorter numeric string (no currency prefix).
 */
export function formatIDRXShort(weiAmount: bigint): string {
  const raw = formatUnits(weiAmount, 18);
  const num = parseFloat(raw);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}jt`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}rb`;
  return num.toLocaleString("id-ID");
}

/**
 * Truncate Ethereum address to 0x1234...5678 format.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get category display name from tokenId.
 */
export function getCategoryName(tokenId: number | bigint): string {
  const id = Number(tokenId);
  switch (id) {
    case 1: return "Reguler";
    case 2: return "VIP";
    case 3: return "VVIP";
    default: return `Kategori #${id}`;
  }
}

/**
 * Get category gradient class based on tokenId for visual differentiation.
 */
export function getCategoryGradient(tokenId: number | bigint): string {
  const id = Number(tokenId);
  switch (id) {
    case 1: return "from-amber-200 to-orange-300";      // Reguler — warm peach
    case 2: return "from-orange-300 to-rose-400";        // VIP — vibrant coral
    case 3: return "from-amber-300 via-yellow-400 to-orange-400"; // VVIP — gold
    default: return "from-stone-300 to-stone-400";
  }
}

/**
 * Get a CSS color for category badges.
 */
export function getCategoryColor(tokenId: number | bigint): string {
  const id = Number(tokenId);
  switch (id) {
    case 1: return "#FF8A50"; // Reguler
    case 2: return "#E85A2A"; // VIP
    case 3: return "#C44A22"; // VVIP
    default: return "#8A8078";
  }
}
