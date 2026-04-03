// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

pragma solidity ^0.8.20;

// 1. 定義 Token (ICO 規費代幣)
contract EvidenceToken is ERC20 {
    uint256 public immutable MAX_SUPPLY = 1_000_000 * 10**decimals();
    constructor() ERC20("EvidenceToken", "EVT") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    // Max limit 
    //min 
    function mint(address _to, uint256 _amount) external onlyOwner {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Cap exceeded");
        _mint(_to, _amount);
    }

}