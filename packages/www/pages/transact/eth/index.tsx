import { useToggleState } from "hooks/use-toggle-state";
import { useMetaMask } from "metamask-react";
import { Container } from "next/app";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AbstractProvider as MetaMask, TransactionReceipt } from "web3-core";
import { Contract } from "web3-eth-contract";
import Web3 from "web3";

import Guides from "components/Marketing/Guides";
import Spinner from "components/Dashboard/Spinner";
import {
  Link as A,
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

const networks = {
  "0x89": {
    spec: {
      chainId: "0x89",
      chainName: "Polygon Mainnet",
      rpcUrls: ["https://polygon-rpc.com/"],
      nativeCurrency: { symbol: "MATIC", decimals: 18 },
      blockExplorerUrls: ["https://polygonscan.com"],
      iconUrls: [
        "https://cloudflare-ipfs.com/ipfs/bafkreiduv5pzw233clfjuahv5lkq2xvjomapou7yarik2lynu3bjm2xki4",
      ],
    },
    defaultContract: "0x69C53E7b8c41bF436EF5a2D81DB759Dc8bD83b5F", // TODO: Final address here
  },
  "0xa4b1": {
    spec: {
      chainId: "0xa4b1",
      chainName: "Arbitrum One",
      rpcUrls: ["https://arb1.arbitrum.io/rpc"],
      nativeCurrency: { symbol: "AETH", decimals: 18 },
      blockExplorerUrls: ["https://arbiscan.io"],
      iconUrls: [
        "https://cloudflare-ipfs.com/ipfs/bafkreiamd2sujbbc673tljl7hkz66m4fqubqraq3jwnfo6smtmh6afak5i",
      ],
    },
    defaultContract: "0xX", // TODO: Deploy a contract and add address here
  },
} as const;
const defaultNet = networks["0x89"]; // polygon

async function getMintedTokenIdOnce(
  videoNft: Contract,
  sender: string,
  txReceipt: TransactionReceipt
) {
  const events = await videoNft.getPastEvents("Mint", {
    filter: { sender },
    fromBlock: txReceipt.blockNumber,
    toBlock: txReceipt.blockNumber,
  });
  const event = events.find(
    (ev) => ev.transactionHash === txReceipt.transactionHash
  );
  return event?.returnValues?.tokenId as string;
}

async function getMintedTokenId(
  videoNft: Contract,
  sender: string,
  txReceipt: TransactionReceipt,
  logger: (log: JSX.Element | string) => void
) {
  const maxAttempts = 5;
  const retryDelayMs = 5 * 1000;
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  let lastErr: Error | undefined;
  for (let a = 1; a <= maxAttempts; a++) {
    if (a > 1) {
      await sleep(retryDelayMs);
    }
    try {
      const tokenId = await getMintedTokenIdOnce(videoNft, sender, txReceipt);
      if (!tokenId) {
        throw new Error("Missing tokenId");
      }
      return tokenId;
    } catch (err) {
      lastErr = err;
    }
  }
  logger(`Error getting minted token ID: ${lastErr}`);
  return null;
}

async function mintNft(
  web3: Web3,
  contractAddress: string,
  from: string,
  to: string,
  tokenUri: string,
  logger: (log: JSX.Element | string) => void
) {
  try {
    logger("Started mint transaction...");
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

    const tokenId = await getMintedTokenId(videoNft, from, receipt, logger);
    logger(
      <>
        {tokenId
          ? `Successfully minted token with ID ${tokenId} to ${to}! Check it on `
          : `NFT minted but failed to find token ID. Check last minted NFTs on `}
        <Link
          href={
            tokenId
              ? `https://opensea.io/assets/matic/${videoNft.options.address}/${tokenId}`
              : `https://opensea.io/assets?search%5Bquery%5D=${videoNft.options.address}`
          }
          passHref>
          <A target="_blank">OpenSea</A>
        </Link>
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
  chainId: keyof typeof networks,
  logger: (log: JSX.Element | string) => void
) {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
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
      params: [networks[chainId].spec],
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
      contractAddress: searchParams.get("contractAddress"),
      tokenUri: searchParams.get("tokenUri"),
      recipient: searchParams.get("recipient"),
    };
  }, [typeof window !== "undefined" && window?.location?.search]);
  const defaultContractAddress = useMemo<string>(
    () => networks[chainId]?.defaultContract,
    [chainId]
  );
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
        state.contractAddress ?? defaultContractAddress,
        account,
        state.recipient ?? account,
        state.tokenUri,
        addLog
      );
    } finally {
      isMinting.onOff();
    }
  }, [state, web3, defaultContractAddress, account, addLog]);

  const onClickSwitchNetwork = useCallback(() => {
    setLogs([]);
    return switchNetwork(ethereum, defaultNet.spec.chainId, addLog);
  }, [setLogs, ethereum, addLog]);

  const onClickConnect = useCallback(() => {
    setLogs([]);
    return connect();
  }, [setLogs, connect]);

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
                          state.contractAddress === defaultContractAddress
                            ? ""
                            : state.contractAddress
                        }
                        placeholder={`Livepeer Video NFT (${defaultContractAddress})`}
                        onChange={(e) =>
                          setStateProp("contractAddress", e.target.value)
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
                            if (!(chainId in networks)) {
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
                                  Connected to {displayAddr(account)} on chain
                                  ID <code>{parseInt(chainId, 16)}</code>.
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
                        onClick={onClickConnect}>
                        Connect to MetaMask
                      </Button>
                    ) : status === "connected" && !(chainId in networks) ? (
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
