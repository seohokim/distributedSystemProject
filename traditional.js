const axios = require("axios");

const API_URL = "https://mempool.space/api/mempool/recent";
const NUM_BLOCKS = 100;
const INTERVAL = 500;

class Transaction {
  constructor(txid, fee, deadline, nonce) {
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
    console.log(deadline);
    console.log(tx.fee);
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

  const deadline = 4 - (normalizedLogFees * 4);

  return deadline;
}

async function simulateAlgorithms() {
  let fifo = [];
  let gasContent = [];
  let deadline = [];


  let fifoGasSum = 0;
  let gasContentGasSum = 0;
  let deadlineGasSum = 0;

  let fifoTimeSum = 0;
  let gasContentTimeSum = 0;
  let deadlineTimeSum = 0;

  let fifoMissing = 0;
  let gasContentMissing = 0;
  let deadlineMissing = 0;

  let fifoalarm = 0;
  let gasContentalarm = 0;
  let deadlinealarm = 0;

  const initialTransactions = await initialFetchRecentTransactions();
  const initialProcessedTransactions = processTransactions(initialTransactions);
  fifo.push(...initialProcessedTransactions);
  gasContent.push(...initialProcessedTransactions);
  deadline.push(...initialProcessedTransactions);
  console.log('init done');



  for (let i = 0; i < NUM_BLOCKS; i++) {
    gasContent.sort((a, b) => b.fee - a.fee);
    deadline.sort((a, b) => a.deadline - b.deadline);

    for (let j = 0; j < 5; j++) {
      const selectedFifo = fifo.shift();
      fifoGasSum += selectedFifo.fee;
      fifoTimeSum += selectedFifo.nonce * selectedFifo.fee;

      const selectedGasContent = gasContent.shift();
      gasContentGasSum += selectedGasContent.fee;
      gasContentTimeSum += selectedGasContent.nonce * selectedGasContent.fee;

      const selectedDeadline = deadline.shift();
      deadlineGasSum += selectedDeadline.fee;
      deadlineTimeSum += selectedDeadline.nonce * selectedDeadline.fee;

    }

    fifo = fifo.filter((tx) => {
      tx.deadline--;
      tx.nonce++;
      if (tx.deadline <= 0) {
        fifoMissing++;
        fifoalarm++;
        console.log('fifoalarm');
        return false;
      }
      return true;
    });

    gasContent = gasContent.filter((tx) => {
      tx.deadline--;
      tx.nonce++;
      if (tx.deadline <= 0) {
        gasContentMissing++;
        gasContentalarm++;
        console.log('gasContentalarm');
        return false;
      }
      return true;
    });

    deadline = deadline.filter((tx) => {
      tx.deadline--;
      tx.nonce++;
      if (tx.deadline <= 0) {
        deadlineMissing++;
        deadlinealarm++;
        console.log('deadlinealarm');
        return false;
      }
      return true;
    });
    
    const recentTransactions = await fetchRecentTransactions();
    const processedTransactions = processTransactions(recentTransactions);
    fifo.push(...processedTransactions.slice(0, 5 + fifoalarm));
    gasContent.push(...processedTransactions.slice(0, 5 + gasContentalarm));
    deadline.push(...processedTransactions.slice(0, 5 + deadlinealarm));
    console.log('done',i+1,'번째 블록 완료');
    fifoalarm = 0;
    gasContentalarm = 0;
    deadlinealarm = 0;

    await new Promise((resolve) => setTimeout(resolve, INTERVAL));
  }

  console.log("Average gas per block for each algorithm:");
  console.log("FIFO:", fifoGasSum / NUM_BLOCKS);
  console.log("High Gas Content:", gasContentGasSum / NUM_BLOCKS);
  console.log("Shortest Deadline:", deadlineGasSum / NUM_BLOCKS);

  console.log("\nAverage time spent per gas for each algorithm:");
  console.log("FIFO:", fifoTimeSum / fifoGasSum);
  console.log("High Gas Content:", gasContentTimeSum / gasContentGasSum);
  console.log("Shortest Deadline:", deadlineTimeSum / deadlineGasSum);

  console.log("\nNumber of missing transactions for each algorithm:");
  console.log("FIFO:", fifoMissing);
  console.log("High Gas Content:", gasContentMissing);
  console.log("Shortest Deadline:", deadlineMissing);
}

simulateAlgorithms().catch((error) => {
  console.error("Error during simulation:", error);
});

