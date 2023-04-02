import { Box, Flex, Button } from "@livepeer/design-system";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Dispatch, SetStateAction } from "react";

export type AssetChildrenHeadingBoxProps = {
  children: React.ReactNode;
  activeTab: "Overview" | "Event Logs";
  setSwitchTab: Dispatch<SetStateAction<"Overview" | "Event Logs">>;
  setEditAssetDialogOpen: Dispatch<SetStateAction<boolean>>;
};

const AssetChildrenHeadingBox = ({
  children,
  activeTab,
  setSwitchTab,
  setEditAssetDialogOpen,
}: AssetChildrenHeadingBoxProps) => {
  return (
    <Box css={{ flexGrow: 1, ml: "$8" }}>
      <Flex
        justify="between"
        css={{
          borderBottom: "1px solid",
          borderColor: "$neutral6",
          mb: "$4",
          width: "100%",
        }}>
        <Box css={{ display: "flex" }}>
          <Box
            as="div"
            onClick={() => setSwitchTab("Overview")}
            css={{
              pb: "$2",
              width: "100%",
              cursor: "pointer",
              textDecoration: "none",
              borderBottom: "2px solid",
              borderColor: activeTab === "Overview" ? "$green9" : "transparent",
              mr: "$5",
              "&:hover": {
                textDecoration: "none",
              },
            }}>
            Overview
          </Box>

          <Box
            as="div"
            onClick={() => setSwitchTab("Event Logs")}
            css={{
              textDecoration: "none",
              pb: "$2",
              width: "100%",
              cursor: "pointer",
              borderBottom: "2px solid",
              borderColor:
                activeTab === "Event Logs" ? "$green9" : "transparent",
              whiteSpace: "nowrap",
              "&:hover": {
                textDecoration: "none",
              },
            }}>
            Event Logs
          </Box>
        </Box>
        <Box css={{ position: "relative", top: "-8px" }}>
          <Button
            size="2"
            onClick={() => setEditAssetDialogOpen(true)}
            variant="primary">
            <Box
              as={Pencil1Icon}
              css={{
                mr: "$1",
              }}
            />
            Edit Asset
          </Button>
        </Box>
      </Flex>
      <Box css={{ py: "$2" }}>{children}</Box>
    </Box>
  );
};

export default AssetChildrenHeadingBox;
