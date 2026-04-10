// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.20;

// Token (ICO 規費代幣)
contract EvidenceToken is ERC20, Ownable {
    uint256 public immutable MAX_SUPPLY = 1_000_000 * 100 **decimals();
    constructor() ERC20("EvidenceToken", "EVT") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}
// NFT　for evidence
contract EvidenceNFT is ERC721, AccessControl {
    bytes32 public constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");
    uint256 private _tokenIdCounter;

    // evidence NFT
    struct EvidenceData {
        string caseId;
        string evidenceType;
        bytes32 evidenceHash;
        string evidenceName;
        string evidencelocation;
        address submitter;
    }
    mapping(uint256 => EvidenceData) public evidenceData;

    constructor() ERC721("EvidenceNFT", "EVT-NFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SUBMITTER_ROLE, msg.sender);
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // 只有具有 SUBMITTER_ROLE 的地址才能鑄造 NFT
    function mintEvidenceNFT(
        address to,
        string memory caseId,
        string memory evidenceType,
        bytes32 evidenceHash,
        string memory evidenceName,
        string memory evidencelocation
    ) external onlyRole(SUBMITTER_ROLE) returns (uint256) {
        // mint NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        // store evidence data
        evidenceData[tokenId] = EvidenceData({
            caseId: caseId,
            evidenceType: evidenceType,
            evidenceHash: evidenceHash,
            evidenceName: evidenceName,
            evidencelocation: evidencelocation,
            submitter: to
        });
        
        return tokenId;
    }
}  