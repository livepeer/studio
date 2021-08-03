/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState, useMemo } from "react";
import { useApi } from "hooks";
import {
  Container,
  Box,
  Button,
  Flex,
  Grid,
  Input,
} from "@theme-ui/components";
import Modal from "components/Admin/Modal";
import { Checkbox } from "components/Admin/Table";
import CommonAdminTable from "components/Admin/CommonAdminTable";

const ROWS_PER_PAGE = 25;

type DeleteWebhookModalProps = {
  name: string;
  onClose: Function;
  onDelete: Function;
};

const DeleteWebhookModal = ({
  name,
  onClose,
  onDelete,
}: DeleteWebhookModalProps) => {
  return (
    <Modal onClose={onClose}>
      <h3>Are you sure?</h3>
      <p>Are you sure you want to delete webhook "{name}"?</p>
      <p>Deleting a webhook cannot be undone.</p>
      <Flex sx={{ justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="outlineSmall"
          onClick={onClose}
          sx={{ mr: 2 }}>
          Cancel
        </Button>
        <Button type="button" variant="primarySmall" onClick={onDelete}>
          Delete
        </Button>
      </Flex>
    </Modal>
  );
};

const AdminWebhookTable = ({ id }: { id: string }) => {
  const [message, setMessage] = useState("");
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [blocking, setBlocking] = useState(true);

  const [deleteModal, setDeleteModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [lastCursor, setLastCursor] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  const [lastFilters, setLastFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const { getWebhooks, createWebhook, deleteWebhook, getUsers } = useApi();

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
      },
      {
        Header: "Blocking",
        accessor: "blocking",
        Cell: (cell) => {
          return <Checkbox value={cell.value} />;
        },
      },
      {
        Header: "Created",
        accessor: "createdAt",
      },
      {
        Header: "Status",
        accessor: "deleted",
        Cell: (cell) => {
          return cell.value ? "Deleted" : "Active";
        },
      },
    ],
    [nextCursor, lastFilters]
  );

  const filtersDesc = useMemo(
    () => [
      { id: "user.email", placeholder: "user's email" },
      { id: "name", placeholder: "name" },
      { id: "url", placeholder: "url" },
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
    getWebhooks(true, true, order, filters, ROWS_PER_PAGE, cursor)
      .then((result) => {
        const [hooks, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(hooks)) {
          setLoadingError("");
          setNextCursor(nextCursor);
          setWebhooks(hooks);
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

  const refecth = () => {
    fetchData(
      { order: lastOrder, cursor: lastCursor, filters: lastFilters },
      true
    );
  };

  const close = () => {
    setDeleteModal(false);
    setCreateModal(false);
    setSelectedWebhook(null);
    setWebhookName("");
    setWebhookUrl("");
    setBlocking(true);
  };

  const doCreateWebhook = () => {
    close();
    if (!webhookUrl) {
      setMessage("Webhook URL must be specified");
      return;
    }
    if (!webhookName) {
      setMessage("Webhook name must be specified");
      return;
    }
    setMessage("Creating webhook");
    createWebhook({
      event: "streamStarted",
      name: webhookName,
      url: webhookUrl,
      blocking,
    })
      .then(() => {
        setMessage("Webhook created");
        refecth();
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
          <h3>Create webhook</h3>
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
                label="Webhook name"
                value={webhookName}
                sx={{
                  border: "white",
                  borderBottom: "2px solid black",
                  borderRadius: "0px",
                }}
                onChange={(e) => setWebhookName(e.target.value)}
                placeholder="new-wehbook-name-123"></Input>
            </Box>
            <Box>(a-z, A-Z, 0-9, -, _, ~ only)</Box>
            <Box>URL</Box>
            <Box>
              <Input
                autoFocus={true}
                label="Webhook url"
                value={webhookUrl}
                sx={{
                  border: "white",
                  borderBottom: "2px solid black",
                  borderRadius: "0px",
                }}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://own.site/hook1"></Input>
            </Box>
            <Box>(a-z, A-Z, 0-9, -, _, ~ only)</Box>
            <Box>Blocking</Box>
            <Box onClick={() => setBlocking(!blocking)}>
              <Checkbox value={blocking} />
            </Box>
            <Box></Box>
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
              onClick={doCreateWebhook}>
              Create
            </Button>
          </Flex>
        </Modal>
      )}
      {deleteModal && selectedWebhook && (
        <DeleteWebhookModal
          name={selectedWebhook.name}
          onClose={close}
          onDelete={() => {
            setMessage("Deleting webhook...");
            close();
            deleteWebhook(selectedWebhook.id)
              .then(() => {
                setMessage("Webhook deleted");
                refecth();
              })
              .catch((e) => setMessage(`Error: ${e}`));
          }}
        />
      )}
      <Box sx={{ mt: "2em" }}>{message}</Box>
      <CommonAdminTable
        onRowSelected={setSelectedWebhook}
        setNextCursor={setNextCursor}
        onFetchData={fetchData}
        loading={loading}
        data={webhooks}
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
          aria-label="Delete Stream button"
          disabled={!selectedWebhook}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => selectedWebhook && setDeleteModal(true)}>
          Delete
        </Button>
      </CommonAdminTable>
    </Container>
  );
};

export default AdminWebhookTable;
