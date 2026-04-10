import hre from "hardhat";
import { ethers } from "ethers";
import { expect } from "chai";
import { EvidenceNFT } from "../typechain-types";

describe("EvidenceNFT", function () {
  let nft: EvidenceNFT;
  let owner: any;
  let submitter: any;

  beforeEach(async () => {
    const { ethers } = await hre.network.connect();
    //({ ethers } = await hre.network.connect());
    [owner, submitter] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("EvidenceNFT");
    nft = (await NFT.deploy()) as EvidenceNFT;
    await nft.waitForDeployment();

    // grant submitter role
    const SUBMITTER_ROLE = await nft.SUBMITTER_ROLE();
    await nft.grantRole(SUBMITTER_ROLE, submitter.address);
  });

  it("allows submitter to mint NFT", async () => {
    const tx = await nft.connect(submitter).mintEvidenceNFT(
      submitter.address,
      "CASE123",
      "Image",
      ethers.keccak256(ethers.toUtf8Bytes("hash")),
      "photo.png",
      "London"
    );

    const receipt = await tx.wait();
    const tokenId = receipt.logs[0].args.tokenId;

    expect(await nft.ownerOf(tokenId)).to.equal(submitter.address);
  });

  it("prevents non-submitter from minting", async () => {
    await expect(
      nft.mintEvidenceNFT(
        owner.address,
        "CASE123",
        "Image",
        ethers.keccak256(ethers.toUtf8Bytes("hash")),
        "photo.png",
        "London"
      )
    ).to.be.revert;
  });
});
