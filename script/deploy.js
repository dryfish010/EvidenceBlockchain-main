import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy EvidenceToken
  const Token = await ethers.getContractFactory("EvidenceToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("EvidenceToken:", await token.getAddress());

  // 2. Deploy ICOToken
  const now = Math.floor(Date.now() / 1000);
  const saleStart = now;
  const saleEnd = now + 24*3600;

  const ICOToken = await ethers.getContractFactory("ICOToken");
  const ico = await ICOToken.deploy(
    token.target,
    saleStart,
    saleEnd,
    ethers.parseEther("100000"),
    ethers.parseEther("20000"),
    1000
);
  await ico.waitForDeployment();
  const icoAddress = await ico.getAddress();
  console.log("ICOToken:", icoAddress);
  await token.transferOwnership(ico.target);
  console.log("Token owner:", await token.owner());
  //console.log("Token:", token.target);
  console.log("ICO:", ico.target);
  //const MINTER_ROLE = await token.MINTER_ROLE();
  //await token.grantRole(MINTER_ROLE, icoTokenAddress);

  // 4. Deploy EvidenceSystem
  const EvidenceSystem = await ethers.getContractFactory("EvidenceSystem");
  const system = await EvidenceSystem.deploy(tokenAddress);
  await system.waitForDeployment();
  const systemAddress = await system.getAddress();
  console.log("EvidenceSystem:", await system.getAddress());

  // 5. Deploy NFT
  const NFT = await ethers.getContractFactory("EvidenceNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("EvidenceNFT:", await nft.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
