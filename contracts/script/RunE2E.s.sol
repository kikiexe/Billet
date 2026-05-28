// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {TicketNFT} from "../src/TicketNFT.sol";
import {TicketMarketplace} from "../src/TicketMarketplace.sol";
import {ITicketMarketplace} from "../src/interfaces/ITicketMarketplace.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "forge-std/console.sol";

contract RunE2E is Script {
    function run() external {
        address marketplaceAddr = 0xEa8298EE1f7540968a321465c72416b4cCfea676;
        address nftAddr = 0xbDC238BaADB30716005f3FEb2E054629ddECfdF0;
        address idrxAddr = 0xA5dE16D398f0FF54D1fCfB8eFA9c2cC24f5496ac;

        uint256 organizerPk = vm.envUint("ORGANIZER_PK");
        uint256 user1Pk = vm.envUint("USER1_PK");
        uint256 user2Pk = vm.envUint("USER2_PK");
        uint256 user3Pk = vm.envUint("USER3_PK");
        uint256 gatekeeperPk = vm.envUint("GATEKEEPER_PK");

        address organizer = vm.addr(organizerPk);
        address user1 = vm.addr(user1Pk);
        address user2 = vm.addr(user2Pk);
        address user3 = vm.addr(user3Pk);
        address gatekeeper = vm.addr(gatekeeperPk);

        TicketNFT nft = TicketNFT(nftAddr);
        TicketMarketplace marketplace = TicketMarketplace(marketplaceAddr);
        IERC20 idrx = IERC20(idrxAddr);

        uint256 primaryPrice = 1000 * 10**18;
        uint256 resalePrice1 = 1050 * 10**18;
        uint256 resalePrice2 = 1100 * 10**18;

        // 1. Organizer Setup & Primary Listing
        vm.startBroadcast(organizerPk);
        (bool s1, ) = user1.call{value: 0.005 ether}(""); require(s1);
        (bool s2, ) = user2.call{value: 0.005 ether}(""); require(s2);
        (bool s3, ) = user3.call{value: 0.005 ether}(""); require(s3);
        
        nft.setGateKeeper(gatekeeper, true);
        nft.configureTicketCategory(1, 100, primaryPrice, 11000, 500, 0, 0);
        nft.mintToMarketplace(1, 10);
        marketplace.listPrimary(1, 10, primaryPrice);
        vm.stopBroadcast();

        // Cari listing ID untuk primary sale (cari yang baru dibuat)
        uint256 primaryListingId = findLatestListing(marketplace, organizer);
        console.log("Primary Listing ID found:", primaryListingId);

        // 2. User 1 Beli dari Primary
        vm.startBroadcast(user1Pk);
        idrx.approve(marketplaceAddr, primaryPrice);
        string[] memory niks = new string[](1);
        niks[0] = "3271110001";
        string[] memory names = new string[](1);
        names[0] = "Alice";
        marketplace.buyTicket(primaryListingId, 1, niks, names);
        
        // User 1 List ke Secondary
        nft.setApprovalForAll(marketplaceAddr, true);
        marketplace.listResale(1, 1, resalePrice1);
        vm.stopBroadcast();

        uint256 resale1ListingId = findLatestListing(marketplace, user1);
        console.log("Resale 1 Listing ID found:", resale1ListingId);

        // 3. User 2 Beli dari User 1 (Secondary)
        vm.startBroadcast(user2Pk);
        idrx.approve(marketplaceAddr, resalePrice1);
        string[] memory niks2 = new string[](1);
        niks2[0] = "3271110002";
        string[] memory names2 = new string[](1);
        names2[0] = "Bob";
        marketplace.buyTicket(resale1ListingId, 1, niks2, names2);
        
        // User 2 List ke Secondary
        nft.setApprovalForAll(marketplaceAddr, true);
        marketplace.listResale(1, 1, resalePrice2);
        vm.stopBroadcast();

        uint256 resale2ListingId = findLatestListing(marketplace, user2);
        console.log("Resale 2 Listing ID found:", resale2ListingId);

        // 4. User 3 Beli dari User 2 (Secondary)
        vm.startBroadcast(user3Pk);
        idrx.approve(marketplaceAddr, resalePrice2);
        string[] memory niks3 = new string[](1);
        niks3[0] = "3271110003";
        string[] memory names3 = new string[](1);
        names3[0] = "Carol";
        marketplace.buyTicket(resale2ListingId, 1, niks3, names3);
        vm.stopBroadcast();

        // 5. Gatekeeper Check-in Tiket User 3
        vm.startBroadcast(gatekeeperPk);
        // User 3 hanya beli 1 tiket, jadi indexnya 0
        nft.checkInFromGate(user3, 1, 0);
        vm.stopBroadcast();

        console.log("E2E Test Completed Successfully!");
    }

    function findLatestListing(TicketMarketplace marketplace, address seller) internal view returns (uint256) {
        uint256 latestId = type(uint256).max;
        for (uint256 i = 0; i < 1000; i++) {
            try marketplace.getListing(i) returns (ITicketMarketplace.Listing memory listing) {
                if (listing.seller == seller && listing.active) {
                    latestId = i;
                }
            } catch {
                break;
            }
        }
        require(latestId != type(uint256).max, "Listing not found");
        return latestId;
    }
}
