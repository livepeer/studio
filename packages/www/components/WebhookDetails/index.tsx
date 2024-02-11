import {
  Text,
  Box,
  Flex,
  Heading,
  Button,
  styled,
  TextField,
  Tooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "react-query";
import { Action } from "../StreamDetails/MultistreamTargetsTable/SaveTargetDialog";
import CreateEditDialog from "../WebhookDialogs/CreateEditDialog";
import {
  Cross1Icon,
  DotsHorizontalIcon,
  Pencil1Icon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import { useApi } from "hooks";
import DeleteDialog from "../WebhookDialogs/DeleteDialog";
import LogsContainer from "./LogsContainer";

const StyledPencil = styled(Pencil1Icon, {
  mr: "$1",
  width: 12,
  height: 12,
});

const StyledDots = styled(DotsHorizontalIcon, {
  width: 15,
  height: 15,
});

type FilterType = "all" | "succeeded" | "failed";

const filters: FilterType[] = ["all", "succeeded", "failed"];

const WebhookDetails = ({ id, data, logs }) => {
  const { deleteWebhook, updateWebhook } = useApi();
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const dialogState = useToggleState();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>(filters[0]);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const invalidateQuery = useCallback(() => {
    return queryClient.invalidateQueries(id);
  }, [queryClient, id]);

  if (!data) return null;

  return (
    <Box css={{ p: "$6", mb: "$8" }}>
      <Flex
        css={{
          width: "100%",
          borderBottom: "1px solid $colors$neutral6",
          gap: "$3",
          fd: "row",
          ai: "center",
          jc: "space-between",
        }}>
        <Box>
          <Heading
            size="2"
            css={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
              ai: "flex-start",
            }}>
            {data.url}
          </Heading>
          <Text
            css={{
              my: "$2",
              color: "$gray11",
            }}>
            {data.name}
          </Text>
        </Box>

        <Flex css={{ ai: "flex-end", fg: "0", fs: "0", pl: "$3" }}>
          <DropdownMenu>
            <Button
              as={DropdownMenuTrigger}
              size={"3"}
              css={{
                backgroundColor: "transparent",
                border: "1px solid",
                borderColor: "$neutral8",
              }}>
              <StyledDots />
            </Button>
            <DropdownMenuContent
              placeholder={"more options"}
              css={{
                border: "1px solid $colors$neutral6",
                p: "$2",
                px: "$0",
                width: "12rem",
                mr: "$9",
                mt: "$1",
              }}>
              <DropdownMenuItem
                onClick={dialogState.onToggle}
                css={{
                  fontSize: "14px",
                  borderBottom: "1px solid",
                  borderColor: "$neutral6",
                  cursor: "pointer",
                  pb: "$1",
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}>
                Edit Webhook
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                css={{
                  fontSize: "14px",
                  mt: "$1",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}>
                Delete Webhook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>

      <Box>
        <Flex
          css={{
            pt: "$3",
            gap: "$3",
            fd: "row",
            ai: "center",
          }}>
          <Flex
            css={{
              borderRight: "1px solid $colors$neutral6",
              pr: "$5",
              gap: "$1",
              fd: "column",
            }}>
            <Text>Listening for</Text>
            <Tooltip
              multiline
              content={data.events.map((event) => (
                <Box key={event}>{event}</Box>
              ))}>
              <Button
                css={{
                  width: "80%",
                  fontWeight: 500,
                }}>
                {data.events.length} events
              </Button>
            </Tooltip>
          </Flex>
          <Flex
            css={{
              borderRight: "1px solid $colors$neutral6",
              pr: "$5",
              pl: "$1",
              gap: "$1",
              fd: "column",
              ai: "flex-start",
            }}>
            <Text>Signing secret</Text>
            <Text
              css={{
                cursor: "pointer",
                fontWeight: 500,
              }}
              variant={"green"}>
              Reveal
            </Text>
          </Flex>
          <Flex
            css={{
              gap: "$1",
              pl: "$1",
              fd: "column",
            }}>
            <Text>ID</Text>
            <Text>{data.id}</Text>
          </Flex>
        </Flex>
      </Box>

      <Filters
        filters={filters}
        activeFilter={activeFilter}
        handleFilterClick={handleFilterClick}
        logs={logs}
      />

      {/* <Search /> */}

      {logs.length > 0 && (
        <LogsContainer data={data} logs={logs} filter={activeFilter} />
      )}

      <DeleteDialog
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        deleting={deleting}
        setDeleting={setDeleting}
        deleteWebhook={async () => deleteWebhook(data.id)}
        invalidateQuery={invalidateQuery}
      />

      <CreateEditDialog
        webhook={data}
        action={Action.Update}
        isOpen={dialogState.on}
        onOpenChange={dialogState.onToggle}
        onSubmit={async ({ events, name, url, sharedSecret }) => {
          delete data.event; // remove deprecated field before updating
          await updateWebhook(data.id, {
            ...data,
            events: events ? events : data.events,
            name: name ? name : data.name,
            url: url ? url : data.url,
            sharedSecret: sharedSecret ?? data.sharedSecret,
          });
          await invalidateQuery();
        }}
      />
    </Box>
  );
};

const Filters = ({ filters, activeFilter, handleFilterClick, logs }) => {
  const totalWebhookLogs = logs?.length;

  const totalSucceededWebhookLogs = logs?.filter(
    (log) => log.response.status === 200
  ).length;

  const totalFailedWebhookLogs = logs?.filter(
    (log) => log.response.status !== 200
  ).length;

  return (
    <Flex
      css={{
        my: "$5",
        gap: "$3",
      }}>
      {filters.map((filter) => (
        <Box
          onClick={() => handleFilterClick(filter)}
          css={{
            px: "$3",
            py: "$2",
            height: "100%",
            border: activeFilter === filter ? "2px solid" : "1px solid",
            borderColor: activeFilter === filter ? "$blue11" : "$neutral8",
            width: "20%",
            borderRadius: "$3",
          }}>
          <Text
            css={{
              fontSize: "$3",
              fontWeight: activeFilter === filter ? 500 : 400,
              mb: "$1",
              color: activeFilter === filter ? "$blue11" : "$neutral9",
              textTransform: "capitalize",
            }}>
            {filter}
          </Text>
          <Text
            css={{
              fontWeight: 500,
              fontSize: "$3",
              color: activeFilter === filter && "$blue11",
            }}>
            {filter === "all"
              ? totalWebhookLogs
              : filter === "succeeded"
              ? totalSucceededWebhookLogs
              : totalFailedWebhookLogs}
          </Text>
        </Box>
      ))}
    </Flex>
  );
};

const Search = () => {
  return (
    <Flex
      css={{
        mb: "$5",
        gap: "$3",
      }}
      direction={"row"}>
      <DropdownMenu>
        <Flex
          as={DropdownMenuTrigger}
          align={"center"}
          gap={2}
          css={{
            p: "$1",
            px: "$3",
            border: "1px dashed",
            fontSize: "$2",
            borderRadius: "20px",
            backgroundColor: "transparent",
            borderColor: "$neutral8",
            color: "$neutral9",
          }}>
          <PlusCircledIcon />
          Resource ID
        </Flex>
        <DropdownMenuContent
          placeholder={"more options"}
          css={{
            border: "1px solid $colors$neutral6",
            p: "$2",
            backgroundColor: "white",
            ml: "$10",
            width: "15rem",
            mt: "$2",
          }}>
          <TextField
            css={{
              p: "$3",
              pl: "$2",
            }}
            placeholder="Resource ID"
          />
          <Flex
            css={{
              jc: "flex-end",
              mt: "$2",
            }}>
            <Button
              css={{
                fontWeight: 500,
              }}>
              Search
            </Button>
          </Flex>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
};

export default WebhookDetails;
