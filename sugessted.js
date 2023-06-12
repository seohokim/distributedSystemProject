const axios = require("axios");
const fs = require('fs');

const API_URL = "https://mempool.space/api/mempool/recent";
const NUM_BLOCKS = 100;
const INTERVAL = 500;

const MIXED_RATIOS = [
  {deadline: 1, gasContent: 4},
];

let transactionId = 0;

class Transaction {
  constructor(txid, fee, deadline, nonce) {
    this.id = transactionId++;
    this.txid = txid;
    this.fee = fee;
    this.deadline = deadline;
    this.nonce = nonce;
  }
}

async function initialFetchRecentTransactions() {
  try {
    const response = await axios.get(API_URL);
    return response.data.slice(0, 10);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

async function fetchRecentTransactions() {
  try {
    const response = await axios.get(API_URL);
    return response.data.slice(0, 10);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

function processTransactions(transactions) {
  return transactions.map((tx) => {
    const deadline = calculateDeadline(tx.fee);
    const nonce = 0;
    return new Transaction(tx.txid, tx.fee, deadline, nonce);
  });
}

function calculateDeadline(fees) {
  const minFee = 2000;
  const maxFee = 1000000;

  const logMin = Math.log10(minFee);
  const logMax = Math.log10(maxFee);

  const logFees = Math.log10(fees);
  const normalizedLogFees = (logFees - logMin) / (logMax - logMin);

  const deadline = 4 - (normalizedLogFees * 6);

  return deadline;
}

async function simulateAlgorithms() {
  const initialTransactions = await initialFetchRecentTransactions();
  const initialProcessedTransactions = processTransactions(initialTransactions);

  let csvContent = "order,dead,gasCon,AverGas,AverTimeGas,missing\n"; // Add column headers

  for (const ratio of MIXED_RATIOS) {
    for (const order of ["DG", "GD"]) {  // "DG"는 deadline 먼저, "GD"는 gasContent 먼저
      let mixed = [];
      mixed.push(...initialProcessedTransactions);
      
      let mixedGasSum = 0;
      let mixedTimeSum = 0;
      let mixedMissing = 0;

      for (let i = 0; i < NUM_BLOCKS; i++) {
        let mixedAlarm = 0;
        mixed.sort(order === "DG" 
          ? (a, b) => a.deadline - b.deadline || b.fee - a.fee
          : (a, b) => b.fee - a.fee || a.deadline - b.deadline);

        for (let j = 0; j < ratio.deadline; j++) {
          const selectedMixed = mixed.shift();
          mixedGasSum += selectedMixed.fee;
          mixedTimeSum += selectedMixed.nonce * selectedMixed.fee;
        }

        mixed.sort(order === "DG" 
        ? (a, b) => b.fee - a.fee || a.deadline - b.deadline
        : (a, b) => a.deadline - b.deadline || b.fee - a.fee);

      for (let j = 0; j < ratio.gasContent; j++) {
        const selectedMixed = mixed.shift();
        mixedGasSum += selectedMixed.fee;
        mixedTimeSum += selectedMixed.nonce * selectedMixed.fee;
      }

        mixed = mixed.filter((tx) => {
          tx.deadline--;
          tx.nonce++;
          if (tx.deadline <= 0) {
            mixedMissing++;
            mixedAlarm++;
            return false;
          }
          return true;
        });



        const recentTransactions = await fetchRecentTransactions();
        const processedTransactions = processTransactions(recentTransactions);
        mixed.push(...processedTransactions.slice(0, 5 + mixedAlarm));
        await new Promise((resolve) => setTimeout(resolve, INTERVAL));

      }
      let line = `${order},${ratio.deadline},${ratio.gasContent},${mixedGasSum / NUM_BLOCKS},${mixedTimeSum / mixedGasSum},${mixedMissing}\n`;
      csvContent += line; // Append this line of result to the CSV content

      console.log(`Mixed results for ratio ${ratio.deadline}:${ratio.gasContent}, order ${order}`);
      console.log("Average gas per block:", mixedGasSum / NUM_BLOCKS);
      console.log("Average time spent per gas:", mixedTimeSum / mixedGasSum);
      console.log("Number of missing transactions:", mixedMissing);
    }
  }
  fs.appendFile('result1.csv', csvContent, function (err) { // Write (append) the CSV content to a file named "results.csv"
    if (err) throw err;
    console.log('CSV file has been saved.');
  });
}

simulateAlgorithms().catch((error) => {
  console.error("Error during simulation:", error);
});
