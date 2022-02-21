import { Box } from "@livepeer.com/design-system";
import { useMetaMask } from "metamask-react";
import { useEffect, useMemo, useState } from "react";
import Web3 from "web3";
import minterAbi from "./minter-abi.json";

const livepeerNftMinterAddress = "0x11b145EBc404011EdC17d957e204051DBe04b971"; // TODO: Real address here

const parseTransaction = (value: string) => {
  try {
    value = decodeURIComponent(value);
    value = Buffer.from(value).toString("base64");
    return JSON.parse(value);
  } catch (err) {
    console.error("Failed to parse transaction", err);
    return null;
  }
};

const TransactEth = () => {
  const { status, connect, account, chainId, ethereum } = useMetaMask();
  const web3 = useMemo(() => new Web3(ethereum), [ethereum]);

  let { inputTransaction, contractAddress, tokenUri, recipient } =
    useMemo(() => {
      if (typeof window === "undefined") {
        return {};
      }
      const searchParams = new URLSearchParams(window.location.search);
      return {
        inputTransaction: parseTransaction(searchParams.get("transaction")),
        contractAddress:
          searchParams.get("contractAddress") || livepeerNftMinterAddress,
        tokenUri: searchParams.get("tokenUri"),
        recipient: searchParams.get("recipient") || account,
      };
    }, [typeof window !== "undefined" && window?.location?.search, account]);
  const [logs, setLogs] = useState<string[]>([]);

  const transaction = useMemo(() => {
    if (inputTransaction) {
      return inputTransaction;
    }
    if (tokenUri && recipient) {
      const nftContract = new web3.eth.Contract(
        minterAbi as any,
        contractAddress
      );
      return {
        to: contractAddress,
        gas: 500000,
        maxPriorityFeePerGas: 39999999987,
        data: nftContract.methods.mint(recipient, tokenUri).encodeABI(),
      };
    }
    return null;
  }, [inputTransaction, contractAddress, recipient, tokenUri]);

  useEffect(() => {
    if (status !== "connected" || !transaction) return;
    Promise.resolve().then(async () => {
      const nonce = await web3.eth.getTransactionCount(account, "latest");
      setLogs([...logs, `Got nonce: ${nonce}`]);

      const tx = {
        ...transaction,
        from: account,
        nonce,
      };
      const receipt = await web3.eth.sendTransaction(tx);
      setLogs([...logs, `Transaction receipt: ${JSON.stringify(receipt)}`]);
    });
  }, [status, transaction]);

  if (!transaction) {
    return (
      <div>
        Add `?nftUrl=` param with IPFS URL for file. May also include `to` param
        to mint NFT for another address.
      </div>
    );
  }
  switch (status) {
    case "initializing":
      return <div>Synchronisation with MetaMask ongoing...</div>;
    case "unavailable":
      return <div>MetaMask not available :(</div>;
    case "notConnected":
      return <button onClick={connect}>Connect to MetaMask</button>;
    case "connecting":
      return <div>Connecting...</div>;
    default:
      return <div>Unknown MetaMask status: ${status}.</div>;
    case "connected":
      return (
        <>
          <Box
            css={{
              overflow: "scroll",
              p: "$4",
              height: 300,
              borderRadius: 6,
            }}>
            <div>
              Connected account {account} on chain ID {chainId}
            </div>
            {logs.map((log) => (
              <div>{log}</div>
            ))}
          </Box>
        </>
      );
  }
};

export default TransactEth;
