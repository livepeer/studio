import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Box,
  Button,
  Flex,
  Heading,
  Promo,
  Text,
  useSnackbar,
} from "@livepeer/design-system";

import { Asset } from "@livepeer.studio/api";
import { ArrowRightIcon, CopyIcon } from "@radix-ui/react-icons";
import { useMemo } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

const AssetOverviewTab = ({
  asset,
  onClickEdit,
}: {
  asset?: Asset | null;
  onClickEdit: () => void;
}) => {
  const [openSnackbar] = useSnackbar();

  const metadataStringified = useMemo(
    () => (asset?.meta ? JSON.stringify(asset.meta, null, 4) : ""),
    [asset?.meta]
  );

  return (
    <>
      <Box>
        <Box
          css={{
            borderBottom: "1px solid",
            borderColor: "$neutral6",
            pb: "$2",
            mb: "$7",
            width: "100%",
          }}>
          <Heading size="1" css={{ fontWeight: 500, mb: "$1" }}>
            Decentralized Storage Providers
          </Heading>
        </Box>
        <Accordion type="single" defaultValue="accordion-one">
          <AccordionItem value="accordion-one">
            <AccordionTrigger css={{ color: "$primary12" }}>
              <Text size="3" css={{ color: "inherit" }}>
                IPFS
              </Text>
            </AccordionTrigger>
            <AccordionContent>
              {!asset?.storage?.ipfs?.cid ? (
                <>
                  <Box>
                    <Text variant="gray" size="3" css={{ mb: "$3" }}>
                      Easily replicate your VOD content to IPFS. We host an IPFS
                      node which pins your assets automatically, and provide the
                      CID for portability to other pinning providers.
                    </Text>
                  </Box>

                  <Button
                    onClick={onClickEdit}
                    css={{
                      display: "inline-flex",
                      ai: "center",
                    }}
                    size="2"
                    disabled={Boolean(asset?.status?.phase !== "ready")}
                    variant="primary">
                    <Box css={{ mr: "$1" }}>Upload to IPFS</Box>
                    <ArrowRightIcon />
                  </Button>
                </>
              ) : (
                <>
                  <CopyToClipboard
                    text={`ipfs://${asset.storage.ipfs.cid}`}
                    onCopy={() => openSnackbar("Copied IPFS CID to clipboard")}>
                    <Promo
                      size="2"
                      css={{
                        display: "grid",
                        cursor: "pointer",
                        gridTemplateColumns: "repeat(2, auto)",
                      }}>
                      <Flex>
                        <Box>
                          <Flex align="center">
                            <Text
                              size="2"
                              css={{
                                fontSize: "14px",
                                mr: "$1",
                                fontWeight: 500,
                              }}>
                              Content Hash
                            </Text>
                            <CopyIcon />
                          </Flex>
                          <Text
                            variant="gray"
                            size="2"
                            css={{ mt: "$1", lineHeight: 1.4 }}>
                            ipfs://{asset?.storage?.ipfs?.cid}
                          </Text>
                        </Box>
                      </Flex>
                    </Promo>
                  </CopyToClipboard>
                  {metadataStringified && (
                    <CopyToClipboard
                      text={metadataStringified}
                      onCopy={() =>
                        openSnackbar("Copied metadata to clipboard")
                      }>
                      <Promo
                        size="2"
                        css={{
                          mt: "$2",
                          display: "grid",
                          cursor: "pointer",
                          gridTemplateColumns: "repeat(2, auto)",
                        }}>
                        <Flex>
                          <Box>
                            <Flex align="center">
                              <Text
                                size="2"
                                css={{
                                  fontSize: "14px",
                                  mr: "$1",
                                  fontWeight: 500,
                                }}>
                                Metadata
                              </Text>
                              <CopyIcon />
                            </Flex>
                            <Text
                              variant="gray"
                              size="2"
                              css={{ mt: "$1" }}>
                              {metadataStringified}
                            </Text>
                          </Box>
                        </Flex>
                      </Promo>
                    </CopyToClipboard>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Box>
    </>
  );
};

export default AssetOverviewTab;
