import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "hooks";
import Table, {
  useTableState,
  Fetcher,
  DefaultSortBy,
  sortByToString,
} from "components/Table";
import { useToggleState } from "hooks/use-toggle-state";
import CreateStreamDialog from "./CreateStreamDialog";
import { useRouter } from "next/router";
import ActiveStreamsBadge from "components/ActiveStreamsBadge";
import {
  defaultCreateProfiles,
  filterItems,
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
  StreamsTableData,
} from "./helpers";
import { makeSelectAction, makeCreateAction } from "../Table/helpers";
import TableHeader from "../Table/components/TableHeader";
import TableStateDeleteDialog from "../Table/components/TableStateDeleteDialog";
import { useProjectContext } from "context/ProjectContext";
import StreamFilter from "./StreamFilter";
import { Flex } from "components/ui/flex";
import TypeFilterCard from "components/TypeFilterCard";
import {
  Filter,
  formatFilterItemFromQueryParam,
} from "components/Table/filters";
import { Grid } from "components/ui/grid";

const filterCategory = ["All", "Active", "Unhealthy"];

const StreamsTable = ({
  title = "Streams",
  pageSize = 20,
  tableId,
  userId,
  viewAll,
  hideFilters,
}: {
  title: string;
  pageSize?: number;
  userId: string;
  tableId: string;
  viewAll?: string;
  hideFilters?: boolean;
}) => {
  const router = useRouter();
  const { getStreams, createStream, deleteStream, deleteStreams } = useApi();
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const [filter, setFilter] = useState("all");
  const { state, stateSetter } = useTableState<StreamsTableData>({
    pageSize,
    tableId,
    initialOrder: sortByToString(DefaultSortBy),
  });
  const columns = useMemo(makeColumns, []);
  const { appendProjectId, projectId } = useProjectContext();

  const fetcher: Fetcher<StreamsTableData> = useCallback(
    async (state) =>
      rowsPageFromState(state, userId, getStreams, appendProjectId),
    [userId],
  );

  const onCreateClick = useCallback(
    async (streamName: string) => {
      const newStream = await createStream({
        name: streamName,
        profiles: defaultCreateProfiles,
      });
      await state.invalidate();
      const query = router.query.admin === "true" ? { admin: true } : {};
      await router.push({
        pathname: appendProjectId(`/streams/${newStream.id}`),
        query,
      });
    },
    [createStream, state.invalidate],
  );

  const onSetFilters = (e) => {
    stateSetter.setCursor("");
    stateSetter.setPrevCursors([]);
    stateSetter.setFilters(e);
  };

  useEffect(() => {
    stateSetter.setProjectId(projectId);
  }, [projectId]);

  const handleFilterType = (type: string) => {
    stateSetter.setCursor("");
    stateSetter.setPrevCursors([]);
    const currentFilters = state.filters;

    setFilter(type);
    if (type === "All") {
      console.log("All", currentFilters);
      const newFilters = currentFilters.filter(
        (filter) => filter.id !== "isActive" && filter.id !== "isHealthy",
      );
      stateSetter.setFilters([]);
    } else {
      const filter = [
        {
          id: type === "Active" ? "isActive" : "isHealthy",
          isOpen: true,
          label: type === "Active" ? "Active" : "Unhealthy",
          condition: {
            type: "boolean",
            value: type === "Active" ? true : false,
            labelOn: type === "Active" ? "Active" : "Unhealthy",
            labelOff: type === "Active" ? "Idle" : "Healthy",
          },
        },
      ];

      //@ts-ignore
      stateSetter.setFilters(currentFilters.concat(filter));
    }

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("isActive");
    searchParams.delete("isHealthy");
    if (type !== "All") {
      searchParams.set(
        type === "Active" ? "isActive" : "isHealthy",
        type === "Active" ? "true" : "false",
      );
    }

    router.push({
      query: searchParams.toString(),
    });
  };

  // Initialize filters from queryParams
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    // @ts-ignore
    if (searchParams?.size === 0) {
      setFilter("All");
      stateSetter.setFilters([]);
    }

    const itemsFromQueryParams: Filter[] = filterItems.map((item) => {
      const searchParamValue = searchParams.get(item.id);
      if (searchParamValue === null) return;
      return formatFilterItemFromQueryParam(item, searchParamValue);
    });

    const filters = itemsFromQueryParams.filter((item) => item !== undefined);

    const isActiveItem = filters.find((item) => item.id === "isActive");

    if (isActiveItem) {
      if (isActiveItem.isOpen && isActiveItem.condition.value) {
        setFilter("Active");
      } else {
        setFilter("All");
      }
    }

    stateSetter.setFilters(filters);
  }, [stateSetter, router.query]);

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        filterItems={!viewAll && filterItems}
        viewAll={viewAll}
        initialSortBy={[DefaultSortBy]}
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction(
          "Create livestream",
          createDialogState.onOn,
        )}
        header={
          <>
            <TableHeader title={title}>
              <ActiveStreamsBadge />
            </TableHeader>
            <>
              {!hideFilters && (
                <Grid className="gap-4 my-4 grid-cols-1 md:grid-cols-3">
                  {filterCategory.map((category, index) => (
                    <TypeFilterCard
                      key={category}
                      name={category}
                      value={state?.dataCount[index] || "0"}
                      isActive={filter === category}
                      handleClick={() => handleFilterType(category)}
                    />
                  ))}
                </Grid>
              )}
              {!viewAll && filterItems && (
                <StreamFilter
                  activeFilters={state.filters}
                  onDone={(e) => onSetFilters(e)}
                />
              )}
            </>
          </>
        }
      />

      <TableStateDeleteDialog
        entityName={{ singular: "stream", plural: "streams" }}
        state={state}
        dialogToggleState={deleteDialogState}
        deleteFunction={deleteStream}
        deleteMultipleFunction={deleteStreams}
      />

      <CreateStreamDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={onCreateClick}
      />
    </>
  );
};

export default StreamsTable;
