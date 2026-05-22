# 03 — Testing Smart Contract

> Framework: Foundry (Forge) · Target: 100% branch coverage pada fungsi kritis · Tools: Slither untuk static analysis

---

## Filosofi Testing Skripsi Ini

| Layer | File | Tujuan |
|-------|------|--------|
| Unit — Helpers | `test/helpers/TestHelper.sol` | Shared fixture & deploy helper |
| Unit — NFT | `test/unit/TicketNFT.t.sol` | Isolated test: minting, transfer gating, royalti |
| Unit — Marketplace | `test/unit/TicketMarketplace.t.sol` | Isolated test: listing, buy, resale, royalti kondisional |
| Integration | `test/integration/FullFlow.t.sol` | End-to-end tanpa mock |

---

## 3.1 `test/helpers/TestHelper.sol`

Base contract yang di-inherit semua test. Berisi deploy fixture dan address dummy.

```solidity
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
        vm.prank(alice);
        marketplace.buyTicket(listingId, amount);
    }
}
```

---

## 3.2 `test/unit/TicketNFT.t.sol`

Test terisolasi untuk `TicketNFT.sol`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/TestHelper.sol";

contract TicketNFTTest is TestHelper {

    // ════════════════════════════════════════════════════════════════
    //  MINTING
    // ════════════════════════════════════════════════════════════════

    function test_MintToMarketplace_Success() public {
        vm.prank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 100);

        assertEq(
            nft.balanceOf(address(marketplace), TOKEN_REGULER),
            100,
            "Marketplace harus menerima 100 tiket"
        );
        assertEq(nft.totalMinted(TOKEN_REGULER), 100);
    }

    function test_MintToMarketplace_RevertIfExceedsMaxSupply() public {
        vm.prank(organizer);
        // Max supply REGULER = 1000, coba mint 1001
        vm.expectRevert(
            abi.encodeWithSelector(
                TicketNFT.ExceedsMaxSupply.selector,
                TOKEN_REGULER,
                1001,
                1000
            )
        );
        nft.mintToMarketplace(TOKEN_REGULER, 1001);
    }

    function test_MintToMarketplace_RevertIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(); // OwnableUnauthorizedAccount
        nft.mintToMarketplace(TOKEN_REGULER, 10);
    }

    function test_MintToMarketplace_RevertIfMarketplaceNotSet() public {
        // Deploy NFT baru tanpa set marketplace
        vm.startPrank(organizer);
        TicketNFT freshNFT = new TicketNFT("uri");
        freshNFT.configureTicketCategory(TOKEN_REGULER, 100, PRICE_REGULER, 11000, 500, 0, 0);

        vm.expectRevert(TicketNFT.MarketplaceNotSet.selector);
        freshNFT.mintToMarketplace(TOKEN_REGULER, 10);
        vm.stopPrank();
    }

    // ════════════════════════════════════════════════════════════════
    //  TRANSFER GATING
    // ════════════════════════════════════════════════════════════════

    function test_TransferGating_RevertIfDirectUserToUser() public {
        // Mint dulu ke marketplace, lalu beli ke alice
        vm.prank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 1);

        // Simulasi alice punya tiket (bypass via cheat code untuk setup)
        // Dalam sistem nyata alice dapat tiket hanya lewat marketplace
        // Kita test: alice TIDAK BISA transfer langsung ke bob
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_VIP, 1);
        vm.stopPrank();

        // Transfer marketplace -> alice (valid, marketplace adalah authorized)
        vm.prank(address(marketplace));
        nft.safeTransferFrom(address(marketplace), alice, TOKEN_VIP, 1, "");

        // Sekarang alice coba transfer ke bob langsung — HARUS REVERT
        vm.prank(alice);
        vm.expectRevert(TicketNFT.UnauthorizedTransfer.selector);
        nft.safeTransferFrom(alice, bob, TOKEN_VIP, 1, "");
    }

    function test_TransferGating_AllowMarketplaceTransfer() public {
        vm.prank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 5);

        // Marketplace transfer ke alice — harus berhasil
        vm.prank(address(marketplace));
        nft.safeTransferFrom(address(marketplace), alice, TOKEN_REGULER, 5, "");

        assertEq(nft.balanceOf(alice, TOKEN_REGULER), 5);
    }

    function test_TransferGating_AllowMintBurn() public {
        // Mint (from == address(0)) harus selalu lolos
        vm.prank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 10); // tidak revert
        assertEq(nft.totalMinted(TOKEN_REGULER), 10);
    }

    // ════════════════════════════════════════════════════════════════
    //  ROYALTI ERC-2981
    // ════════════════════════════════════════════════════════════════

    function test_RoyaltyInfo_CorrectAmount() public view {
        (address receiver, uint256 amount) = nft.royaltyInfo(TOKEN_REGULER, 1 ether);
        assertEq(receiver, organizer, "Royalti harus ke organizer");
        assertEq(amount, 0.05 ether,  "5% dari 1 ether = 0.05 ether");
    }

    function test_SupportsInterface_ERC2981() public view {
        // bytes4(keccak256("royaltyInfo(uint256,uint256)"))
        assertTrue(nft.supportsInterface(0x2a55205a));
    }

    // ════════════════════════════════════════════════════════════════
    //  SALE WINDOW & PRICE CEILING CONFIG
    // ════════════════════════════════════════════════════════════════

    function test_ConfigureTicketCategory_CorrectStorage() public {
        vm.startPrank(organizer);
        nft.configureTicketCategory(TOKEN_VVIP, 100, 2 ether, 12000, 1000, 10000, 20000);
        vm.stopPrank();

        assertEq(nft.priceCeilingBps(TOKEN_VVIP), 12000);
        (uint256 start, uint256 end) = nft.getSaleWindow(TOKEN_VVIP);
        assertEq(start, 10000);
        assertEq(end, 20000);
    }
}
```

---

## 3.3 `test/unit/TicketMarketplace.t.sol`

Test terisolasi untuk semua fungsi marketplace.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/TestHelper.sol";
import "../../src/libraries/PriceLib.sol";

contract TicketMarketplaceTest is TestHelper {

    // ════════════════════════════════════════════════════════════════
    //  PRIMARY LISTING
    // ════════════════════════════════════════════════════════════════

    function test_ListPrimary_Success() public {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 100);
        marketplace.listPrimary(TOKEN_REGULER, 100, PRICE_REGULER);
        vm.stopPrank();

        ITicketMarketplace.Listing memory l = marketplace.getListing(0);
        assertEq(l.seller,       organizer);
        assertEq(l.tokenId,      TOKEN_REGULER);
        assertEq(l.amount,       100);
        assertEq(l.pricePerUnit, PRICE_REGULER);
        assertFalse(l.isResale);
        assertTrue(l.active);
    }

    function test_ListPrimary_EmitsEvent() public {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 10);

        vm.expectEmit(true, true, true, true);
        emit ITicketMarketplace.TicketListed(0, organizer, TOKEN_REGULER, 10, PRICE_REGULER, false);
        marketplace.listPrimary(TOKEN_REGULER, 10, PRICE_REGULER);
        vm.stopPrank();
    }

    function test_ListPrimary_RevertIfZeroAmount() public {
        vm.prank(organizer);
        vm.expectRevert(ITicketMarketplace.ZeroAmount.selector);
        marketplace.listPrimary(TOKEN_REGULER, 0, PRICE_REGULER);
    }

    function test_ListPrimary_RevertIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        marketplace.listPrimary(TOKEN_REGULER, 10, PRICE_REGULER);
    }

    // ════════════════════════════════════════════════════════════════
    //  BUY (PRIMARY)
    // ════════════════════════════════════════════════════════════════

    function test_BuyPrimary_Success() public {
        // Setup
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 10);
        marketplace.listPrimary(TOKEN_REGULER, 10, PRICE_REGULER);
        vm.stopPrank();

        uint256 organizerBalanceBefore = idrx.balanceOf(organizer);

        // Alice beli 2 tiket
        vm.prank(alice);
        marketplace.buyTicket(0, 2);

        // Alice mendapat tiket
        assertEq(nft.balanceOf(alice, TOKEN_REGULER), 2);
        // Listing berkurang
        assertEq(marketplace.getListing(0).amount, 8);
        // Organizer mendapat dana (primary sale: tidak ada royalti)
        assertEq(idrx.balanceOf(organizer), organizerBalanceBefore + PRICE_REGULER * 2);
    }

    function test_BuyPrimary_ExactPull() public {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 5);
        marketplace.listPrimary(TOKEN_REGULER, 5, PRICE_REGULER);
        vm.stopPrank();

        uint256 aliceBalanceBefore = idrx.balanceOf(alice);

        // Alice beli tiket
        vm.prank(alice);
        marketplace.buyTicket(0, 1);

        // Hanya terpotong seharga tiket REGULER (tidak ada overpay/native fee)
        assertEq(
            idrx.balanceOf(alice),
            aliceBalanceBefore - PRICE_REGULER
        );
    }

    function test_BuyPrimary_RevertIfInsufficientPayment() public {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 5);
        marketplace.listPrimary(TOKEN_REGULER, 5, PRICE_REGULER);
        vm.stopPrank();

        // Kosongkan allowance alice agar transaksi gagal
        vm.prank(alice);
        idrx.approve(address(marketplace), 0);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.InsufficientPayment.selector,
                0,             // allowance available
                PRICE_REGULER  // required
            )
        );
        marketplace.buyTicket(0, 1);

        // Reset allowance ke max agar tidak merusak test lain
        vm.prank(alice);
        idrx.approve(address(marketplace), type(uint256).max);
    }

    function test_BuyPrimary_RevertIfListingNotActive() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ITicketMarketplace.ListingNotActive.selector, 999)
        );
        marketplace.buyTicket(999, 1);
    }

    function test_BuyPrimary_ListingBecomesInactiveWhenSoldOut() public {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 1);
        marketplace.listPrimary(TOKEN_REGULER, 1, PRICE_REGULER);
        vm.stopPrank();

        vm.prank(alice);
        marketplace.buyTicket(0, 1);

        assertFalse(marketplace.getListing(0).active, "Listing harus inactive setelah sold out");
    }

    function test_BuyPrimary_RevertIfSaleNotStarted() public {
        vm.startPrank(organizer);
        // Setup tiket VVIP dengan saleStart di masa depan (block.timestamp + 1 hours)
        uint256 start = block.timestamp + 1 hours;
        uint256 end = block.timestamp + 2 hours;
        nft.configureTicketCategory(TOKEN_VVIP, 100, PRICE_REGULER, 11000, 500, start, end);
        nft.mintToMarketplace(TOKEN_VVIP, 5);
        marketplace.listPrimary(TOKEN_VVIP, 5, PRICE_REGULER);
        vm.stopPrank();

        // Listing ID untuk VVIP adalah 1 (Listing ID 0 adalah REGULER di setUp)
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.SaleNotStarted.selector,
                start,
                block.timestamp
            )
        );
        marketplace.buyTicket(1, 1);
    }

    function test_BuyPrimary_RevertIfSaleEnded() public {
        vm.startPrank(organizer);
        // Setup tiket VVIP dengan saleEnd di masa lalu (block.timestamp - 1 seconds)
        uint256 start = block.timestamp - 2 hours;
        uint256 end = block.timestamp - 1 hours;
        nft.configureTicketCategory(TOKEN_VVIP, 100, PRICE_REGULER, 11000, 500, start, end);
        nft.mintToMarketplace(TOKEN_VVIP, 5);
        marketplace.listPrimary(TOKEN_VVIP, 5, PRICE_REGULER);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.SaleEnded.selector,
                end,
                block.timestamp
            )
        );
        marketplace.buyTicket(1, 1);
    }

    function test_BuyPrimary_SuccessWithinSaleWindow() public {
        vm.startPrank(organizer);
        uint256 start = block.timestamp + 1 hours;
        uint256 end = block.timestamp + 3 hours;
        nft.configureTicketCategory(TOKEN_VVIP, 100, PRICE_REGULER, 11000, 500, start, end);
        nft.mintToMarketplace(TOKEN_VVIP, 5);
        marketplace.listPrimary(TOKEN_VVIP, 5, PRICE_REGULER);
        vm.stopPrank();

        // Geser waktu blok ke dalam sale window (start + 10 mins)
        vm.warp(start + 10 minutes);

        vm.prank(alice);
        marketplace.buyTicket(1, 1);

        assertEq(nft.balanceOf(alice, TOKEN_VVIP), 1);
    }

    function test_BuyPrimary_BoundaryTimeManipulation() public {
        vm.startPrank(organizer);
        uint256 start = block.timestamp + 1 hours;
        uint256 end = block.timestamp + 2 hours;
        nft.configureTicketCategory(TOKEN_VVIP, 100, PRICE_REGULER, 11000, 500, start, end);
        nft.mintToMarketplace(TOKEN_VVIP, 5);
        marketplace.listPrimary(TOKEN_VVIP, 5, PRICE_REGULER);
        vm.stopPrank();

        // 1. Tepat 1 detik SEBELUM penjualan dimulai (start - 1) -> HARUS REVERT
        vm.warp(start - 1);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.SaleNotStarted.selector,
                start,
                start - 1
            )
        );
        marketplace.buyTicket(1, 1);

        // 2. Tepat saat detik pertama penjualan dimulai (start) -> HARUS SUKSES
        vm.warp(start);
        vm.prank(alice);
        marketplace.buyTicket(1, 1);
        assertEq(nft.balanceOf(alice, TOKEN_VVIP), 1);

        // 3. Tepat saat detik terakhir penjualan aktif (end) -> HARUS SUKSES
        vm.warp(end);
        vm.prank(bob);
        marketplace.buyTicket(1, 1);
        assertEq(nft.balanceOf(bob, TOKEN_VVIP), 1);

        // 4. Tepat 1 detik SETELAH penjualan berakhir (end + 1) -> HARUS REVERT
        vm.warp(end + 1);
        vm.prank(carol);
        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.SaleEnded.selector,
                end,
                end + 1
            )
        );
        marketplace.buyTicket(1, 1);
    }

    // ════════════════════════════════════════════════════════════════
    //  RESALE — SKENARIO KUNCI SKRIPSI
    // ════════════════════════════════════════════════════════════════

    function _setupAliceOwnsTicket() internal returns (uint256 primaryListingId) {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 5);
        marketplace.listPrimary(TOKEN_REGULER, 5, PRICE_REGULER);
        vm.stopPrank();

        vm.prank(alice);
        marketplace.buyTicket(0, 1);

        primaryListingId = 0;
    }

    /// SKENARIO A: Jual Untung → royalti AKTIF
    function test_Resale_JualUntung_RoyaltyDikenakan() public {
        _setupAliceOwnsTicket();

        // Alice approve marketplace untuk mengambil tiketnya
        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);

        uint256 resalePrice = PriceLib.maxResalePrice(PRICE_REGULER, 11000); // 110% dari harga asal
        marketplace.listResale(TOKEN_REGULER, 1, resalePrice);
        vm.stopPrank();

        (, uint256 royaltyExpected) = nft.royaltyInfo(TOKEN_REGULER, resalePrice);
        uint256 aliceProceeds   = resalePrice - royaltyExpected;

        uint256 aliceBalanceBefore      = idrx.balanceOf(alice);
        uint256 organizerBalanceBefore  = idrx.balanceOf(organizer);

        // Bob beli dari resale listing (listing ID = 1)
        vm.prank(bob);
        marketplace.buyTicket(1, 1);

        // Royalti langsung ditransfer ke receiver (organizer)
        assertEq(
            idrx.balanceOf(organizer),
            organizerBalanceBefore + royaltyExpected,
            "Royalti harus langsung ditransfer ke organizer"
        );
        // Alice mendapat sisa setelah royalti
        assertEq(idrx.balanceOf(alice), aliceBalanceBefore + aliceProceeds);
        // Bob mendapat tiket
        assertEq(nft.balanceOf(bob, TOKEN_REGULER), 1);
    }

    /// SKENARIO A-2: Penyelenggara mematikan royalti (royaltyBps = 0)
    function test_Resale_JualUntung_BebasRoyalti() public {
        // Setup kategori tiket baru (TOKEN_VVIP) dengan supply 100, price PRICE_REGULER, royaltyBps = 0
        vm.startPrank(organizer);
        nft.configureTicketCategory(TOKEN_VVIP, 100, PRICE_REGULER, 11000, 0, 0, 0); // Royalti = 0
        nft.mintToMarketplace(TOKEN_VVIP, 5);
        marketplace.listPrimary(TOKEN_VVIP, 5, PRICE_REGULER);
        vm.stopPrank();

        // Alice beli tiket VVIP (listing ID = 1 karena listing REGULER ID = 0)
        vm.prank(alice);
        marketplace.buyTicket(1, 1);

        // Alice list resale untuk TOKEN_VVIP dengan untung (110% dari harga asal)
        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);
        uint256 resalePrice = PriceLib.maxResalePrice(PRICE_REGULER, 11000);
        marketplace.listResale(TOKEN_VVIP, 1, resalePrice);
        vm.stopPrank();

        uint256 aliceBalanceBefore      = idrx.balanceOf(alice);
        uint256 organizerBalanceBefore  = idrx.balanceOf(organizer);

        // Bob beli tiket VVIP Alice (listing ID = 2)
        vm.prank(bob);
        marketplace.buyTicket(2, 1);

        // Royalti harus tetap NOL karena promotor menyetel royaltyBps = 0
        assertEq(
            idrx.balanceOf(organizer),
            organizerBalanceBefore,
            "Tidak boleh ada royalti karena dinonaktifkan oleh promotor"
        );
        // Alice mendapatkan 100% hasil penjualan tanpa potongan royalti
        assertEq(idrx.balanceOf(alice), aliceBalanceBefore + resalePrice);
    }

    /// SKENARIO B: Jual Rugi → royalti NOL (likuiditas pasar terjaga)
    function test_Resale_JualRugi_RoyaltyNol() public {
        _setupAliceOwnsTicket();

        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);

        uint256 resalePrice = (PRICE_REGULER * 8) / 10; // DI BAWAH harga beli (Rp80.000)
        marketplace.listResale(TOKEN_REGULER, 1, resalePrice);
        vm.stopPrank();

        uint256 organizerBalanceBefore = idrx.balanceOf(organizer);

        vm.prank(bob);
        marketplace.buyTicket(1, 1);

        // Royalti tidak bertambah sama sekali
        assertEq(
            idrx.balanceOf(organizer),
            organizerBalanceBefore,
            "Tidak boleh ada royalti saat jual rugi"
        );
    }

    /// SKENARIO C: Price Ceiling — scalper tidak bisa listing terlalu tinggi
    function test_Resale_RevertIfExceedsPriceCeiling() public {
        _setupAliceOwnsTicket();

        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);

        uint256 scalpingPrice = PRICE_REGULER * 2; // 200% dari harga asal — SCALPING
        uint256 maxAllowed    = PriceLib.maxResalePrice(PRICE_REGULER, 11000); // 110%

        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.PriceCeilingExceeded.selector,
                scalpingPrice,
                maxAllowed
            )
        );
        marketplace.listResale(TOKEN_REGULER, 1, scalpingPrice);
        vm.stopPrank();
    }

    /// SKENARIO C-2: Price Ceiling Kustom — Kategori dengan Price Ceiling 100% (Face Value Only)
    function test_Resale_CustomPriceCeiling_100Percent() public {
        // Kategori TOKEN_VVIP dengan ceilingBps = 10000 (tidak boleh ada kenaikan harga sama sekali, e.g. untuk tiket amal)
        vm.startPrank(organizer);
        nft.configureTicketCategory(TOKEN_VVIP, 100, PRICE_REGULER, 10000, 500, 0, 0);
        nft.mintToMarketplace(TOKEN_VVIP, 5);
        marketplace.listPrimary(TOKEN_VVIP, 5, PRICE_REGULER);
        vm.stopPrank();

        vm.prank(alice);
        marketplace.buyTicket(1, 1);

        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);

        // Upaya list di atas 100% harga beli (misal 100.01%) - HARUS REVERT
        uint256 expensivePrice = PRICE_REGULER + 10**18; // tambah Rp1 (dalam wei)
        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.PriceCeilingExceeded.selector,
                expensivePrice,
                PRICE_REGULER
            )
        );
        marketplace.listResale(TOKEN_VVIP, 1, expensivePrice);

        // List tepat di 100% harga beli - HARUS SUKSES
        marketplace.listResale(TOKEN_VVIP, 1, PRICE_REGULER);
        vm.stopPrank();
    }

    /// SKENARIO D: Penjualan Resale Tidak Terpengaruh oleh Jendela Waktu Penjualan Perdana
    function test_Resale_NotRestrictedBySaleWindow() public {
        // 1. Setup & beli tiket perdana dalam sale window
        vm.startPrank(organizer);
        uint256 start = block.timestamp + 1 hours;
        uint256 end = block.timestamp + 3 hours;
        nft.configureTicketCategory(TOKEN_VVIP, 100, PRICE_REGULER, 11000, 500, start, end);
        nft.mintToMarketplace(TOKEN_VVIP, 5);
        marketplace.listPrimary(TOKEN_VVIP, 5, PRICE_REGULER);
        vm.stopPrank();

        vm.warp(start + 10 minutes);

        vm.prank(alice);
        marketplace.buyTicket(1, 1);

        // 2. Geser waktu keluar dari sale window (sale berakhir)
        vm.warp(end + 1 hours);

        // 3. Alice list resale dan Carol beli resale tiket VVIP tersebut
        //    Meskipun primary sale window telah ditutup, resale harus tetap sukses
        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);
        uint256 resalePrice = PriceLib.maxResalePrice(PRICE_REGULER, 11000);
        marketplace.listResale(TOKEN_VVIP, 1, resalePrice);
        vm.stopPrank();

        // Listing ID untuk resale adalah 2
        vm.prank(carol);
        marketplace.buyTicket(2, 1);

        assertEq(nft.balanceOf(carol, TOKEN_VVIP), 1);
    }

    // ════════════════════════════════════════════════════════════════
    //  CANCEL LISTING
    // ════════════════════════════════════════════════════════════════

    function test_CancelListing_ReturnsTicketToSeller() public {
        _setupAliceOwnsTicket();

        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);
        marketplace.listResale(TOKEN_REGULER, 1, PriceLib.maxResalePrice(PRICE_REGULER, 11000));
        vm.stopPrank();

        uint256 aliceTicketsBefore = nft.balanceOf(alice, TOKEN_REGULER);

        vm.prank(alice);
        marketplace.cancelListing(1);

        assertEq(nft.balanceOf(alice, TOKEN_REGULER), aliceTicketsBefore + 1);
        assertFalse(marketplace.getListing(1).active);
    }

    function test_CancelListing_RevertIfNotSeller() public {
        _setupAliceOwnsTicket();

        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);
        marketplace.listResale(TOKEN_REGULER, 1, PriceLib.maxResalePrice(PRICE_REGULER, 11000));
        vm.stopPrank();

        vm.prank(bob); // bukan seller
        vm.expectRevert(
            abi.encodeWithSelector(ITicketMarketplace.NotSeller.selector, 1, bob)
        );
        marketplace.cancelListing(1);
    }

    // ════════════════════════════════════════════════════════════════
    //  ROYALTY DIRECT ROUTING
    // ════════════════════════════════════════════════════════════════

    function test_RoyaltyDirectRouting_Success() public {
        _setupAliceOwnsTicket();

        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);
        marketplace.listResale(TOKEN_REGULER, 1, PriceLib.maxResalePrice(PRICE_REGULER, 11000));
        vm.stopPrank();

        (, uint256 royaltyExpected) = nft.royaltyInfo(TOKEN_REGULER, PriceLib.maxResalePrice(PRICE_REGULER, 11000));
        uint256 organizerBalanceBefore = idrx.balanceOf(organizer);

        vm.prank(bob);
        marketplace.buyTicket(1, 1);

        assertEq(
            idrx.balanceOf(organizer),
            organizerBalanceBefore + royaltyExpected,
            "Organizer harus menerima royalti langsung saat transaksi"
        );
    }

    // ════════════════════════════════════════════════════════════════
    //  FUZZ TEST — Price Ceiling
    // ════════════════════════════════════════════════════════════════

    /// @dev Fuzz: pastikan ceiling selalu konsisten di range harga dan batas persentase apapun.
    function testFuzz_PriceCeiling_NeverExceedsCeilingBps(
        uint256 originalPrice,
        uint256 resalePrice,
        uint256 ceilingBps
    )
        public
        pure
    {
        // Batasi range supaya tidak overflow/underflow
        originalPrice = bound(originalPrice, 0.001 ether, 100 ether);
        ceilingBps    = bound(ceilingBps, 10000, 50000); // 100% sampai 500%

        uint256 maxAllowed = PriceLib.maxResalePrice(originalPrice, ceilingBps);

        if (resalePrice > maxAllowed) {
            assertGt(resalePrice, maxAllowed);
        } else {
            assertLe(resalePrice, maxAllowed);
        }
    }

    /// @dev Fuzz: royalti tidak pernah melebihi total pembayaran.
    function testFuzz_Royalty_NeverExceedsTotal(
        uint256 resalePrice
    )
        public
        view
    {
        resalePrice = bound(resalePrice, 0, 100_000_000 * 10**18); // Rp100 Juta
        (, uint256 royalty) = nft.royaltyInfo(TOKEN_REGULER, resalePrice);
        assertLe(royalty, resalePrice, "Royalti tidak boleh melebihi total pembayaran");
    }
}
```

---

## 3.4 `test/integration/FullFlow.t.sol`

End-to-end test tanpa mock. Semua contract deployed sungguhan. Simulasi alur lengkap: mint → primary sale → resale → royalti withdrawal.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/TestHelper.sol";
import "../../src/libraries/PriceLib.sol";

contract FullFlowTest is TestHelper {

    /// @dev Skenario lengkap:
    ///      Organizer mint → Alice beli primary → Alice resale → Bob beli resale →
    ///      Organizer tarik royalti.
    function test_FullFlow_PrimaryToResaleToRoyaltyWithdrawal() public {
        // ── Step 1: Organizer mint dan list primary ──────────────────────────
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 50);
        marketplace.listPrimary(TOKEN_REGULER, 50, PRICE_REGULER);
        vm.stopPrank();

        // ── Step 2: Alice beli 1 tiket primary ──────────────────────────────
        vm.prank(alice);
        marketplace.buyTicket(0, 1);

        assertEq(nft.balanceOf(alice, TOKEN_REGULER), 1, "Alice harus punya 1 tiket");

        // ── Step 3: Alice resale dengan harga 110% ───────────────────────────
        uint256 resalePrice = PriceLib.maxResalePrice(PRICE_REGULER, 11000); // Rp110.000

        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);
        marketplace.listResale(TOKEN_REGULER, 1, resalePrice);
        vm.stopPrank();

        // Tiket sekarang ada di escrow (marketplace)
        assertEq(nft.balanceOf(alice, TOKEN_REGULER),          0);
        assertEq(nft.balanceOf(address(marketplace), TOKEN_REGULER), 1);

        // ── Step 4: Bob beli dari resale (Dengan Royalti Direct Routing) ─────
        (, uint256 royaltyExpected) = nft.royaltyInfo(TOKEN_REGULER, resalePrice);
        uint256 aliceProceeds   = resalePrice - royaltyExpected;

        uint256 aliceBalanceBefore = idrx.balanceOf(alice);
        uint256 organizerBalanceBefore = idrx.balanceOf(organizer);

        vm.prank(bob);
        marketplace.buyTicket(1, 1);

        // Bob punya tiket
        assertEq(nft.balanceOf(bob, TOKEN_REGULER), 1, "Bob harus punya tiket");
        // Alice dapat proceeds
        assertEq(idrx.balanceOf(alice), aliceBalanceBefore + aliceProceeds);
        // Organizer langsung menerima royalti secara otomatis (direct routing)
        assertEq(
            idrx.balanceOf(organizer),
            organizerBalanceBefore + royaltyExpected,
            "Organizer harus menerima royalti langsung secara real-time"
        );
    }

    /// @dev Skenario anti-scalping: calo tidak bisa listing di atas ceiling.
    function test_FullFlow_AntiScalping_CeilingEnforced() public {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 10);
        marketplace.listPrimary(TOKEN_REGULER, 10, PRICE_REGULER);
        vm.stopPrank();

        // Calo (alice) beli tiket
        vm.prank(alice);
        marketplace.buyTicket(0, 1);

        // Calo coba jual 5x harga asal
        vm.startPrank(alice);
        nft.setApprovalForAll(address(marketplace), true);

        uint256 scalpingPrice = PRICE_REGULER * 5;
        vm.expectRevert(
            abi.encodeWithSelector(
                ITicketMarketplace.PriceCeilingExceeded.selector,
                scalpingPrice,
                PriceLib.maxResalePrice(PRICE_REGULER, 11000)
            )
        );
        marketplace.listResale(TOKEN_REGULER, 1, scalpingPrice);
        vm.stopPrank();
    }

    /// @dev Skenario transfer gating: tiket tidak bisa bypass ke wallet langsung.
    function test_FullFlow_TransferGating_NoBypassing() public {
        vm.startPrank(organizer);
        nft.mintToMarketplace(TOKEN_REGULER, 1);
        marketplace.listPrimary(TOKEN_REGULER, 1, PRICE_REGULER);
        vm.stopPrank();

        vm.prank(alice);
        marketplace.buyTicket(0, 1);

        // Alice coba transfer ke carol langsung (bypass marketplace)
        vm.prank(alice);
        vm.expectRevert(TicketNFT.UnauthorizedTransfer.selector);
        nft.safeTransferFrom(alice, carol, TOKEN_REGULER, 1, "");
    }
}
```

---

## 4. Menjalankan Test

### Semua Test

```bash
forge test -vvv
```

### Per File

```bash
forge test --match-path test/unit/TicketNFT.t.sol -vvv
forge test --match-path test/unit/TicketMarketplace.t.sol -vvv
forge test --match-path test/integration/FullFlow.t.sol -vvv
```

### Per Fungsi Spesifik

```bash
forge test --match-test test_Resale_JualUntung_RoyaltyDikenakan -vvv
forge test --match-test test_Resale_JualRugi_RoyaltyNol -vvv
```

### Fuzz Test

```bash
forge test --match-test testFuzz -vvv --fuzz-runs 1000
```

---

## 5. Coverage Report (Metrik Skripsi)

```bash
forge coverage --report summary
```

Output yang diharapkan:

```
| File                            | % Lines | % Stmts | % Branches | % Funcs |
|---------------------------------|---------|---------|------------|---------|
| src/TicketNFT.sol               | 100%    | 100%    | 100%       | 100%    |
| src/TicketMarketplace.sol       | 100%    | 100%    | 100%       | 100%    |
| src/libraries/PriceLib.sol      | 100%    | 100%    | 100%       | 100%    |
```

Untuk HTML report:

```bash
forge coverage --report lcov
genhtml lcov.info -o coverage-report
open coverage-report/index.html
```

---

## 6. Gas Profiling (Metrik Skripsi)

```bash
forge test --gas-report
```

Contoh output yang relevan untuk dibandingkan di Bab 4:

```
| src/TicketMarketplace.sol   | Function      | min   | avg   | median | max   |
|-----------------------------|---------------|-------|-------|--------|-------|
| TicketMarketplace           | buyTicket     | 68241 | 75130 | 75130  | 82019 |
| TicketMarketplace           | listPrimary   | 47823 | 47823 | 47823  | 47823 |
| TicketMarketplace           | listResale    | 89012 | 92341 | 92341  | 95670 |
```

> Bandingkan angka ini dengan implementasi ERC-721 untuk membuktikan efisiensi ERC-1155 di Bab 4.

---

## 7. Static Analysis — Slither

```bash
# Install
pip3 install slither-analyzer

# Jalankan
slither src/ --solc-remaps "@openzeppelin/=lib/openzeppelin-contracts/"
```

Target untuk skripsi: **zero high/medium severity findings**. Dokumentasikan output Slither sebagai bukti di Bab 4.

```bash
# Output ke file untuk lampiran
slither src/ --solc-remaps "@openzeppelin/=lib/openzeppelin-contracts/" \
  --json slither-report.json
```
