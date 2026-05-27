import { useReadContracts } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/config/contracts";
import type { Abi } from "viem";

export interface Listing {
  seller: `0x${string}`;
  tokenId: bigint;
  amount: bigint;
  pricePerUnit: bigint;
  originalPrice: bigint;
  active: boolean;
  isResale: boolean;
}

export interface ListingWithId extends Listing {
  listingId: number;
}

/**
 * Fetches all listings from the TicketMarketplace smart contract.
 * Iterates through listing IDs 0..maxId and filters for active ones.
 */
export function useListings(maxId = 20) {
  // Create contract calls for IDs 0 through maxId
  const contracts = Array.from({ length: maxId }, (_, i) => ({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI as Abi,
    functionName: "getListing" as const,
    args: [BigInt(i)] as const,
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      refetchInterval: 15_000, // refresh every 15s
    },
  });

  // Parse results and filter active listings
  const listings: ListingWithId[] = [];

  if (data) {
    for (let i = 0; i < data.length; i++) {
      const result = data[i];
      if (result.status === "success" && result.result) {
        const listing = result.result as unknown as Listing;
        // Skip empty/zero listings (seller is zero address)
        if (
          listing.seller !== "0x0000000000000000000000000000000000000000" &&
          listing.amount > BigInt(0)
        ) {
          listings.push({ ...listing, listingId: i });
        }
      }
    }
  }

  const activeListings = listings.filter((l) => l.active);
  const primaryListings = activeListings.filter((l) => !l.isResale);
  const resaleListings = activeListings.filter((l) => l.isResale);

  return {
    allListings: listings,
    activeListings,
    primaryListings,
    resaleListings,
    isLoading,
    error,
    refetch,
  };
}
