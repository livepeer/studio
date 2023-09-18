import { CheckIcon } from "@radix-ui/react-icons";
import {
  Flex,
  Box,
  Text,
  Status,
  Badge,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@livepeer/design-system";

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
        position: "relative",
        overflow: "scroll",
      }}>
      <Table
        css={{
          minWidth: "950px !important",
          width: "100%",
        }}>
        <Thead>
          <Tr>
            <Th />
            <Th>
              <Flex
                align="center"
                gap={2}
                css={{ color: "black", fontSize: "$5", fontWeight: 600 }}>
                <Status variant="green" />
                Livepeer Studio
              </Flex>
            </Th>
            <Th>
              <Flex
                align="center"
                gap={2}
                css={{ color: "black", fontSize: "$5", fontWeight: 600 }}>
                <Status variant="red" />
                Mux
              </Flex>
            </Th>
            <Th>
              <Flex
                align="center"
                gap={2}
                css={{ color: "black", fontSize: "$5", fontWeight: 600 }}>
                <Status css={{ bc: "$orange9" }} />
                Cloudflare Stream
              </Flex>
            </Th>
          </Tr>
        </Thead>
        {/* Cost */}
        <Thead>
          <Tr>
            <Th>
              <Box css={{ fontWeight: 500, color: "black", fontSize: "$4" }}>
                Cost
              </Box>
            </Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Th>
              <Flex gap={1} css={{ mb: "$1" }}>
                <Text>Transcoding (10k mins)</Text>
              </Flex>
              <Flex gap={1} css={{ mb: "$1" }}>
                <Text>Storage (50k mins)</Text>
              </Flex>
              <Flex gap={1} css={{ mb: "$1" }}>
                <Text>Delivery (500k mins)</Text>
              </Flex>
            </Th>
            <Td>
              <Text>$500</Text>
            </Td>
            <Td>
              <Text css={{ gap: "$2", display: "flex", alignItems: "center" }}>
                $1212
                <Badge variant="green">+140%</Badge>
              </Text>
            </Td>
            <Td>
              <Text css={{ gap: "$2", display: "flex", alignItems: "center" }}>
                $750 <Badge variant="green">+50%</Badge>
              </Text>
            </Td>
          </Tr>
        </Tbody>
        {/* Performance */}
        <Thead>
          <Tr>
            <Th>
              <Flex direction="column" gap={2}>
                <Box css={{ fontWeight: 500, color: "black", fontSize: "$4" }}>
                  Performance
                </Box>
                <Text size={2} css={{ fontStyle: "italic" }}>
                  Based on a controlled-environment test
                </Text>
              </Flex>
            </Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Th>
              <Text>Expected Latency</Text>
            </Th>
            <Td>
              <Text>0.5 - 3s</Text>
            </Td>
            <Td>
              <Text>4s</Text>
            </Td>
            <Td>
              <Text>0.5 - 3s</Text>
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Video Startup Time (TTFF)</Text>
            </Th>
            <Td>
              <Text>0.2s</Text>
            </Td>
            <Td>
              <Text>0.4s</Text>
            </Td>
            <Td>
              <Text>0.2s</Text>
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Uptime SLA</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
          </Tr>
        </Tbody>
        {/* Key features */}
        <Thead>
          <Tr>
            <Th>
              <Box css={{ fontWeight: 500, color: "black", fontSize: "$4" }}>
                Key features
              </Box>
            </Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Th>
              <Text css={{ maxWidth: 220 }}>
                Decentralized physical infrastructure network
              </Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
            <Td>—</Td>
          </Tr>

          <Tr>
            <Th>
              <Text>Open source with self-host option</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
            <Td>—</Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Embeddable player</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
            <Td>
              <Check />
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Analytics API & Visualization</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>
              <Text>Available at additional cost</Text>
            </Td>
            <Td>
              <Check />
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Transcoding API</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Developer SDKs</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>In-browser Broadcasting</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
            <Td>
              <Check />
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Access control</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
          </Tr>

          <Tr>
            <Th>
              <Text>Multistreaming</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Video clipping</Text>
            </Th>
            <Td>ETA Sept. 2023</Td>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Thumbnails</Text>
            </Th>
            <Td>ETA Sept. 2023</Td>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Captions</Text>
            </Th>
            <Td>ETA Sept. 2023</Td>
            <Td>
              <Check />
            </Td>
            <Td>
              <Check />
            </Td>
          </Tr>
        </Tbody>
        {/* Onchain integrations */}
        <Thead>
          <Tr>
            <Th>
              <Box css={{ fontWeight: 500, color: "black", fontSize: "$4" }}>
                Onchain features
              </Box>
            </Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Th>
              <Text>Decentralized storage integrations</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
            <Td>—</Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Token-gated video</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
            <Td>—</Td>
          </Tr>
          <Tr>
            <Th>
              <Text>Wallet-based engagement analytics</Text>
            </Th>
            <Td>
              <Check />
            </Td>
            <Td>—</Td>
            <Td>—</Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
};

export default CompareTable;
