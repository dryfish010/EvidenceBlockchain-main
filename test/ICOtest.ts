import { expect } from "chai";
import hre from "hardhat";
//const { ethers } = hre; --> not support 
import { ethers } from "ethers";
//import { ethers } from "hardhat";
import { EvidenceToken, ICOToken } from "../typechain-types";

describe("ICOToken + EvidenceToken (Ownable)", async function () {
  let token: EvidenceToken;
  let ico: ICOToken;
  let owner: any;
  let user: any;
  let attacker: any;

  let start: number;
  let end: number;
  let ethers: any;

  beforeEach(async () => {
    // need to connect to the network to get signers and deploy contracts
    //const { ethers } = await hre.network.connect();
     ({ ethers } = await hre.network.connect());
    [owner, user, attacker] = await ethers.getSigners();

    // Deploy token
    const Token = await ethers.getContractFactory("EvidenceToken");
    token = (await Token.deploy()) as EvidenceToken;
    await token.waitForDeployment();

    // Sale window
    start = Math.floor(Date.now() / 1000) - 10;
    end = start + 3600;

    // Deploy ICO
    const ICO = await ethers.getContractFactory("ICOToken");
    ico = (await ICO.deploy(
      await token.getAddress(),
      start,
      end,
      ethers.parseEther("20000"),
      ethers.parseEther("1000"),
      1000
    )) as ICOToken;
    await ico.waitForDeployment();

    //  IMPORTANT: Transfer token ownership to ICO
    await token.transferOwnership(await ico.getAddress());
  });

  it("initializes correctly", async () => {
    expect(await ico.tokensPerEth()).to.equal(1000);
    expect(await ico.saleStartTime()).to.equal(start);
    expect(await ico.saleEndTime()).to.equal(end);
  });
   //const { ethers } = await hre.network.connect();
  it("allows buying tokens", async () => {
    const before = await token.balanceOf(user.address);
    await ico.connect(user).buyTokens({ value: ethers.parseEther("1") });

    const after = await token.balanceOf(user.address);
    expect(after).to.be.gt(before);
  });

  it("emits TokensPurchased event", async () => {
    await expect(
      ico.connect(user).buyTokens({ value: ethers.parseEther("1") })
    ).to.emit(ico, "TokensPurchased");
  });

  it("reverts if buying with 0 ETH", async () => {
    await expect(
      ico.connect(user).buyTokens({ value: 0 })
    ).to.be.revertedWith("Send ETH to buy tokens");
  });

  it("can not have sale when not started", async () => {
    //const { ethers } = await hre.network.connect();
    const ICO =  await ethers.getContractFactory("ICOToken");
    const ico2 = (await ICO.deploy(
      await token.getAddress(),
      start + 9999,
      end + 9999,
      ethers.parseEther("20000"),
      ethers.parseEther("20000"),
      1000
    )) as ICOToken;

    await expect(
      ico2.connect(user).buyTokens({ value: ethers.parseEther("1") })
    ).to.be.revertedWith("Sale not started");
  });

  it("reverts if sale ended, can not buy tokens", async () => {
    await ico.setSaleWindowUpdated(0, 1);

    await expect(
      ico.connect(user).buyTokens({ value: ethers.parseEther("1") })
    ).to.be.revertedWith("Sale ended");
  });

  it("reverts if exceeds totalTokensForSale", async () => {
    await expect(
      ico.connect(user).buyTokens({ value: ethers.parseEther("100") })
    ).to.be.revertedWith("Exceeds total tokens for sale");
  });

  it("reverts if exceeds saleCap", async () => {
    await expect(
      ico.connect(user).buyTokens({ value: ethers.parseEther("10") })
    ).to.be.revertedWith("Exceeds sale cap");
  });

  it("allows ETH receive() fallback to buy tokens", async () => {
    await user.sendTransaction({
      to: await ico.getAddress(),
      value: ethers.parseEther("1")
    });

    const bal = await token.balanceOf(user.address);
    expect(bal).to.equal(ethers.parseEther("1000"));
  });

  it("allows admin to withdraw", async () => {
    await ico.connect(user).buyTokens({ value: ethers.parseEther("1") });

    const before = await owner.provider.getBalance(owner.address);
    await ico.withdraw();
    const after = await owner.provider.getBalance(owner.address);
    //const role = await ico.DEFAULT_ADMIN_ROLE();
    //console.log(await ico.hasRole(role, owner.address));

    expect(after).to.be.gt(before);
  });
  it ("prevents non-admin from withdrawing", async () => {
   // console.log("Testing non-admin withdrawal..." + ico.connect(attacker).withdraw());
    await expect(ico.connect(attacker).withdraw()).to.be.revertedWithCustomError(
        ico,
        "AccessControlUnauthorizedAccount",
    ).withArgs(
        attacker.address,
        await ico.DEFAULT_ADMIN_ROLE()
    );
  });
/*
    it("prevents reentrancy attack on buyTokens", async () => {
    
        const Malicious = await ethers.getContractFactory("MaliciousBuyer");
        const attackerContract = await Malicious.deploy(await ico.getAddress());

        await expect(
            attackerContract.attack({ value: ethers.parseEther("1") })
        ).to.be.revert;
    });
    */
});
