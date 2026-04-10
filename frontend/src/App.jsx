import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import { TokenPanel, TransactionLog } from "./components/token";
import tokenAbi from "./abi/EvidenceToken.json";
import {TOKEN_ADDRESS} from "./blockchainCon/token";

function App() {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountIndex, setAccountIndex] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [txLog, setTxLog] = useState([]);
  const [txInfo, setTxInfo] = useState(null);
  const [refreshBalance, setRefreshBalance] = useState(0);


  


  const addTxLog = (log) => {
    setTxLog((prev) => [log, ...prev]);
  };

  // inital provider & accounts
  useEffect(() => {
    const init = async () => {
      const prov = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      setProvider(prov);

      // ethers v6 這裡拿到的是 signer
      const signers = await prov.listAccounts();

      const addresses = [];
      for (let signer of signers) {
        const addr = await signer.getAddress();
        addresses.push(addr);
      }

      setAccounts(addresses);
      setSelectedAccount(addresses[0]);
    };

    init();
  }, []);

  // check account
  useEffect(() => {
    if (accounts.length > 0) {
      setSelectedAccount(accounts[accountIndex]);  
    }
  }, [accountIndex, accounts]);


  // 讀 balance
  useEffect(() => {
  const loadBalance = async () => {
    if (provider && selectedAccount) {
      const bal = await provider.getBalance(selectedAccount);
      setBalance(ethers.formatEther(bal));

      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi.abi, provider);
      const tbal = await tokenContract.balanceOf(selectedAccount);
      setTokenBalance(ethers.formatEther(tbal));
    }
  };

    loadBalance();
  }, [provider, selectedAccount, refreshBalance]);  


  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h2>Account Dashboard</h2>

        <label>Select Account:</label>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
        >
          {accounts.map((acc, index) => (
            <option key={index} value={acc}>
              {acc}
            </option>
          ))}
        </select>

        <p>Address: {selectedAccount}</p>
        <p>Balance: {balance} ETH</p>
      </div>

      {/* Middle */}
        <div className="middle">
        {/* 左邊：操作 */}
        <TokenPanel
          accountIndex={accountIndex}
          addTxLog={addTxLog}
          setTxInfo={setTxInfo} 
          refreshBalance={refreshBalance}
          setRefreshBalance={setRefreshBalance}
        />

        {/* Right */}
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg text-right mb-4 ">
          <h3>Transaction Log</h3>
          <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg text-right mb-4 ">
            <TransactionLog txInfo={txInfo} /> 
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;