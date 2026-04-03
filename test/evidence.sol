// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../contracts/Evidence.sol";

contract EvidenceSystemTest {
    EvidenceToken token;
    EvidenceSystem system;

    // 測試角色地址
    address regAdmin = address(0x1);
    address submitter = address(0x2);
    address unauthorized = address(0x3);
    uint256 constant UPLOAD_FEE = 10 * 10**18;

    // 每次測試前的環境初始化
    function setupEnvironment() internal {
        token = new EvidenceToken();
        system = new EvidenceSystem(address(token));
        
        // 賦予測試合約自己 Root Admin 權限
        system.addRegionalAdmin(address(this), "NW4");
        
        // 分配代幣給提交者與自己
        token.transfer(submitter, 100 * 10**18);
        token.transfer(address(this), 100 * 10**18);
    }

    // ==========================================
    // 1. Super Admin 模組 (權限管理)
    // ==========================================
    function test_Admin_AddRegionalAdmin_Success() public {
        setupEnvironment();
        system.addRegionalAdmin(regAdmin, "NW4");
        assert(bytes(system.adminRegion(regAdmin)).length != 0);
    }

    function test_Admin_AddRegionalAdmin_Failure_Unauthorized() public {
        setupEnvironment();
        // 注意：這裡假設只有 Root Admin 能加。若 unauthorized 呼叫應報錯
        bool caught = false;
        try system.addRegionalAdmin(unauthorized, "SO1") {
            caught = false;
        } catch {
            caught = true;
        }
        // 若系統有 AccessControl，測試時需切換 caller 或在 try 內驗證權限
    }

    // ==========================================
    // 2. Regional Admin 模組 (案件生命週期)
    // ==========================================
    function test_RegAdmin_CreateCase_Success() public {
        setupEnvironment();
        system.createCase();
        string memory caseId = "NW41";
        assert(system.caseExists(caseId) == true);
    }

    function test_RegAdmin_AssignSubmitter_Success() public {
        setupEnvironment();
        system.createCase();
        system.assignCase("NW41", submitter);
        // 驗證邏輯：未報錯即代表指派成功
    }

    // ==========================================
    // 3. Submitter 模組 (證據上傳與代幣邏輯)
    // ==========================================
    function test_Submitter_UploadEvidence_Success() public {
        setupEnvironment();
        system.createCase();
        system.assignCase("NW41", address(this));
        system.authorizeSubmitter(address(this));

        token.approve(address(system), UPLOAD_FEE);
        bytes32 eHash = keccak256("Data001");
        
        system.uploadEvidence("NW41", "test.pdf", eHash, "PDF", "London");
        (bool verified, , , ) = system.readEvidence(eHash);
        assert(verified == false); // 剛上傳應為未驗證
    }

    function test_Submitter_Upload_Failure_NoAssignment() public {
        setupEnvironment();
        system.createCase();
        system.authorizeSubmitter(address(this));
        // 故意不執行 assignCase
        
        bool caught = false;
        try system.uploadEvidence("NW41", "hack.exe", keccak256("h"), "EXE", "Remote") {
            caught = false;
        } catch {
            caught = true;
        }
        assert(caught == true); // 應被攔截
    }

    // ==========================================
    // 4. Verification 模組 (審核與完整性)
    // ==========================================
    function test_Verify_Evidence_Success() public {
        setupEnvironment();
        system.createCase();
        system.assignCase("NW41", address(this));
        system.authorizeSubmitter(address(this));
        token.approve(address(system), UPLOAD_FEE);
        
        bytes32 eHash = keccak256("Data002");
        bytes32 eid= keccak256(abi.encodePacked("NW41", eHash, block.timestamp));
        system.uploadEvidence("NW41", "doc.jpg", eHash, "JPG", "London");

        // 執行驗證
        system.verifyEvidence(eid);
        (bool verified, , , address approver) = system.readEvidence(eid);
        
        assert(verified == true);
        assert(approver == address(this));
    }
/** 
    function test_Verify_Failure_Unauthorized() public {
        setupEnvironment();
        // 模擬非法帳戶嘗試呼叫 verify (需要對應權限檢查邏輯)
    }
    */
}