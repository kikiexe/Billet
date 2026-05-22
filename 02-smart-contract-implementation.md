# 02 — Implementasi Smart Contract

> Seluruh contract ditulis Solidity `^0.8.24`. Urutan implementasi mengikuti dependency graph: Library → Interface → TicketNFT → TicketMarketplace.

---

## 2.1 `src/libraries/PriceLib.sol`

Helper murni (pure library) untuk kalkulasi price ceiling dan conditional royalti. Dipisah ke library agar mudah di-unit test secara terisolasi.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library PriceLib {
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Hitung harga maksimum yang diizinkan untuk resale.
    /// @param originalPrice Harga tiket saat primary sale (dalam wei).
    /// @param ceilingBps Persentase batas harga dalam basis points (misal 11000 = 110%).
    /// @return maxPrice Harga tertinggi yang boleh di-listing ulang.
    function maxResalePrice(uint256 originalPrice, uint256 ceilingBps)
        internal
        pure
        returns (uint256)
    {
        return (originalPrice * ceilingBps) / BPS_DENOMINATOR;
    }
}
```

---

## 2.2 `src/mock/MockERC20.sol`

Mock token ERC-20 yang digunakan sebagai simulasi Koin IDRX (Stablecoin) untuk sistem pembayaran platform.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

---

## 2.3 `src/interfaces/ITicketMarketplace.sol`

Kontrak interface publik. Mendefinisikan semua struct, event, custom error, dan fungsi yang diekspos marketplace. Menggunakan token IDRX sebagai alat pembayaran pembayaran.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITicketMarketplace {

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerUnit;   // harga per 1 tiket, dalam satuan IDRX (wei)
        uint256 originalPrice;  // harga primary sale, digunakan untuk ceiling & royalti
        bool    active;
        bool    isResale;
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    event TicketListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256         amount,
        uint256         pricePerUnit,
        bool            isResale
    );

    event TicketSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256         amount,
        uint256         totalPrice
    );

    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );

    // ─── Custom Errors ───────────────────────────────────────────────────────

    error PriceCeilingExceeded(uint256 asked, uint256 maxAllowed);
    error InsufficientPayment(uint256 sent, uint256 required);
    error ListingNotActive(uint256 listingId);
    error NotSeller(uint256 listingId, address caller);
    error ZeroAmount();
    error UnauthorizedTransfer();
    error SaleNotStarted(uint256 start, uint256 current);
    error SaleEnded(uint256 end, uint256 current);

    // ─── Functions ───────────────────────────────────────────────────────────

    function listPrimary(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external;

    function listResale(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external;

    function buyTicket(uint256 listingId, uint256 amount) external;

    function cancelListing(uint256 listingId) external;

    function getListing(uint256 listingId)
        external
        view
        returns (Listing memory);
}
```

---

## 2.4 `src/TicketNFT.sol`

Contract token ERC-1155. Tanggung jawab utamanya adalah:
1. Minting tiket per kategori (VIP, VVIP, Reguler) dalam satu kontrak.
2. **Transfer Gating** — override `_update` agar tiket hanya bisa berpindah tangan melalui address marketplace resmi. Mencegah bypass royalti via marketplace pihak ketiga.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract TicketNFT is ERC1155, ERC2981, Ownable {

    // ─── State Variables ─────────────────────────────────────────────────────

    /// @notice Address marketplace yang diizinkan melakukan transfer.
    address public authorizedMarketplace;

    /// @dev tokenId => harga primary sale dalam wei (untuk referensi ceiling).
    mapping(uint256 => uint256) public primaryPrice;

    /// @dev tokenId => supply maksimum tiket per kategori.
    mapping(uint256 => uint256) public maxSupply;

    /// @dev tokenId => berapa sudah di-mint.
    mapping(uint256 => uint256) public totalMinted;

    /// @dev tokenId => price ceiling kustom dalam basis points (misal 11000 = 110%).
    mapping(uint256 => uint256) public priceCeilingBps;

    /// @dev tokenId => timestamp mulai penjualan.
    mapping(uint256 => uint256) public saleStart;

    /// @dev tokenId => timestamp selesai penjualan.
    mapping(uint256 => uint256) public saleEnd;

    // Contoh token ID (bisa digunakan sebagai konstanta atau dinamis)
    uint256 public constant REGULER = 1;
    uint256 public constant VIP     = 2;
    uint256 public constant VVIP    = 3;

    // ─── Errors ──────────────────────────────────────────────────────────────

    error UnauthorizedTransfer();
    error ExceedsMaxSupply(uint256 tokenId, uint256 requested, uint256 remaining);
    error MarketplaceNotSet();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(string memory uri_)
        ERC1155(uri_)
        Ownable(msg.sender)
    {}

    // ─── Admin Functions ─────────────────────────────────────────────────────

    /// @notice Set alamat marketplace yang diizinkan melakukan transfer.
    ///         Dipanggil setelah TicketMarketplace di-deploy.
    function setAuthorizedMarketplace(address marketplace)
        external
        onlyOwner
    {
        authorizedMarketplace = marketplace;
    }

    /// @notice Konfigurasi kategori tiket baru.
    /// @param tokenId    ID kategori tiket.
    /// @param supply     Jumlah maksimum tiket.
    /// @param price      Harga primary sale dalam wei.
    /// @param ceilingBps Batas atas harga kustom dalam basis points (misal 11000 = 110%).
    /// @param royaltyBps Persentase royalti dalam basis points (500 = 5%).
    /// @param start      Timestamp mulai penjualan (0 jika tidak dibatasi).
    /// @param end        Timestamp selesai penjualan (0 jika tidak dibatasi).
    function configureTicketCategory(
        uint256 tokenId,
        uint256 supply,
        uint256 price,
        uint256 ceilingBps,
        uint96  royaltyBps,
        uint256 start,
        uint256 end
    )
        external
        onlyOwner
    {
        maxSupply[tokenId]       = supply;
        primaryPrice[tokenId]    = price;
        priceCeilingBps[tokenId] = ceilingBps;
        saleStart[tokenId]       = start;
        saleEnd[tokenId]         = end;
        _setTokenRoyalty(tokenId, owner(), royaltyBps);
    }

    /// @notice Mint tiket ke address marketplace (escrow awal).
    ///         Marketplace yang kemudian mendistribusikan ke pembeli.
    function mintToMarketplace(uint256 tokenId, uint256 amount)
        external
        onlyOwner
    {
        if (authorizedMarketplace == address(0)) revert MarketplaceNotSet();
        if (totalMinted[tokenId] + amount > maxSupply[tokenId]) {
            revert ExceedsMaxSupply(
                tokenId,
                amount,
                maxSupply[tokenId] - totalMinted[tokenId]
            );
        }
        totalMinted[tokenId] += amount;
        _mint(authorizedMarketplace, tokenId, amount, "");
    }

    /// @notice Dapatkan rentang waktu penjualan tiket.
    function getSaleWindow(uint256 tokenId) external view returns (uint256, uint256) {
        return (saleStart[tokenId], saleEnd[tokenId]);
    }

    // ─── Transfer Gating ─────────────────────────────────────────────────────

    /// @dev Override _update (OZ v5) — titik kontrol semua transfer ERC-1155.
    ///      Transfer diizinkan hanya jika:
    ///      - Ini adalah operasi mint (from == address(0)), ATAU
    ///      - Ini adalah operasi burn (to == address(0)), ATAU
    ///      - Salah satu pihak (from atau to) adalah authorizedMarketplace.
    ///
    ///      Dengan ini, user tidak bisa transfer langsung ke sesama wallet.
    ///      Semua transaksi HARUS melalui marketplace resmi.
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    )
        internal
        override
    {
        bool isMint       = (from == address(0));
        bool isBurn       = (to == address(0));
        bool isAuthorized = (from == authorizedMarketplace || to == authorizedMarketplace);

        if (!isMint && !isBurn && !isAuthorized) {
            revert UnauthorizedTransfer();
        }

        super._update(from, to, ids, values);
    }

    // ─── Interface Support ───────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

---

## 2.5 `src/TicketMarketplace.sol`

Monolithic contract yang menggabungkan logika marketplace dan escrow. Keputusan desain ini disengaja untuk:
- **Efisiensi gas** — mengurangi cross-contract calls.
- **Keamanan** — state selalu konsisten dalam satu kontrak, meminimalkan reentrancy surface.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TicketNFT.sol";
import "./interfaces/ITicketMarketplace.sol";
import "./libraries/PriceLib.sol";

contract TicketMarketplace is
    ITicketMarketplace,
    ERC1155Holder,
    Ownable,
    ReentrancyGuard
{
    // ─── State Variables ─────────────────────────────────────────────────────

    TicketNFT public immutable ticketNFT;
    IERC20    public immutable paymentToken; // Koin IDRX Stablecoin

    uint256 private _nextListingId;

    /// @dev listingId => Listing
    mapping(uint256 => Listing) private _listings;

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address ticketNFTAddress, address paymentTokenAddress)
        Ownable(msg.sender)
    {
        ticketNFT = TicketNFT(ticketNFTAddress);
        paymentToken = IERC20(paymentTokenAddress);
    }

    // ─── Primary Listing ─────────────────────────────────────────────────────

    /// @notice Organizer mendaftarkan tiket untuk primary sale.
    ///         Tiket sudah harus di-mint ke marketplace sebelum fungsi ini dipanggil.
    /// @param tokenId      ID kategori tiket.
    /// @param amount       Jumlah tiket yang di-listing.
    /// @param pricePerUnit Harga per tiket dalam satuan IDRX (wei).
    function listPrimary(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    )
        external
        override
        onlyOwner
    {
        if (amount == 0) revert ZeroAmount();

        uint256 listingId = _nextListingId++;
        _listings[listingId] = Listing({
            seller:        msg.sender,
            tokenId:       tokenId,
            amount:        amount,
            pricePerUnit:  pricePerUnit,
            originalPrice: pricePerUnit,
            active:        true,
            isResale:      false
        });

        emit TicketListed(listingId, msg.sender, tokenId, amount, pricePerUnit, false);
    }

    // ─── Resale Listing ──────────────────────────────────────────────────────

    /// @notice User yang sudah punya tiket mendaftarkan untuk dijual kembali.
    ///         Kontrak menerapkan price ceiling kustom per kategori tiket.
    /// @param tokenId        ID tiket.
    /// @param amount         Jumlah tiket.
    /// @param pricePerUnit   Harga jual per tiket dalam satuan IDRX (wei).
    function listResale(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    )
        external
        override
        nonReentrant
    {
        if (amount == 0) revert ZeroAmount();

        // 1. Tarik original price yang SAH langsung dari TicketNFT
        uint256 trueOriginalPrice = ticketNFT.primaryPrice(tokenId);

        // 2. Terapkan price ceiling kustom dari kontrak NFT menggunakan data sah (Single Source of Truth)
        uint256 ceilingBps = ticketNFT.priceCeilingBps(tokenId);
        uint256 maxPrice = PriceLib.maxResalePrice(trueOriginalPrice, ceilingBps);
        if (pricePerUnit > maxPrice) {
            revert PriceCeilingExceeded(pricePerUnit, maxPrice);
        }

        // Transfer tiket dari seller ke kontrak (escrow)
        ticketNFT.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        uint256 listingId = _nextListingId++;
        _listings[listingId] = Listing({
            seller:        msg.sender,
            tokenId:       tokenId,
            amount:        amount,
            pricePerUnit:  pricePerUnit,
            originalPrice: trueOriginalPrice,
            active:        true,
            isResale:      true
        });

        emit TicketListed(listingId, msg.sender, tokenId, amount, pricePerUnit, true);
    }

    // ─── Buy ─────────────────────────────────────────────────────────────────

    /// @notice Pembeli membeli tiket dari listing aktif menggunakan token IDRX.
    ///         Untuk resale: royalti kondisional otomatis dihitung dan ditahan.
    ///         Dana sisa dikirim ke seller. Tiket dikirim ke buyer.
    /// @param listingId ID listing yang ingin dibeli.
    /// @param amount    Jumlah tiket yang ingin dibeli.
    function buyTicket(uint256 listingId, uint256 amount)
        external
        override
        nonReentrant
    {
        Listing storage listing = _listings[listingId];

        if (!listing.active)     revert ListingNotActive(listingId);
        if (amount == 0)         revert ZeroAmount();

        // Validasi waktu penjualan tiket perdana (Primary Sale Only)
        if (!listing.isResale) {
            (uint256 start, uint256 end) = ticketNFT.getSaleWindow(listing.tokenId);
            if (start != 0 && block.timestamp < start) {
                revert SaleNotStarted(start, block.timestamp);
            }
            if (end != 0 && block.timestamp > end) {
                revert SaleEnded(end, block.timestamp);
            }
        }

        uint256 totalPrice = listing.pricePerUnit * amount;
        
        // Cek kecukupan saldo & allowance token IDRX pembeli
        uint256 buyerBalance = paymentToken.balanceOf(msg.sender);
        if (buyerBalance < totalPrice) {
            revert InsufficientPayment(buyerBalance, totalPrice);
        }
        
        uint256 allowance = paymentToken.allowance(msg.sender, address(this));
        if (allowance < totalPrice) {
            revert InsufficientPayment(allowance, totalPrice);
        }

        // Update state sebelum transfer (Checks-Effects-Interactions pattern)
        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        // Hitung distribusi dana
        uint256 royaltyAmount = 0;
        uint256 sellerProceeds = totalPrice;
        address royaltyReceiver;

        if (listing.isResale) {
            if (totalPrice > listing.originalPrice * amount) {
                // Ambil royalti dinamis dari standard ERC-2981 NFT
                (royaltyReceiver, royaltyAmount) = ticketNFT.royaltyInfo(listing.tokenId, totalPrice);
            }
            sellerProceeds = totalPrice - royaltyAmount;
        }

        // Eksekusi transfer token IDRX secara atomik DULU (Checks-Effects-Interactions Compliance)
        if (royaltyAmount > 0) {
            bool royaltyPaid = paymentToken.transferFrom(msg.sender, royaltyReceiver, royaltyAmount);
            require(royaltyPaid, "Royalty transfer failed");
        }
        
        if (sellerProceeds > 0) {
            bool proceedsPaid = paymentToken.transferFrom(msg.sender, listing.seller, sellerProceeds);
            require(proceedsPaid, "Proceeds transfer failed");
        }

        // Baru setelah itu transfer tiket ke buyer dari escrow
        ticketNFT.safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            amount,
            ""
        );

        emit TicketSold(listingId, msg.sender, amount, totalPrice);
    }

    // ─── Cancel Listing ──────────────────────────────────────────────────────

    /// @notice Seller membatalkan listing resale dan mengambil kembali tiketnya.
    function cancelListing(uint256 listingId)
        external
        override
        nonReentrant
    {
        Listing storage listing = _listings[listingId];

        if (!listing.active)             revert ListingNotActive(listingId);
        if (listing.seller != msg.sender) revert NotSeller(listingId, msg.sender);

        listing.active = false;

        // Kembalikan tiket ke seller hanya jika ini resale (tiket ada di escrow)
        if (listing.isResale) {
            ticketNFT.safeTransferFrom(
                address(this),
                msg.sender,
                listing.tokenId,
                listing.amount,
                ""
            );
        }

        emit ListingCancelled(listingId, msg.sender);
    }

    // ─── View ────────────────────────────────────────────────────────────────

    function getListing(uint256 listingId)
        external
        view
        override
        returns (Listing memory)
    {
        return _listings[listingId];
    }
}
```

---

## 2.6 `script/Deploy.s.sol`

Script deployment ke Base Sepolia (testnet) atau Base mainnet.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TicketNFT.sol";
import "../src/TicketMarketplace.sol";
import "../src/mock/MockERC20.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1. Deploy Mock IDRX Stablecoin (untuk simulasi)
        MockERC20 idrx = new MockERC20("Rupiah Digital", "IDRX");

        // 2. Deploy TicketNFT
        TicketNFT nft = new TicketNFT("https://api.smartticket.io/metadata/{id}");

        // 3. Deploy Marketplace dengan reference ke NFT dan IDRX
        TicketMarketplace marketplace = new TicketMarketplace(address(nft), address(idrx));

        // 4. Autorisasi marketplace di NFT contract
        nft.setAuthorizedMarketplace(address(marketplace));

        // 5. Setup kategori tiket (IDRX decimal = 18)
        //    configureTicketCategory(tokenId, maxSupply, price, ceilingBps, royaltyBps, start, end)
        nft.configureTicketCategory(1, 1000, 100_000 * 10**18, 11000, 500, 0, 0);  // REGULER (Rp100.000, ceiling 110%, royalty 5%, tanpa batas waktu)
        nft.configureTicketCategory(2, 200,  500_000 * 10**18, 11000, 500, 0, 0);  // VIP (Rp500.000)
        nft.configureTicketCategory(3, 50,   1_000_000 * 10**18, 11000, 500, 0, 0); // VVIP (Rp1.000.000)

        vm.stopBroadcast();

        console.log("Mock IDRX deployed at:         ", address(idrx));
        console.log("TicketNFT deployed at:         ", address(nft));
        console.log("TicketMarketplace deployed at: ", address(marketplace));
        console.log("Deployer:                      ", deployer);
    }
}
```

Cara jalankan:

```bash
# Deploy ke Base Sepolia
forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```
