import { useToggleState } from "hooks/use-toggle-state";
import { useMetaMask } from "metamask-react";
import { Container } from "next/app";
import { useCallback, useMemo, useState } from "react";
import { AbstractProvider as MetaMask } from "web3-core";
import Web3 from "web3";

import Guides from "components/Marketing/Guides";
import Spinner from "components/Dashboard/Spinner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Box,
  Button,
  Flex,
  Heading,
  Label,
  Text,
  TextField,
  Tooltip,
} from "@livepeer.com/design-system";
import { Transact as Content } from "content";
import Layout from "layouts/main";

import videoNftAbi from "./video-nft.json";

const polygon = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  rpcUrls: ["https://polygon-rpc.com/"],
  nativeCurrency: { symbol: "MATIC", decimals: 18 },
  blockExplorerUrls: ["https://polygonscan.com"],
  iconUrls: [
    "https://cloudflare-ipfs.com/ipfs/bafkreiduv5pzw233clfjuahv5lkq2xvjomapou7yarik2lynu3bjm2xki4",
  ],
};
const livepeerNftMinterAddress = "0x69C53E7b8c41bF436EF5a2D81DB759Dc8bD83b5F"; // TODO: Real address here

async function mintNft(
  web3: Web3,
  contractAddress: string,
  from: string,
  to: string,
  tokenUri: string,
  logger: (log: JSX.Element | string) => void
) {
  try {
    logger("Started minting process...");
    const videoNft = new web3.eth.Contract(videoNftAbi as any, contractAddress);
    const transaction = {
      to: contractAddress,
      gas: 500000,
      maxPriorityFeePerGas: 39999999987,
      data: videoNft.methods.mint(to, tokenUri).encodeABI(),
    };
    const nonce = await web3.eth.getTransactionCount(from, "latest");
    const tx = {
      ...transaction,
      from,
      nonce,
    };
    const receipt = await web3.eth.sendTransaction(tx);

    let tokenId: string;
    try {
      const events = await videoNft.getPastEvents("Mint", {
        filter: { sender: from },
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      const event = events.find(
        (ev) => ev.transactionHash === receipt.transactionHash
      );
      tokenId = event?.returnValues?.tokenId;
    } catch (err) {
      logger(`Error getting events: ${err}`);
    }
    if (!tokenId) {
      const searchUrl = `https://opensea.io/assets/matic/${videoNft.options.address}?search[sortAscending]=false&search[sortBy]=CREATED_DATE`;
      logger(
        <>
          NFT minted but failed to find token ID. Check last minted NFTs on{" "}
          <a href={searchUrl} target="_blank">
            OpenSea
          </a>
          .
        </>
      );
      return;
    }
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
    let log = `Error during minting process: ${err.message}`;
    if ("data" in err) {
      const errData = (err as any).data;
      log += `: ${errData.message || errData.details}`;
    }
    logger(log);
  }
}

async function switchNetwork(
  ethereum: MetaMask,
  logger: (log: JSX.Element | string) => void
) {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: polygon.chainId }],
    });
    logger("Successfully switched to Polygon network.");
    return;
  } catch (err) {
    // 4902 is the not found error code
    if (err.code !== 4902) {
      logger(`Error switching to Polygon network: ${err.message}`);
      return;
    }
  }

  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [polygon],
    });
    logger("Successfully added Polygon network to MetaMask.");
    return;
  } catch (err) {
    logger(`Error adding Polygon network: ${err.message}`);
  }
}

const TransactEth = () => {
  const { status, connect, account, chainId, ethereum } = useMetaMask();
  const isMinting = useToggleState();
  const web3 = useMemo(() => new Web3(ethereum), [ethereum]);

  const initState = useMemo(() => {
    if (typeof window === "undefined") {
      return {};
    }
    const searchParams = new URLSearchParams(window.location.search);
    return {
      contractAddress:
        searchParams.get("contractAddress") || livepeerNftMinterAddress,
      tokenUri: searchParams.get("tokenUri"),
      recipient: searchParams.get("recipient"),
    };
  }, [typeof window !== "undefined" && window?.location?.search]);
  const [state, setState] = useState(initState);
  type State = typeof state;
  const setStateProp = <T extends keyof State>(prop: T, value: State[T]) => {
    setState({ ...state, [prop]: value });
  };

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

  const onClickMint = useCallback(async () => {
    isMinting.onOn();
    try {
      await mintNft(
        web3,
        state.contractAddress,
        account,
        state.recipient ?? account,
        state.tokenUri,
        addLog
      );
    } finally {
      isMinting.onOff();
    }
  }, [state, web3, account, addLog]);

  const onClickSwitchNetwork = useCallback(() => {
    setLogs([]);
    return switchNetwork(ethereum, addLog);
  }, [ethereum, addLog]);

  return (
    <Layout {...Content.metaData}>
      <Guides backgroundColor="$mauve2" />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <Flex
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
            }}>
            <AlertDialog open={true}>
              <AlertDialogContent
                css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}
                onOpenAutoFocus={(e) => e.preventDefault()}>
                <AlertDialogTitle as={Heading} size="1">
                  Mint a Video NFT
                </AlertDialogTitle>

                <Box
                  css={{ mt: "$3" }}
                  as="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    return onClickMint();
                  }}>
                  <Flex direction="column" gap="2">
                    <Label htmlFor="contractAddress">Contract Address</Label>
                    <Tooltip content="Defaults to Livepeer-owned Video NFT contract.">
                      <TextField
                        size="2"
                        type="text"
                        id="contractAddress"
                        value={
                          state.contractAddress === initState.contractAddress
                            ? ""
                            : state.contractAddress
                        }
                        placeholder={`Livepeer Video NFT (${initState.contractAddress})`}
                        onChange={(e) =>
                          setStateProp(
                            "contractAddress",
                            e.target.value || initState.contractAddress
                          )
                        }
                      />
                    </Tooltip>

                    <Label htmlFor="tokenUri">Token URI</Label>
                    <TextField
                      required={true}
                      autoFocus
                      size="2"
                      type="url"
                      pattern="^ipfs://.+"
                      id="tokenUri"
                      value={state.tokenUri}
                      onChange={(e) => setStateProp("tokenUri", e.target.value)}
                      placeholder="ipfs://..."
                    />
                  </Flex>

                  <AlertDialogDescription
                    as={Text}
                    size="3"
                    variant="gray"
                    css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
                    <Box
                      css={{
                        overflow: "scroll",
                        p: "$4",
                        height: 200,
                        borderRadius: 6,
                      }}>
                      {(() => {
                        switch (status) {
                          case "initializing":
                            return (
                              <div>
                                Synchronisation with MetaMask ongoing...
                              </div>
                            );
                          case "unavailable":
                            return (
                              <div>
                                MetaMask not available. Install it at{" "}
                                <a
                                  href="https://metamask.io/download"
                                  target="_blank">
                                  metamask.io
                                </a>
                              </div>
                            );
                          case "notConnected":
                            return (
                              <div>Connect your MetaMask wallet below.</div>
                            );
                          case "connecting":
                            return <div>Connecting to MetaMask...</div>;
                          default:
                            return (
                              <div>Unknown MetaMask status: ${status}.</div>
                            );
                          case "connected":
                            if (chainId !== polygon.chainId) {
                              return (
                                <div>
                                  Only Polygon network is supported right now.
                                  Click below to switch or add it to MetaMask.
                                </div>
                              );
                            }
                            return (
                              <>
                                <div>
                                  Connected to:
                                  <br /> account: {account}
                                  <br /> chain ID: {chainId}
                                </div>
                                {logs.map((log, idx) => (
                                  <div key={`log-${idx}`}>{log}</div>
                                ))}
                              </>
                            );
                        }
                      })()}
                    </Box>
                  </AlertDialogDescription>

                  <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                    {status === "notConnected" ? (
                      <Button
                        css={{ display: "flex", ai: "center" }}
                        type="button"
                        size="2"
                        disabled={status !== "notConnected"}
                        variant="violet"
                        onClick={connect}>
                        Connect to MetaMask
                      </Button>
                    ) : status === "connected" &&
                      chainId !== polygon.chainId ? (
                      <Button
                        css={{ display: "flex", ai: "center" }}
                        type="button"
                        size="2"
                        variant="violet"
                        onClick={onClickSwitchNetwork}>
                        Switch Network
                      </Button>
                    ) : (
                      <Button
                        css={{ display: "flex", ai: "center" }}
                        type="submit"
                        size="2"
                        disabled={isMinting.on || status !== "connected"}
                        variant="violet">
                        {isMinting.on && (
                          <Spinner
                            css={{
                              color: "$hiContrast",
                              width: 16,
                              height: 16,
                              mr: "$2",
                            }}
                          />
                        )}
                        {isMinting.on ? "Minting..." : "Mint NFT"}
                      </Button>
                    )}
                  </Flex>
                </Box>
              </AlertDialogContent>
            </AlertDialog>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

export default TransactEth;
