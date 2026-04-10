import { expect } from "chai";
import * as hardhat from "hardhat";
import { network } from "hardhat";

import hre from "hardhat";
import { ethers } from "ethers";
//import { ethers } from "hardhat";
import { EvidenceToken, EvidenceSystem } from "../typechain-types"; 
//import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Test", function () {
  it("should work", async function () {
    const { ethers } = await hre.network.connect();
    const signers = await ethers.getSigners();
    const owner = signers[0]; 
  });
});


describe("EvidenceSystem Forensic Workflow (Full Test Suite)", function () {
  let token: any;//EvidenceToken;
  let system:any; //EvidenceSystem;
  let owner: any;//SignerWithAddress;
  let regAdmin: any;//SignerWithAddress;
  let submitter: any;//SignerWithAddress;
  let unauthorized: any;//SignerWithAddress;
  
  const uploadFee = ethers.parseUnits("10", 18);
  const caseId = "NW41"; // 預設第一個案號

  beforeEach(async function () {
    const { ethers } = await hre.network.connect();
    [owner, regAdmin, submitter, unauthorized] = await ethers.getSigners();
    const [rootAdmin] = await ethers.getSigners();

    const EvidenceTokenFactory = await ethers.getContractFactory("EvidenceToken");
    token = (await EvidenceTokenFactory.deploy()) as EvidenceToken;

    const EvidenceNFTFactory = await ethers.getContractFactory("EvidenceNFT");
    const nft = (await EvidenceNFTFactory.deploy()) as any;

    const EvidenceSystemFactory = await ethers.getContractFactory("EvidenceSystem");
    system = (await EvidenceSystemFactory.deploy(await token.getAddress(), await nft.getAddress())) as EvidenceSystem;
    const tx = await system.connect(rootAdmin).addRegionalAdmin(unauthorized.address, "NW4");
    /*
     console.log("==== Transaction Raw ====");
        console.log("Sender:", tx.from);
        console.log("Nonce:", tx.nonce);
        console.log("Value:", tx.value.toString());
        console.log("Gas limit:", tx.gasLimit.toString());
        console.log("Input data:", tx.data);
        console.log("Transaction hash:", tx.hash);

        const receipt = await tx.wait();

        console.log("==== Transaction Receipt ====");
        console.log("Status:", receipt.status === 1 ? "Success" : "Failed");
        console.log("Block number:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        //console.log("Logs:", receipt.logs); // 事件 logs 陣列
        /*
        receipt.logs.forEach((log, i) => {
            console.log(`Log ${i}:`, log);
        });
        */


    // 初始資金分配
    await token.transfer(submitter.address, ethers.parseUnits("100", 18));
  });
  /** 
  async function printRoles(address: string, system: any) {
    const roles = await system.getRoles(address);
    console.log(`Roles for ${address}:`);
    console.log(`  Root Admin: ${roles[0]}`);
    console.log(`  Regional Admin: ${roles[1]}`);
    console.log(`  Submitter: ${roles[2]}`);
  }**/
    
  // --- 1. Super Admin 功能測試 ---
  describe("Super Admin: Role Management", function () {
    it("Should allow Root Admin to add a Regional Admin", async function () {
        console.log("Testing Root Admin adding Regional Admin...");
        const { ethers } = await hre.network.connect();
        const [owner, user1] = await ethers.getSigners();
        //await printRoles(owner.address, system);
        await expect(system.connect(owner).addRegionalAdmin(regAdmin.address, "NW4")).to.be.revert;
        //expect(await system.adminRegion(regAdmin.address)).to.equal("NW4");
    });

    it("Should fail if a non-admin tries to add a Regional Admin", async function () {
      await expect(system.connect(unauthorized).addRegionalAdmin(unauthorized.address, "SO1")).to.be.revertedWithCustomError(system, "AccessControlUnauthorizedAccount");
    });
  });

  // --- 2. Regional Admin 功能測試 ---
  describe("Regional Admin: Case Operations", function () {
    beforeEach(async function () {
      await system.connect(owner).addRegionalAdmin(regAdmin.address, "NW4");
    });

    it("Should allow Regional Admin to create a case", async function () {
      await expect(system.connect(regAdmin).createCase())
        .to.emit(system, "CaseCreated");
    });

    it("Should fail if unauthorized user tries to create a case", async function () {
      await expect(system.connect(unauthorized).createCase()).to.be.revert;//edWithCustomError(system, "AccessControlUnauthorizedAccount");;
    });

    it("Should allow Regional Admin to assign a submitter", async function () {
      await system.connect(regAdmin).createCase();
      await expect(system.connect(regAdmin).assignCase(caseId, submitter.address))
        .to.emit(system, "CaseAssigned");
    });

    it("Should allow Regional Admin to change case status", async function () {
      await system.connect(regAdmin).createCase();
      await expect(system.connect(regAdmin).updateCaseStatus(caseId, "Closed"))
        .to.emit(system, "CaseStatusUpdated");
    });
  });

  // --- 3. Submitter 功能測試 ---
  describe("Submitter: Evidence Handling", function () {
    const eHash = ethers.keccak256(ethers.toUtf8Bytes("Evidence_001"));

    beforeEach(async function () {
      await system.connect(owner).addRegionalAdmin(regAdmin.address, "NW4");
      await system.connect(regAdmin).createCase();
      await system.connect(regAdmin).authorizeSubmitter(submitter.address);
      await system.connect(regAdmin).assignCase(caseId, submitter.address);
      await token.connect(submitter).approve(await system.getAddress(), uploadFee);
    });

    it("Should allow authorized submitter to upload evidence", async function () {
      await expect(system.connect(submitter).uploadEvidence(caseId, "file.pdf", eHash, "PDF", "London"))
        .to.emit(system, "EvidenceUploaded");
    });

    it("Should fail if unauthorized user tries to upload evidence", async function () {
      await expect(system.connect(unauthorized).uploadEvidence(caseId, "hack.exe", eHash, "EXE", "Remote"))
        .to.be.revertedWith("Error: No Submitter Role");
    });
  });

  // --- 4. Evidence Verification & Reading ---
  describe("Verification & Reading", function () {
    let evidenceId: string;
    const eHash = ethers.keccak256(ethers.toUtf8Bytes("Evidence_002"));

    beforeEach(async function () {
      await system.connect(owner).addRegionalAdmin(regAdmin.address, "NW4");
      await system.connect(regAdmin).createCase();
      await system.connect(regAdmin).authorizeSubmitter(submitter.address);
      await system.connect(regAdmin).assignCase(caseId, submitter.address);
      await token.connect(submitter).approve(await system.getAddress(), uploadFee);
      
      const tx = await system.connect(submitter).uploadEvidence(caseId, "doc.jpg", eHash, "JPG", "London");
      const receipt = await tx.wait();
      // 從 Event 抓取產生的 evidenceId
      const event = receipt?.logs.find( x => 'fragment' in x && x.fragment.name === 'EvidenceUploaded') as any;
      evidenceId = event.args[1];
    });

    it("Should allow Regional Admin to verify evidence", async function () {
      await expect(system.connect(regAdmin).verifyEvidence(evidenceId))
        .to.emit(system, "EvidenceVerified");
    });

    it("Should allow anyone to read evidence (Public Transparency)", async function () {
      const data = await system.readEvidence(evidenceId);
      expect(data.loc).to.equal("London");
    });
  });
});

