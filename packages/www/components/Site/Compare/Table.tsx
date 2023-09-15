import { Table } from "@radix-ui/themes";
import { CheckIcon } from "@radix-ui/react-icons";
import { Flex, Box, Text, Status, Badge } from "@livepeer/design-system";

const Check = () => {
  return (
    <Flex
      align="center"
      justify="center"
      css={{
        borderRadius: 1000,
        color: "white",
        display: "flex",
        bc: "$green10",
        width: 19,
        height: 19,
      }}>
      <CheckIcon />
    </Flex>
  );
};
const CompareTable = () => {
  return (
    <Box
      css={{
        ".rt-TableCell": { verticalAlign: "middle" },
        "[data-radix-scroll-area-viewport] > div": {
          minWidth: "950px !important",
          width: "100%",
        },
      }}>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell />
            <Table.ColumnHeaderCell>
              <Flex align="center" gap={2} css={{ fontSize: "$5" }}>
                <Status variant="green" />
                Livepeer Studio
              </Flex>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <Flex align="center" gap={2} css={{ fontSize: "$5" }}>
                <Status variant="red" />
                Mux
              </Flex>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <Flex align="center" gap={2} css={{ fontSize: "$5" }}>
                <Status css={{ bc: "$orange9" }} />
                Cloudflare Stream
              </Flex>
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        {/* Cost */}
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              <Box css={{ fontSize: "$4" }}>Cost</Box>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>
              <Flex gap={1} css={{ mb: "$1" }}>
                <Text>Transcoding (10k mins)</Text>
              </Flex>
              <Flex gap={1} css={{ mb: "$1" }}>
                <Text>Storage (50k mins)</Text>
              </Flex>
              <Flex gap={1} css={{ mb: "$1" }}>
                <Text>Delivery (500k mins)</Text>
              </Flex>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Text>$500</Text>
            </Table.Cell>
            <Table.Cell>
              <Text css={{ gap: "$2", display: "flex", alignItems: "center" }}>
                $1212
                <Badge variant="green">+140%</Badge>
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Text css={{ gap: "$2", display: "flex", alignItems: "center" }}>
                $750 <Badge variant="green">+50%</Badge>
              </Text>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
        {/* Performance */}
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              <Flex direction="column" gap={2}>
                <Box css={{ fontSize: "$4" }}>Performance</Box>
                <Text size={2} css={{ fontStyle: "italic" }}>
                  Based on a controlled-environment test
                </Text>
              </Flex>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Expected Latency</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Text>0.5 - 3s</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>4s</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>0.5 - 3s</Text>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Video Startup Time (TTFF)</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Text>0.2s</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>0.4s</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>0.2s</Text>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Uptime SLA</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
        {/* Key features */}
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              <Box css={{ fontSize: "$4" }}>Key features</Box>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text css={{ maxWidth: 220 }}>
                Decentralized physical infrastructure network
              </Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
            <Table.Cell>—</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Open source with self-host option</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
            <Table.Cell>—</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Embeddable player</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Analytics API & Visualization</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Text>Available at additional cost</Text>
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Transcoding API</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Developer SDKs</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>In-browser Broadcasting</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Access control</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Multistreaming</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Video clipping</Text>
            </Table.RowHeaderCell>
            <Table.Cell>ETA Sept. 2023</Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Thumbnails</Text>
            </Table.RowHeaderCell>
            <Table.Cell>ETA Sept. 2023</Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Captions</Text>
            </Table.RowHeaderCell>
            <Table.Cell>ETA Sept. 2023</Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>
              <Check />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
        {/* Onchain integrations */}
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              <Box css={{ fontSize: "$4" }}>Onchain features</Box>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Decentralized storage integrations</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
            <Table.Cell>—</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Token-gated video</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
            <Table.Cell>—</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>
              <Text>Wallet-based engagement analytics</Text>
            </Table.RowHeaderCell>
            <Table.Cell>
              <Check />
            </Table.Cell>
            <Table.Cell>—</Table.Cell>
            <Table.Cell>—</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default CompareTable;
