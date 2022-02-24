import { Box } from "@livepeer.com/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { useMetaMask } from "metamask-react";
import { useCallback, useMemo, useState } from "react";
import Web3 from "web3";
import { TransactionConfig } from "web3-core";
import { Contract } from "web3-eth-contract";
import videoNftAbi from "./video-nft.json";

const livepeerNftMinterAddress = "0x69C53E7b8c41bF436EF5a2D81DB759Dc8bD83b5F"; // TODO: Real address here

async function mintNft(
  web3: Web3,
  videoNft: Contract,
  account: string,
  transaction: TransactionConfig,
  logger: (log: JSX.Element | string) => void
) {
  try {
    const nonce = await web3.eth.getTransactionCount(account, "latest");
    const tx = {
      ...transaction,
      from: account,
      nonce,
    };
    logger("Minting...");
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
      logger(
        `NFT minted but failed to find event. Transacton receipt:\n${JSON.stringify(
          receipt,
          null,
          2
        )}`
      );
      return;
    }
    const { tokenId } = event.returnValues;
    const url = `https://opensea.io/assets/matic/${videoNft.options.address}/${tokenId}`;
    logger(
      <>
        Successfully minted token with ID {tokenId}! Check it on{" "}
        <a href={url} target="_blank">
          OpenSea
        </a>
        !
      </>
    );
  } catch (err) {
    let log = `Error during main mint routine: ${err.message}`;
    if ("data" in err) {
      const errData = (err as any).data;
      log += `: ${errData.message || errData.details}`;
    }
    logger(log);
  }
}

const TransactEth = () => {
  const { status, connect, account, chainId, ethereum } = useMetaMask();
  const isMinting = useToggleState();
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
  const addLog = useCallback(
    (log: JSX.Element | string) =>
      setLogs((prev) => [
        ...prev,
        <>
          [{new Date().toLocaleTimeString()}] {log}
        </>,
      ]),
    [setLogs]
  );

  const videoNft = useMemo(
    () => new web3.eth.Contract(videoNftAbi as any, contractAddress),
    [web3, contractAddress]
  );
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

  const onClickMint = useCallback(async () => {
    isMinting.onOn();
    try {
      await mintNft(web3, videoNft, account, transaction, addLog);
    } finally {
      isMinting.onOff();
    }
  }, [status, transaction, web3, videoNft, account, addLog]);

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
            {isMinting.on ? null : (
              <button onClick={onClickMint}>Mint NFT</button>
            )}
          </Box>
        </>
      );
  }
};

export default TransactEth;
