import { ethers } from "ethers";
import tokenAbi from "../abi/EvidenceToken.json";
import icoAbi from "../abi/ICOToken.json";
import { getSigner } from "./provider";

//Token contract address
 
export const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
//const { ethers } = await hre.network.connect();

//取得 Token 餘額
export const getTokenBalance = async (accountIndex) => {
  // 取得 signer（誰在查）
  const signer = getSigner(accountIndex);

  // 建立 contract instance
  const contract = new ethers.Contract(
    TOKEN_ADDRESS,
    tokenAbi.abi,
    signer
  );

  // 呼叫 smart contract function：balanceOf
  const balance = await contract.balanceOf(signer.address);
  return ethers.formatUnits(balance, 18);
};

// transfer token
export const transferToken = async (accountIndex, to, amount) => {
  const signer = getSigner(accountIndex);

  const contract = new ethers.Contract(
    TOKEN_ADDRESS,
    tokenAbi.abi,
    signer
  );
  const tx = await contract.transfer(
    to,
    ethers.parseUnits(amount, 18)
  );

  await tx.wait();

  // return transaction hash
  return tx.hash;
};

const ICO_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// buuy token
export const buyToken = async (accountIndex, ethAmount) => {
  if (!ethAmount || Number(ethAmount) <= 0) {
    throw new Error("Invalid ETH amount");
  }

  const signer = getSigner(accountIndex);

  // ICO contract
  const icoContract = new ethers.Contract(ICO_ADDRESS, icoAbi.abi, signer);
  const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi.abi, signer);

  const value = ethers.parseEther(ethAmount.toString());

  try {
    // 發送交易
    const before = await tokenContract.balanceOf(await signer.getAddress());
    const tx = await icoContract.buyTokens({ value });

    // 等待交易完成
    const receipt = await tx.wait();
    const after = await tokenContract.balanceOf(await signer.getAddress());

    // 解析 event logs
    const iface = new ethers.Interface(icoAbi.abi);
    const parsedEvents = receipt.logs
      .map(log => {
        try {
          return iface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // 查詢購買後餘額
    const balanceAfter = await tokenContract.balanceOf(await signer.getAddress());

    // 回傳所有前端需要顯示的資訊
    return {
      hash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: parsedEvents,
      balanceAfter: balanceAfter.toString(),
      beforeBalance: before.toString(),
      afterBalance: after.toString()
    };

  } catch (err) {
    console.error("Buy failed:", err);
    throw err;
  }
};
