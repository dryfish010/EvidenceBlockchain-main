import { useState } from "react";
import { buyToken } from "../blockchainCon/token";

function TokenPanel({ accountIndex, addTxLog, setTxInfo ,setRefreshBalance }) {
  const [amount, setAmount] = useState("");

  const handleBuy = async () => {
    try {
      const info = await buyToken(accountIndex, amount);

      addTxLog("Buy Token Tx: " + info.hash);
      setTxInfo(info);
      setRefreshBalance(prev => prev + 1);
      
    } catch (err) {
      console.error(err);
      addTxLog("Buy Token Failed");
    }
  };

  return (
    <div className="panel">
      <h3>Token Actions</h3>

      <input
        type="text"
        placeholder="ETH Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleBuy}>Buy Token</button>
    </div>
  );
}

export { TokenPanel };

function TransactionLog({ txInfo }) {
  if (!txInfo) {
    return (
      <div className="panel">
        <h3>Transaction Details</h3>
        <p>No transaction yet.</p>
      </div>
    );
  }
  console.log("Rendering TransactionLog with txInfo:", txInfo);
  const safeEvents = txInfo.events.map((ev) => {
    const args = {};
    if (ev.args) {
      for (const key in ev.args) {
        const val = ev.args[key];
        args[key] = typeof val === "bigint" ? val.toString() : val;
      }
    }
    return {
      ...ev,
      args,
    };
  });

  return (
    <div className="panel">
      <h3>Transaction Details</h3>

      <p><strong>Hash:</strong> {txInfo.hash}</p>
      <p><strong>Block:</strong> {txInfo.blockNumber}</p>
      <p><strong>Gas Used:</strong> {txInfo.gasUsed}</p>
      <p><strong>Token Before:</strong> {txInfo.beforeBalance}</p>
      <p><strong>Balance After:</strong> {txInfo.balanceAfter}</p>


      <h4>Events</h4>
      <div className="event-box bg-gray-700 p-2 rounded">
        <pre>{JSON.stringify(safeEvents, null, 2)}</pre>
      </div>
    </div>
  );
}

export { TransactionLog };

