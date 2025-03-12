"use client";

import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { create } from "ipfs-http-client";
 
const contractAddress = "0xe406f7A0a5A7821712B0173fe9E220d95ba6e7BF";
const contractABI=[
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "MessageSent",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_receiver",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_ipfsHash",
				"type": "string"
			}
		],
		"name": "sendMessage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMessages",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "receiver",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "ipfsHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct DecentralizedChat.Message[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "messages",
		"outputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userMessageCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
const ipfs = create({ host: "ipfs.infura.io", port: 5001, protocol: "https" });

export default function Home() {
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [messages, setMessages] = useState([]);
    const [receiver, setReceiver] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const provider = new ethers.providers.BrowserProvider(window.ethereum);
                setProvider(provider);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(contractAddress, contractABI, signer);
                setContract(contract);
                const accounts = await provider.send("eth_requestAccounts", []);
                setAccount(accounts[0]);
                loadMessages(contract);
            }
        };
        init();
    }, []);

    const loadMessages = async (contract) => {
        const msgs = await contract.getMessages();
        setMessages(msgs);
    };

    const sendMessage = async () => {
        if (!message || !receiver) return;
        const added = await ipfs.add(message);
        const tx = await contract.sendMessage(receiver, added.path);
        await tx.wait();
        loadMessages(contract);
        setMessage("");
    };

    return (
        <div>
            <h1>Decentralized Chat</h1>
            <p>Connected: {account}</p>
            <input type="text" placeholder="Receiver Address" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
            <textarea placeholder="Enter message" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
            <h2>Messages</h2>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>
                        <p>From: {msg.sender}</p>
                        <p>To: {msg.receiver}</p>
                        <p>Message Hash: {msg.ipfsHash}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}