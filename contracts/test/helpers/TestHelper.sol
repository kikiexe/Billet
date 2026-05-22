// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/TicketNFT.sol";
import "../../src/TicketMarketplace.sol";
import "../../src/mock/MockERC20.sol";

abstract contract TestHelper is Test {
    // ─── Contracts ───────────────────────────────────────────────────────────
    TicketNFT         public nft;
    TicketMarketplace public marketplace;
    MockERC20         public idrx;

    // ─── Actors ──────────────────────────────────────────────────────────────
    address public organizer = makeAddr("organizer");
    address public alice     = makeAddr("alice");    // pembeli primary
    address public bob       = makeAddr("bob");      // pembeli secondary (resaler)
    address public carol     = makeAddr("carol");    // pembeli dari resale

    // ─── Token IDs ───────────────────────────────────────────────────────────
    uint256 public constant TOKEN_REGULER = 1;
    uint256 public constant TOKEN_VIP     = 2;
    uint256 public constant TOKEN_VVIP    = 3;

    // ─── Prices (IDRX decimal = 18) ──────────────────────────────────────────
    uint256 public constant PRICE_REGULER = 100_000 * 10**18; // Rp100.000
    uint256 public constant PRICE_VIP     = 500_000 * 10**18; // Rp500.000

    function setUp() public virtual {
        // Deploy sebagai organizer
        vm.startPrank(organizer);

        idrx        = new MockERC20("Rupiah Digital", "IDRX");
        nft         = new TicketNFT("https://api.test.io/{id}");
        marketplace = new TicketMarketplace(address(nft), address(idrx));

        nft.setAuthorizedMarketplace(address(marketplace));

        // Konfigurasi kategori
        nft.configureTicketCategory(TOKEN_REGULER, 1000, PRICE_REGULER, 11000, 500, 0, 0);
        nft.configureTicketCategory(TOKEN_VIP,     200,  PRICE_VIP,     11000, 500, 0, 0);

        vm.stopPrank();

        // Beri saldo IDRX ke semua actor untuk bertransaksi
        idrx.mint(alice,  10_000_000 * 10**18); // Rp10 Juta
        idrx.mint(bob,    10_000_000 * 10**18);
        idrx.mint(carol,  10_000_000 * 10**18);

        // Approve token IDRX dari actor ke marketplace
        vm.prank(alice);
        idrx.approve(address(marketplace), type(uint256).max);
        vm.prank(bob);
        idrx.approve(address(marketplace), type(uint256).max);
        vm.prank(carol);
        idrx.approve(address(marketplace), type(uint256).max);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /// @dev Shortcut: mint + list primary sejumlah `amount` tiket REGULER.
    function _mintAndListPrimary(uint256 tokenId, uint256 amount, uint256 price)
        internal
        returns (uint256 listingId)
    {
        vm.startPrank(organizer);
        nft.mintToMarketplace(tokenId, amount);
        marketplace.listPrimary(tokenId, amount, price);
        vm.stopPrank();

        // listing ID dimulai dari 0 dan increment, ambil yang terakhir
        listingId = 0; // untuk test sederhana, disesuaikan per kasus
    }

    /// @dev Shortcut: alice beli 1 tiket dari listing ID tertentu.
    function _aliceBuysFrom(uint256 listingId, uint256 amount, uint256 pricePerUnit)
        internal
    {
        string[] memory niks = new string[](amount);
        string[] memory names = new string[](amount);
        for (uint256 i = 0; i < amount; i++) {
            niks[i] = "1234567890123456";
            names[i] = "Alice Holder";
        }
        vm.prank(alice);
        marketplace.buyTicket(listingId, amount, niks, names);
    }

    /// @dev Generic shortcut: beli tiket dari listing ID tertentu oleh actor tertentu.
    function _buy(address actor, uint256 listingId, uint256 amount)
        internal
    {
        string[] memory niks = new string[](amount);
        string[] memory names = new string[](amount);
        for (uint256 i = 0; i < amount; i++) {
            niks[i] = "1234567890123456";
            names[i] = "Mock Holder";
        }
        vm.prank(actor);
        marketplace.buyTicket(listingId, amount, niks, names);
    }
}
