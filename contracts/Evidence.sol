// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./EvidenceToken.sol";

//teat hash:0x74657374696e675f65766964656e63655f686173685f323032365f30335f3137;
// 1. 定義 Token (ICO 規費代幣)

// 2. 數位證據管理系統
contract EvidenceSystem is AccessControl {
    //----initial setting ------
    bytes32 public constant REGIONAL_ADMIN_ROLE = keccak256("REGIONAL_ADMIN_ROLE");
    bytes32 public constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");
    EvidenceToken public token;
    EvidenceNFT public evidenceNFT;
    
    uint256 public uploadFee = 10 * 10**18; // 預設規費 10 EVT

    struct Case {
        string caseId;
        string casePostcode;
        string status;
        uint256 timestamp;
        address[] assignedTo;
        address caseRegionalAdmin;
        bool exists;
    }

    struct Evidence {
        bool isVer;
        uint256 timestamp;
        bytes32 evidenceId;
        string caseId;
        string evidenceType;
        bytes32 evidenceHash;
        string evidenceName;
        string evidencelocation;
        address submitter;
        address approveBy;
    }

    mapping(string => Case) public allCases;
    mapping(string => uint256) public regionalCaseCount;
    mapping(bytes32 => Evidence) public allEvidence;
    mapping(address => string) public adminRegion;

    event CaseCreated(string caseId, string postcode, address indexed regionalAdmin);
    event CaseAssigned(string caseId, address submitter);
    event EvidenceUploaded(string caseId, bytes32 evidenceId, address submitter);
    event CaseStatusUpdated(string caseId, string newStatus);
    event EvidenceVerified(bytes32 evidenceId, address indexed verifier);

    constructor(address _tokenAddress, address _nftAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        token = EvidenceToken(_tokenAddress);
        evidenceNFT = EvidenceNFT(_nftAddress);
    }


    // --- 管理功能 (Root Admin) ---
    function addRegionalAdmin(address _admin, string memory _postcode) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only Root Admin");
        _grantRole(REGIONAL_ADMIN_ROLE, _admin);
        adminRegion[_admin] = _postcode;
        
    }

    // --- 區域管理功能 (Regional Admin) ---
    function authorizeSubmitter(address submitter) public onlyRole(REGIONAL_ADMIN_ROLE) {
        _grantRole(SUBMITTER_ROLE, submitter);
    }

    function createCase() public onlyRole(REGIONAL_ADMIN_ROLE) {
        string memory region = adminRegion[msg.sender];
        require(bytes(region).length != 0, "Admin has no assigned region");

        uint256 currentCount = regionalCaseCount[region] + 1;
        string memory newCaseId = string(abi.encodePacked(region, uintToString(currentCount)));
        
        require(!allCases[newCaseId].exists, "Case ID already exists");

        allCases[newCaseId] = Case({
            caseId: newCaseId,
            casePostcode: region,
            status: "Open",
            timestamp: block.timestamp,
            assignedTo: new address[](0),
            caseRegionalAdmin: msg.sender,
            exists: true
        });

        regionalCaseCount[region]++;
        emit CaseCreated(newCaseId, region, msg.sender);
    }

    function assignCase(string memory _caseId, address _submitter) public onlyRole(REGIONAL_ADMIN_ROLE) {
        Case storage c = allCases[_caseId];
        require(c.exists, "Case does not exist");
        c.assignedTo.push(_submitter);
        emit CaseAssigned(_caseId, _submitter);
    }

    function updateCaseStatus(string memory _caseId, string memory _newStatus) public onlyRole(REGIONAL_ADMIN_ROLE) {
        require(allCases[_caseId].exists, "Case does not exist");
        allCases[_caseId].status = _newStatus;
        emit CaseStatusUpdated(_caseId, _newStatus);
    }

    function verifyEvidence(bytes32 _evidenceId) public onlyRole(REGIONAL_ADMIN_ROLE) {
        Evidence storage e = allEvidence[_evidenceId];
        require(e.evidenceId != 0, "Evidence not exist");
        require(!e.isVer, "Evidence is already Verified");

        e.isVer = true;
        e.approveBy = msg.sender;
        emit EvidenceVerified(_evidenceId, msg.sender);
    }

    // --- 提交者功能 (Submitter) ---
    function uploadEvidence(
        string memory _caseId,
        string memory _evidenceName,
        bytes32 _evidenceHash,
        string memory _fileFormat,
        string memory _location
    ) public {
        // 1. 權限檢查 Access Control 
        require(hasRole(SUBMITTER_ROLE, msg.sender), "Error: No Submitter Role");

        // 2. 案件是否存在與指派檢查 Case assign or no 
        Case storage c = allCases[_caseId];
        require(c.exists, "Error: Case ID does not exist");

        bool isAuthorized = false;
        for (uint i = 0; i < c.assignedTo.length; i++) {
            if (c.assignedTo[i] == msg.sender) {
                isAuthorized = true;
                break;
            }
        }
        require(isAuthorized, "Error: Not assigned to this case");

        // 3. 代幣支付檢查 (ERC20 Integration)
        //require(token.balanceOf(msg.sender) >= uploadFee, "Error: Low token balance");
        //require(token.allowance(msg.sender, address(this)) >= uploadFee, "Error: Token not approved");

        // 4. 執行代幣扣款 
        //token.transferFrom(msg.sender, address(this), uploadFee);

        // 5. 儲存證據資料 store evidence 
        // using case, file hash and time, hash tem into the only id
        bytes32 evidenceId = keccak256(abi.encodePacked(_caseId, _evidenceHash, block.timestamp));
        allEvidence[evidenceId] = Evidence({
            isVer: false,
            timestamp: block.timestamp,
            evidenceId: evidenceId,
            caseId: _caseId,
            evidenceType: _fileFormat,
            evidenceHash: _evidenceHash,
            evidenceName: _evidenceName,
            evidencelocation: _location,
            submitter: msg.sender,
            approveBy: address(0)
        });

        emit EvidenceUploaded(_caseId, evidenceId, msg.sender);
    }

    // --- 查詢功能 (View Functions) ---
    function readEvidence(bytes32 _id) public view returns (bool verified, string memory loc, uint256 time, address approver) {
        Evidence memory e = allEvidence[_id];
        return (e.isVer, e.evidencelocation, e.timestamp, e.approveBy);
    }

    // other fuction --> for show result and test 
    function getAssignedSubmitters(string memory _caseId) public view returns (address[] memory) {
        require(allCases[_caseId].exists, "Case does not exist");
        return allCases[_caseId].assignedTo;
    }
    function getRoles(address account) public view returns (bool isRootAdmin, bool isRegionalAdmin, bool isSubmitter) {
        isRootAdmin = hasRole(DEFAULT_ADMIN_ROLE, account);
        isRegionalAdmin = hasRole(REGIONAL_ADMIN_ROLE, account);
        isSubmitter = hasRole(SUBMITTER_ROLE, account);
    }

    function uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 j = v;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (v != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(v - (v / 10) * 10));
            bstr[k] = bytes1(temp);
            v /= 10;
        }
        return string(bstr);
    }
    //--- only for auto test
    function caseExists(string memory _caseId) public view returns (bool) {
        return allCases[_caseId].exists;
    }

    
}
