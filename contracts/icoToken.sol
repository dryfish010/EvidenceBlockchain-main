// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

//access control
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; 
import "@openzeppelin/contracts/security/Pausable.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./tokenEX.sol";

// token interface
interface IMintableToken is IERC20 {
    function mint(address to, uint256 amount) external;
}


contract ICOtokenSystem is ERC20{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
   

//buy token 

//tokensPerEth



// ----sale part ---
// sale start time
// sale end time
// total tokens for sale
// tokens sold
//withdraw()
//Pausable
//ReentrancyGuard

//receive()


}

