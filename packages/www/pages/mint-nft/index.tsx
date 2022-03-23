import { useToggleState } from "hooks/use-toggle-state";
import { useMetaMask } from "metamask-react";
import { Container } from "next/app";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";

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
import { MintNFT as Content } from "content";
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
    defaultContract: "0x69C53E7b8c41bF436EF5a2D81DB759Dc8bD83b5F",
    openseaBaseUrl: "https://opensea.io",
    openseaNetworkName: "matic",
  },
  "0x13881": {
    spec: {
      chainId: "0x13881",
      chainName: "Polygon Testnet",
      rpcUrls: ["https://matic-mumbai.chainstacklabs.com"],
      nativeCurrency: { symbol: "MATIC", decimals: 18 },
      blockExplorerUrls: ["https://mumbai.polygonscan.com"],
    },
    defaultContract: "0xA4E1d8FE768d471B048F9d73ff90ED8fcCC03643",
    openseaBaseUrl: "https://testnets.opensea.io",
    openseaNetworkName: "mumbai",
  },
} as const;

type SupportedChainIDs = keyof typeof networks;
type NetworkInfo = typeof networks[SupportedChainIDs];

async function mintNft(
  provider: ethers.providers.Web3Provider,
  contractAddress: string,
  to: string,
  tokenUri: string,
  logger: (log: JSX.Element | string) => void,
  network: NetworkInfo
) {
  try {
    logger("Started mint transaction...");
    const signer = provider.getSigner();
    const videoNft = new ethers.Contract(
      contractAddress,
      videoNftAbi,
      provider
    ).connect(signer);

    const selfAddr = await signer.getAddress();
    let cancelTokenId: () => void;
    const tokenIdPromise = new Promise<number | null>((resolve, reject) => {
      const handler = (f, t, mintedUri: string, tokenId: ethers.BigNumber) => {
        if (mintedUri !== tokenUri) return;
        videoNft.off(filter, handler);
        resolve(tokenId.toNumber());
      };
      cancelTokenId = () => {
        videoNft.off(filter, handler);
        resolve(null);
      };
      const filter = videoNft.filters.Mint(selfAddr, selfAddr, null, null);
      videoNft.once(filter, handler);
    });

    const tx = (await videoNft.mint(to, tokenUri)) as ethers.Transaction;
    logger(
      <>
        Mint transaction sent:{" "}
        <Link
          href={`${network.spec.blockExplorerUrls[0]}/tx/${tx.hash}`}
          passHref>
          <A target="_blank">{displayAddr(tx.hash)}</A>
        </Link>
      </>
    );
    setTimeout(() => {
      cancelTokenId();
    }, 60 * 1000);

    const tokenId = await tokenIdPromise;
    logger(
      <>
        {tokenId ? (
          <>
            Successfully minted token <code>{tokenId}</code> to{" "}
            {displayAddr(to)}! Check it on{" "}
          </>
        ) : (
          `NFT minted but failed to find token ID. Check last minted NFTs on `
        )}
        <Link
          href={
            tokenId
              ? `${network.openseaBaseUrl}/assets/${network.openseaNetworkName}/${videoNft.address}/${tokenId}`
              : `${network.openseaBaseUrl}/assets?search%5Bquery%5D=${videoNft.address}`
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

const displayAddr = (str: string) => (
  <code>
    {str.slice(0, 5)}…{str.slice(-4)}
  </code>
);

async function switchNetwork(
  ethereum: any,
  chainId: SupportedChainIDs,
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

export default function MintNFT() {
  const { status, connect, account, chainId, ethereum } = useMetaMask();
  const isMinting = useToggleState();
  const provider = useMemo(
    () => (ethereum ? new ethers.providers.Web3Provider(ethereum) : null),
    [ethereum, chainId]
  );

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
        provider,
        state.contractAddress ?? defaultContractAddress,
        state.recipient ?? account,
        state.tokenUri,
        addLog,
        networks[chainId]
      );
    } finally {
      isMinting.onOff();
    }
  }, [state, provider, defaultContractAddress, account, addLog, chainId]);

  const onClickSwitchNetwork = (chainId: SupportedChainIDs) => () => {
    setLogs([]);
    return switchNetwork(ethereum, chainId, addLog);
  };

  const onClickConnect = useCallback(() => {
    setLogs([]);
    return connect();
  }, [setLogs, connect]);

  return (
    <Layout {...Content.metaData} css={{ minHeight: "100vh" }}>
      <Guides backgroundColor="$mauve2" />
      <Box css={{ position: "relative", flex: 1 }}>
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
                    <Label htmlFor="contractAddress">
                      Contract Address (optional)
                    </Label>
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
                        disabled={
                          isMinting.on ||
                          status !== "connected" ||
                          !(chainId in networks)
                        }
                        placeholder={
                          !defaultContractAddress
                            ? "Unsupported network"
                            : `Livepeer Video NFT (${defaultContractAddress})`
                        }
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
                      disabled={isMinting.on || !!initState.tokenUri}
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
                                <Box css={{ mb: "$2" }}>
                                  Connected to {displayAddr(account)} on{" "}
                                  {networks[chainId].spec.chainName} (
                                  <code>{parseInt(chainId, 16)}</code>)
                                </Box>
                                {logs.map((log, idx) => (
                                  <Box key={`log-${idx}`}>{log}</Box>
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
                      <>
                        <Button
                          css={{ display: "flex", ai: "center" }}
                          type="button"
                          size="2"
                          variant="violet"
                          onClick={onClickSwitchNetwork("0x13881")}>
                          Polygon Testnet
                        </Button>
                        <Button
                          css={{ display: "flex", ai: "center" }}
                          type="button"
                          size="2"
                          variant="violet"
                          onClick={onClickSwitchNetwork("0x89")}>
                          Polygon Mainnet
                        </Button>
                      </>
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
}
