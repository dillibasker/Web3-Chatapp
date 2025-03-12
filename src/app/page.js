import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { create } from "ipfs-http-client";
import contractABI from "../artifacts/contracts/MessageStorage.sol/DecentralizedChat.json";

const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
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
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(provider);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
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