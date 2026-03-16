import { Box, Flex } from "@livepeer/design-system";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Dispatch, SetStateAction } from "react";
import { Button } from "components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";

export type AssetChildrenHeadingBoxProps = {
  children: React.ReactNode;
  activeTab: "Overview" | "Event Logs";
  setSwitchTab: Dispatch<SetStateAction<"Overview" | "Event Logs">>;
  setEditAssetDialogOpen: Dispatch<SetStateAction<boolean>>;
  onDeleteAsset: () => void;
};

const AssetChildrenHeadingBox = ({
  children,
  activeTab,
  setSwitchTab,
  setEditAssetDialogOpen,
  onDeleteAsset,
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
              cursor: "default",
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
              cursor: "default",
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                Actions
                <Box as={ChevronDownIcon} css={{ ml: "$1" }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              placeholder="dropdown-menu-content"
              align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setEditAssetDialogOpen(true)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onDeleteAsset} color="red">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Box>
      </Flex>
      <Box css={{ py: "$2" }}>{children}</Box>
    </Box>
  );
};

export default AssetChildrenHeadingBox;
