// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";

contract TicketNFT is ERC1155, ERC2981, Ownable {

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct TicketHolder {
        string name;
        string nik; // NOTE: In production, NIK must be stored in ECIES encrypted format (Proposal Section 8) to secure user privacy
        bool registered;
        bool used;
    }

    // ─── State Variables ─────────────────────────────────────────────────────

    /// @notice Address marketplace yang diizinkan melakukan transfer.
    address public authorizedMarketplace;

    /// @notice Alamat gatekeeper yang diizinkan melakukan check-in tiket.
    mapping(address => bool) public isGateKeeper;

    /// @dev tokenId => Nama Kategori Tiket (VVIP, VIP, Reguler)
    mapping(uint256 => string) public ticketCategoryName;

    /// @dev owner => tokenId => TicketHolder[]
    mapping(address => mapping(uint256 => TicketHolder[])) private _ticketHolders;

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

    // ─── Events ──────────────────────────────────────────────────────────────

    event TicketCheckedIn(address indexed from, uint256 indexed tokenId, uint256 index);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error UnauthorizedTransfer();
    error ExceedsMaxSupply(uint256 tokenId, uint256 requested, uint256 remaining);
    error MarketplaceNotSet();
    error NotGateKeeper();

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

    /// @notice Set status alamat gatekeeper yang diizinkan membakar tiket di gerbang.
    function setGateKeeper(address gateKeeper, bool status) external onlyOwner {
        isGateKeeper[gateKeeper] = status;
    }

    /// @notice Set nama kategori tiket.
    function setTicketCategoryName(uint256 tokenId, string calldata name) external onlyOwner {
        ticketCategoryName[tokenId] = name;
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

    // ─── Identity & Check-in Functions ───────────────────────────────────────

    /// @notice Registrasi data pembeli tiket. Hanya bisa dipanggil oleh Marketplace resmi.
    /// @dev NOTE: In production, the 'nik' parameter will receive ECIES-encrypted ciphertext to satisfy privacy requirements.
    function registerHolder(
        address owner,
        uint256 tokenId,
        string calldata name,
        string calldata nik
    ) external {
        if (msg.sender != authorizedMarketplace) revert UnauthorizedTransfer();
        _ticketHolders[owner][tokenId].push(TicketHolder({
            name: name,
            nik: nik,
            registered: true,
            used: false
        }));
    }


    /// @notice Dapatkan jumlah tiket yang sudah digunakan (di-check-in).
    function getUsedTicketCount(address owner, uint256 tokenId) public view returns (uint256) {
        uint256 count = 0;
        uint256 length = _ticketHolders[owner][tokenId].length;
        for (uint256 i = 0; i < length; i++) {
            if (_ticketHolders[owner][tokenId][i].registered && _ticketHolders[owner][tokenId][i].used) {
                count++;
            }
        }
        return count;
    }

    /// @notice Dapatkan jumlah tiket yang belum digunakan.
    function getUnusedTicketCount(address owner, uint256 tokenId) public view returns (uint256) {
        uint256 count = 0;
        uint256 length = _ticketHolders[owner][tokenId].length;
        for (uint256 i = 0; i < length; i++) {
            if (_ticketHolders[owner][tokenId][i].registered && !_ticketHolders[owner][tokenId][i].used) {
                count++;
            }
        }
        return count;
    }

    /// @notice Hapus data holder yang belum digunakan (saat resale terjual). Hanya bisa dipanggil oleh Marketplace resmi.
    function removeUnusedHolder(address owner, uint256 tokenId) external {
        if (msg.sender != authorizedMarketplace) revert UnauthorizedTransfer();
        uint256 length = _ticketHolders[owner][tokenId].length;
        bool found = false;
        for (uint256 i = 0; i < length; i++) {
            if (_ticketHolders[owner][tokenId][i].registered && !_ticketHolders[owner][tokenId][i].used) {
                // Hapus dengan delete untuk mempertahankan index array
                delete _ticketHolders[owner][tokenId][i];
                found = true;
                break;
            }
        }
        require(found, "No unused ticket holder found");
    }

    /// @notice Melakukan check-in tiket penonton di gerbang masuk oleh gatekeeper resmi.
    ///         Membatalkan pembakaran NFT, melestarikan tiket sebagai kenang-kenangan dengan menandai properti used = true.
    function checkInFromGate(
        address from,
        uint256 tokenId,
        uint256 index
    ) external {
        if (!isGateKeeper[msg.sender] && msg.sender != owner()) revert NotGateKeeper();
        
        uint256 length = _ticketHolders[from][tokenId].length;
        require(index < length, "Index out of bounds");
        require(_ticketHolders[from][tokenId][index].registered, "Ticket not registered");
        require(!_ticketHolders[from][tokenId][index].used, "Ticket already used");

        // Invarian: saldo token user tidak boleh kurang dari jumlah unused ticket yang tersisa
        // Mencegah check-in tiket yang sedang di-escrow/listing di marketplace
        uint256 usedCount = getUsedTicketCount(from, tokenId);
        require(balanceOf(from, tokenId) > usedCount, "Insufficient ticket balance in wallet");
        
        _ticketHolders[from][tokenId][index].used = true;
        
        emit TicketCheckedIn(from, tokenId, index);
    }

    /// @notice Dapatkan data pembeli tiket terdaftar (read-only untuk panel panitia)
    function getTicketHolders(address owner, uint256 tokenId)
        external
        view
        returns (TicketHolder[] memory)
    {
        return _ticketHolders[owner][tokenId];
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
