/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState, useMemo } from "react";
import { useApi } from "../../hooks";
import {
  Container,
  Box,
  Button,
  Flex,
  Grid,
  Input,
} from "@theme-ui/components";
import Modal from "../Modal";
import { Checkbox } from "../Table";
import CommonAdminTable from "../CommonAdminTable";

const ROWS_PER_PAGE = 25;

function dispUrl(url?: string): string {
  if (url && url.length > 30) {
    return `${url.substr(0, 10)}...${url.substring(url.length - 20)}`;
  }
  return url;
}

const AdminObjectStoreTable = ({ id }: { id: string }) => {
  const [message, setMessage] = useState("");
  const [objectStoreName, setObjectStoreName] = useState("");
  const [objectStoreUrl, setObjectStoreUrl] = useState("");
  const [objectStorePubUrl, setObjectStorePubUrl] = useState("");

  const [createModal, setCreateModal] = useState(false);
  const [selectedObjectStore, setSelectedObjectStore] = useState(null);
  const [objectStores, setObjectStores] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [lastCursor, setLastCursor] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  const [lastFilters, setLastFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const { getObjectStore, createObjectStore, disableObjectStore } = useApi();

  const columns: any = useMemo(
    () => [
      {
        Header: "User Name",
        accessor: "user.email",
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Url",
        accessor: "url",
        Cell: (cell) => {
          return <Box>{dispUrl(cell.value)}</Box>;
        },
      },
      {
        Header: "Public URL",
        accessor: "publicUrl",
      },
      {
        Header: "Disabled",
        accessor: "disabled",
        Cell: (cell) => {
          return <Checkbox value={cell.value} />;
        },
      },
      {
        Header: "Created",
        accessor: "createdAt",
      },
    ],
    [nextCursor, lastFilters]
  );

  const filtersDesc = useMemo(
    () => [
      { id: "user.email", placeholder: "user's email" },
      { id: "name", placeholder: "name" },
      { id: "url", placeholder: "url" },
      { id: "publicUrl", placeholder: "public url" },
    ],
    []
  );

  const fetchData = ({ order, cursor, filters }, refetch: boolean = false) => {
    setLoading(true);
    if (!refetch) {
      setLastCursor(cursor);
      setLastFilters(filters);
      setLastOrder(order);
    }
    getObjectStore(undefined, order, filters, ROWS_PER_PAGE, cursor)
      .then((result) => {
        const [hooks, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(hooks)) {
          setLoadingError("");
          setNextCursor(nextCursor);
          setObjectStores(hooks);
        } else {
          const errors = JSON.stringify(hooks["errors"] || resp.statusText);
          setLoadingError(errors);
          console.error(errors);
        }
      })
      .catch((err) => {
        setLoadingError(`${err}`);
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const refetch = () => {
    fetchData(
      { order: lastOrder, cursor: lastCursor, filters: lastFilters },
      true
    );
  };

  const close = () => {
    setCreateModal(false);
    setSelectedObjectStore(null);
    setObjectStoreName("");
    setObjectStoreUrl("");
    setObjectStorePubUrl("");
  };

  const doCreateObjectStore = () => {
    close();
    if (!objectStoreUrl) {
      setMessage("Object store URL must be specified");
      return;
    }
    if (!objectStoreName) {
      setMessage("Object store name must be specified");
      return;
    }
    setMessage("Creating object store");
    createObjectStore({
      name: objectStoreName,
      url: objectStoreUrl,
      publicUrl: objectStorePubUrl,
    })
      .then(() => {
        setMessage("Object store created");
        refetch();
      })
      .catch((e) => setMessage(`Error: ${e}`));
  };
  const disableOS = (id: string, disabled: boolean) => {
    setSelectedObjectStore(null);
    disableObjectStore(id, disabled)
      .then(() => {
        refetch();
      })
      .catch((e) => setMessage(`Error: ${e}`));
  };

  return (
    <Container
      id={id}
      sx={{
        mb: 5,
        mt: 2,
      }}>
      {createModal && (
        <Modal onClose={close} maxWidth="1000px">
          <h3>Create object store</h3>
          <Grid
            gap={2}
            columns={[3, "1fr 3fr 3fr"]}
            sx={{
              alignItems: "center",
            }}>
            <Box>Name</Box>
            <Box>
              <Input
                autoFocus={true}
                label="Object store name"
                value={objectStoreName}
                sx={{
                  border: "white",
                  borderBottom: "2px solid black",
                  borderRadius: "0px",
                }}
                onChange={(e) => setObjectStoreName(e.target.value)}
                placeholder="new object store name"></Input>
            </Box>
            <Box>(a-z, A-Z, 0-9, -, _, ~ only)</Box>
            <Box>URL</Box>
            <Box>
              <Input
                autoFocus={true}
                label="Object store url"
                value={objectStoreUrl}
                sx={{
                  border: "white",
                  borderBottom: "2px solid black",
                  borderRadius: "0px",
                }}
                onChange={(e) => setObjectStoreUrl(e.target.value)}
                placeholder="gs://bucket"></Input>
            </Box>
            <Box>(a-z, A-Z, 0-9, -, _, ~ only)</Box>
            <Box>Public URL</Box>
            <Box>
              <Input
                autoFocus={true}
                label="Public object store url"
                value={objectStorePubUrl}
                sx={{
                  border: "white",
                  borderBottom: "2px solid black",
                  borderRadius: "0px",
                }}
                onChange={(e) => setObjectStorePubUrl(e.target.value)}
                placeholder="https://public.domain"></Input>
            </Box>
            <Box>(a-z, A-Z, 0-9, -, _, ~ only)</Box>
          </Grid>

          <Flex sx={{ justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="outlineSmall"
              onClick={close}
              sx={{ mr: 2, mt: 2 }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primarySmall"
              onClick={doCreateObjectStore}>
              Create
            </Button>
          </Flex>
        </Modal>
      )}
      <Box sx={{ mt: "2em" }}>{message}</Box>
      <CommonAdminTable
        onRowSelected={setSelectedObjectStore}
        setNextCursor={setNextCursor}
        onFetchData={fetchData}
        loading={loading}
        data={objectStores}
        nextCursor={nextCursor}
        rowsPerPage={ROWS_PER_PAGE}
        err={loadingError}
        columns={columns}
        filtersDesc={filtersDesc}>
        <Button
          variant="outlineSmall"
          sx={{ margin: 2 }}
          onClick={() => {
            setMessage("");
            setCreateModal(true);
          }}>
          Create
        </Button>
        <Button
          variant="primarySmall"
          aria-label="Disable object store button"
          disabled={
            !selectedObjectStore ||
            (selectedObjectStore && selectedObjectStore.disabled)
          }
          sx={{ margin: 2, mb: 4 }}
          onClick={() =>
            selectedObjectStore && disableOS(selectedObjectStore.id, true)
          }>
          Disable
        </Button>
        <Button
          variant="primarySmall"
          aria-label="Enable object store button"
          disabled={
            !selectedObjectStore ||
            (selectedObjectStore && !selectedObjectStore.disabled)
          }
          sx={{ margin: 2, mb: 4 }}
          onClick={() =>
            selectedObjectStore && disableOS(selectedObjectStore.id, false)
          }>
          Enable
        </Button>
      </CommonAdminTable>
    </Container>
  );
};

export default AdminObjectStoreTable;
