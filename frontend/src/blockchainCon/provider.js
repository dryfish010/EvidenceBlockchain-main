import { ethers } from "ethers";

/** connect to local blockchain (Hardhat)
 */
export const provider = new ethers.JsonRpcProvider(
  "http://127.0.0.1:8545"
);

/** only for test, the defult address */
export const privateKeys = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f094538b292c0f4b5d9e3a5a3b5f9d3d4f6f7d3",
  "0x5de4111afa1a4b949e3a5f7b3e5a2c3a4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9"
];

//get signer by index (0, 1, 2)

export const getSigner = (index) => {
  return new ethers.Wallet(privateKeys[index], provider);
};