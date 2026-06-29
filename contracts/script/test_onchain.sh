#!/bin/bash
set -e

source "$(dirname "$0")/../.env"

MARKETPLACE="0xa8e40f45053d84848c9b24a4175b15d84eeb541e"
NFT="0xb73c817eb4d4b6ba23a8f7a2032c6403b47b5870"
IDRX="0x9c0ee132da6599949ce59e5f3ea2c20d2e238f73"
RPC="${BASE_SEPOLIA_URL}"

ADDR1=$(cast wallet address --private-key $USER1_PK)
ADDR2=$(cast wallet address --private-key $USER2_PK)
ADDR3=$(cast wallet address --private-key $USER3_PK)
ORG_ADDR=$(cast wallet address --private-key $ORGANIZER_PK)
GATE_ADDR=$(cast wallet address --private-key $GATEKEEPER_PK)

echo "Addresses:"
echo "ORG: $ORG_ADDR"
echo "GATE: $GATE_ADDR"
echo "USER1: $ADDR1"
echo "USER2: $ADDR2"
echo "USER3: $ADDR3"
echo "---------------------------------"

echo "1. Funding ETH to Users..."
# Send 0.005 ETH to each user
cast send $ADDR1 --value 0.005ether --private-key $ORGANIZER_PK --rpc-url $RPC
cast send $ADDR2 --value 0.005ether --private-key $ORGANIZER_PK --rpc-url $RPC
cast send $ADDR3 --value 0.005ether --private-key $ORGANIZER_PK --rpc-url $RPC
echo "Funding complete."
echo "---------------------------------"

echo "2. Setting up GateKeeper..."
cast send $NFT "setGateKeeper(address,bool)" $GATE_ADDR true --private-key $ORGANIZER_PK --rpc-url $RPC
echo "GateKeeper configured."
echo "---------------------------------"

echo "3. Configuring Ticket Category (Token 1)..."
# configureTicketCategory(uint256 tokenId, uint256 supply, uint256 price, uint256 ceilingBps, uint96 royaltyBps, uint256 start, uint256 end)
# Price: 1000 IDRX (1000 * 10^18), Ceiling: 11000 (110%), Royalty: 500 (5%), Start: 0, End: 0
cast send $NFT "configureTicketCategory(uint256,uint256,uint256,uint256,uint96,uint256,uint256)" 1 100 1000000000000000000000 11000 500 0 0 --private-key $ORGANIZER_PK --rpc-url $RPC
echo "Category configured."
echo "---------------------------------"

echo "4. Minting 10 Tickets to Marketplace..."
cast send $NFT "mintToMarketplace(uint256,uint256)" 1 10 --private-key $ORGANIZER_PK --rpc-url $RPC
echo "Minting complete."
echo "---------------------------------"

echo "5. Organizer listing tickets on Primary Market..."
# listPrimary(uint256 tokenId, uint256 amount, uint256 pricePerUnit)
cast send $MARKETPLACE "listPrimary(uint256,uint256,uint256)" 1 10 1000000000000000000000 --private-key $ORGANIZER_PK --rpc-url $RPC
echo "Primary listing complete."
echo "---------------------------------"

# Since _nextListingId increments, we will just use a script to figure out the listing id or assume the last listed one is what we want.
# We'll just search for Listing events to find the Listing ID, or we can use Node.js to be precise. 
# But let's pause here.
