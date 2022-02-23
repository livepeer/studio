import { Box } from "@livepeer.com/design-system";
import { useMetaMask } from "metamask-react";
import { useEffect, useMemo, useState } from "react";
import Web3 from "web3";
import { VideoNft } from "./types/video-nft";
import videoNftAbi from "./types/video-nft.json";

const livepeerNftMinterAddress = "0x69C53E7b8c41bF436EF5a2D81DB759Dc8bD83b5F"; // TODO: Real address here

const TransactEth = () => {
  const { status, connect, account, chainId, ethereum } = useMetaMask();
  const web3 = useMemo(() => new Web3(ethereum), [ethereum]);

  let { contractAddress, tokenUri, recipient } = useMemo(() => {
    if (typeof window === "undefined") {
      return {};
    }
    const searchParams = new URLSearchParams(window.location.search);
    return {
      contractAddress:
        searchParams.get("contractAddress") || livepeerNftMinterAddress,
      tokenUri: searchParams.get("tokenUri"),
      recipient: searchParams.get("recipient") || account,
    };
  }, [typeof window !== "undefined" && window?.location?.search, account]);
  const [logs, setLogs] = useState<JSX.Element[]>([]);
  const addLog = (log: JSX.Element | string) =>
    setLogs((prev) => [...prev, typeof log === "string" ? <>{log}</> : log]);

  const videoNft = useMemo(
    () => new web3.eth.Contract(videoNftAbi as any, contractAddress),
    [web3, contractAddress]
  ) as unknown as VideoNft;
  const transaction = useMemo(() => {
    if (!tokenUri || !recipient) {
      return null;
    }
    return {
      to: contractAddress,
      gas: 500000,
      maxPriorityFeePerGas: 39999999987,
      data: videoNft.methods.mint(recipient, tokenUri).encodeABI(),
    };
  }, [contractAddress, recipient, tokenUri]);

  useEffect(() => {
    if (status !== "connected" || !transaction) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const nonce = await web3.eth.getTransactionCount(account, "latest");
        const tx = {
          ...transaction,
          from: account,
          nonce,
        };
        addLog("Minting...");
        const receipt = await web3.eth.sendTransaction(tx);

        const events = await videoNft.getPastEvents("Mint", {
          filter: { sender: account },
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
        });
        const event = events.find(
          (ev) => ev.transactionHash === receipt.transactionHash
        );
        if (!event) {
          addLog(
            `NFT minted but failed to find event. Transacton receipt:\n${JSON.stringify(
              receipt,
              null,
              2
            )}`
          );
          return;
        }
        const { tokenId } = event.returnValues;
        addLog(
          <>
            Successfully minted token with ID {tokenId}! Check it on{" "}
            <a
              href={`https://opensea.io/assets/matic/${contractAddress}/${tokenId}`}
              target="_blank">
              OpenSea
            </a>
            !
          </>
        );
      })
      .catch((err) => {
        let log = `Error during main mint routine: ${err.message}`;
        if ("data" in err) {
          const errData = (err as any).data;
          log += `: ${errData.message || errData.details}`;
        }
        addLog(log);
      });
  }, [status, account, transaction]);

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
      if (!transaction) {
        return (
          <div>
            Add `?tokenUri=` param with IPFS URL for file. May also include
            `recipient` param to mint NFT for another address.
          </div>
        );
      }
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
            {logs.map((log, idx) => (
              <div key={`log-${idx}`}>{log}</div>
            ))}
          </Box>
        </>
      );
  }
};

export default TransactEth;
