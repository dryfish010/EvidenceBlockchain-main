//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

//access control
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./EvidenceToken.sol";

// token interface
interface IMintableToken is IERC20, IAccessControl, IERC20Permit {
    function mint(address to, uint256 amount) external;
}


contract ICOtokenSystem is AccessControl ,ReentrancyGuard, Pausable{
    // only super admin can set token price and sale time
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");

    // ---Token details---
    IMintableToken public token;
    //uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    uint256 public tokensPerEth = 1000; // 1 ETH = 1000 EVT
    uint256 public saleStartTime;
    uint256 public saleEndTime;
    uint256 public saleCap = 20000 * 10**18;
    uint256 public totalTokensForSale;
    uint256 public tokensSold;

    //---events---
    event TokensPurchased(address indexed buyer, uint256 amountOfETH, uint256 amountOfTokens);
    event SaleWindowUpdated(uint256 startTime, uint256 endTime);
    event RateUpdated(uint256 newRate);
    event SaleCapUpdated(uint256 newCap);
    event TokensForSaleSet(uint256 totalTokensForSale);
    event Withdrawn(address indexed admin, uint256 amount);

    //token constructor
    constructor(
        string memory _name,
        string memory _symbol,
        address _tokenAddress,
        uint256 _saleStartTime,
        uint256 _saleEndTime,
        uint256 _totalTokensForSale,
        uint256 _saleCap,
        uint256 _rate
    ) {
        //check input
        require( _tokenAddress != address(0), "Invalid token address");
        require(_rate > 0, "Rate must be > 0");
        require(_saleStartTime < _saleEndTime, "Invalid sale window");

        //init token
        token = IMintableToken(_tokenAddress);
        tokensPerEth = _rate;
        saleStartTime = _saleStartTime;
        saleEndTime = _saleEndTime;
        saleCap = _saleCap;
        totalTokensForSale = _totalTokensForSale;

        //role setup
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
    }

    //modifier to check if sale is active
    modifier onlyWhileSaleActive() {
        require(block.timestamp >= saleStartTime, "Sale not started");
        require(block.timestamp <= saleEndTime, "Sale ended");
        _;
    }
    //buy token 
    // nonReentrant to prevent reentrancy attack(from ReentrancyGuard)
    // whenNotPaused to allow pausing the sale in emergencies
    function buyTokens() public payable onlyWhileSaleActive nonReentrant whenNotPaused {
        require(msg.value > 0, "Send ETH to buy tokens");
        uint256 tokensToBuy = msg.value * tokensPerEth;
        //check if purchase exceeds limits
        require(tokensSold + tokensToBuy <= totalTokensForSale, "Exceeds total tokens for sale");
        require(tokensToBuy <= saleCap, "Exceeds sale cap");

        //mint tokens to buyer
        token.mint(msg.sender, tokensToBuy);
        tokensSold += tokensToBuy;

        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    }
    //allow contract to receive ETH directly
    receive() external payable {
        buyTokens();
    }
    //withdraw collected ETH
    function withdraw() external onlyRole(SUPER_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(msg.sender).transfer(balance);
        emit Withdrawn(msg.sender, balance);
    }
    //--- admin functions ---
    // admin functions to set sale parameters
    function setSaleWindowUpdated(uint256 _start, uint256 _end) external onlyRole(SUPER_ADMIN_ROLE) {
        require(_start < _end, "Invalid sale window");
        saleStartTime = _start;
        saleEndTime = _end;
        emit SaleWindowUpdated (_start, _end);
    }
    //admin can change token price
    function setRateUpdated (uint256 _newRate) external onlyRole(SUPER_ADMIN_ROLE) {
        require(_newRate > 0, "Rate must be > 0");
        tokensPerEth = _newRate;
        emit RateUpdated (_newRate);
    }
    //admin can set sale cap
    function setSaleCapUpdated (uint256 _newCap) external onlyRole(SUPER_ADMIN_ROLE) {
        require(_newCap > 0, "Cap must be > 0");
        saleCap = _newCap;
        emit SaleCapUpdated (_newCap);
    }
    //admin can set total tokens for sale
    function setTotalTokensForSale(uint256 _totalTokensForSale) external onlyRole(SUPER_ADMIN_ROLE) {
        //require(_totalTokensForSale <= MAX_SUPPLY, "Exceeds max supply");
        totalTokensForSale = _totalTokensForSale;
        emit TokensForSaleSet(_totalTokensForSale);
    }
 


}


