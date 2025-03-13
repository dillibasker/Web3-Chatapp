"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";

// Dynamic import to prevent SSR issues with IPFS
const createIpfsClient = async () => {
  const { create } = await import("ipfs-http-client");
  return create({ host: "ipfs.infura.io", port: 5001, protocol: "https" });
};

const contractAddress = "0xe406f7A0a5A7821712B0173fe9E220d95ba6e7BF";
const contractABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: true, internalType: "address", name: "receiver", type: "address" },
      { indexed: false, internalType: "string", name: "ipfsHash", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "MessageSent",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "_receiver", type: "address" },
      { internalType: "string", name: "_ipfsHash", type: "string" },
    ],
    name: "sendMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMessages",
    outputs: [
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "string", name: "ipfsHash", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct DecentralizedChat.Message[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [ipfs, setIpfs] = useState(null);

  useEffect(() => {
    const init = async () => {
		if (window.ethereum) {
			try {
				const provider = new ethers.BrowserProvider(window.ethereum);
				setProvider(provider);
				
				// Check if MetaMask is already connected
				const accounts = await provider.listAccounts();
				if (accounts.length === 0) {
					const requestedAccounts = await provider.send("eth_requestAccounts", []);
					setAccount(requestedAccounts[0]);
				} else {
					setAccount(accounts[0]);
				}
	
				const signer = await provider.getSigner();
				const contract = new ethers.Contract(contractAddress, contractABI, signer);
				setContract(contract);
				loadMessages(contract);
			} catch (error) {
				console.error("Error initializing provider:", error);
			}
		} else {
			console.error("Ethereum wallet not found");
		}
	};
	
    init();
  }, []);

  const loadMessages = async (contract) => {
    const msgs = await contract.getMessages();
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!message || !receiver || !ipfs) return;
    const added = await ipfs.add(message);
    const tx = await contract.sendMessage(receiver, added.path);
    await tx.wait();
    loadMessages(contract);
    setMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-indigo-400 mb-4">Decentralized Chat</h1>
      <p className="mb-4 bg-gray-800 p-2 rounded-lg">
        {account ? `Connected: ${account}` : "Not Connected"}
      </p>

      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <input
          type="text"
          placeholder="Receiver Address"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          className="w-full p-2 mb-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <textarea
          placeholder="Enter message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 mb-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={sendMessage}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-all"
        >
          Send
        </button>
      </div>

      <h2 className="text-2xl font-semibold mt-6">Messages</h2>
      <ul className="w-full max-w-md bg-gray-800 p-4 rounded-lg mt-4 shadow-lg space-y-3">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <li key={index} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
              <p>
                <span className="text-indigo-300">From:</span> {msg.sender}
              </p>
              <p>
                <span className="text-indigo-300">To:</span> {msg.receiver}
              </p>
              <p>
                <span className="text-indigo-300">Message Hash:</span> {msg.ipfsHash}
              </p>
            </li>
          ))
        ) : (
          <p className="text-gray-400">No messages yet.</p>
        )}
      </ul>
    </div>
  );
}
