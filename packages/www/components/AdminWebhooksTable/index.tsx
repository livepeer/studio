import { useEffect, useState } from "react";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Button, Flex, Grid, Input } from "@theme-ui/components";
import Modal from "../Modal";
import { Table, TableRow, TableRowVariant, Checkbox } from "../Table";
import { RelativeTime } from "../StreamsTable";
import { UserName } from "../AdminTokenTable";
import { User, Webhook } from "@livepeer.com/api";

type DeleteWebhookModalProps = {
  name: string;
  onClose: Function;
  onDelete: Function;
};

const DeleteWebhookModal = ({
  name,
  onClose,
  onDelete
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
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <Button type="button" variant="secondarySmall" onClick={onDelete}>
          Delete
        </Button>
      </Flex>
    </Modal>
  );
};

const sortNameF = (a: Webhook, b: Webhook) =>
  ((a && a.name) || "").localeCompare((b && b.name) || "");

const sortUrlF = (a: Webhook, b: Webhook) =>
  ((a && a.url) || "").localeCompare((b && b.url) || "");

const sortUserName = (users: Array<User>, a: Webhook, b: Webhook) => {
  const userA = users.find(u => u.id === a.userId);
  const userB = users.find(u => u.id === b.userId);
  if (userA && userB) {
    return userA.email.localeCompare(userB.email);
  }
  return ((a && a.name) || "").localeCompare((b && b.name) || "");
};

const sortUserIdF = (a: Webhook, b: Webhook) =>
  ((a && a.userId) || "").localeCompare((b && b.userId) || "");

const sortCreatedF = (a: Webhook, b: Webhook) =>
  (b.createdAt || 0) - (a.createdAt || 0);

const sortDeletedF = (a: Webhook, b: Webhook) =>
  +(b.deleted || false) - +(a.deleted || false);

export default ({ id }: { id: string }) => {
  const [message, setMessage] = useState("");
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [blocking, setBlocking] = useState(true);

  const [deleteModal, setDeleteModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [users, setUsers] = useState([]);
  const { getWebhooks, createWebhook, deleteWebhook, getUsers } = useApi();
  const [sortFunc, setSortFunc] = useState(null);
  useEffect(() => {
    getUsers()
      .then(users => setUsers(users))
      .catch(err => console.error(err)); // todo: surface this
  }, []);
  useEffect(() => {
    getWebhooks(true, true)
      .then(webhooks => {
        if (sortFunc) {
          webhooks.sort(sortFunc);
        }
        setWebhooks(webhooks);
      })
      .catch(err => console.error(err)); // todo: surface this
  }, [deleteModal]);
  const close = () => {
    setDeleteModal(false);
    setCreateModal(false);
    setSelectedStream(null);
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
      blocking
    })
      .then(() => setMessage("Webhook created"))
      .catch(e => setMessage(`Error: ${e}`));
  };
  const isVisible = usePageVisibility();
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      getWebhooks(true, true)
        .then(webhooks => {
          if (sortFunc) {
            webhooks.sort(sortFunc);
          }
          setWebhooks(webhooks);
        })
        .catch(err => console.error(err)); // todo: surface this
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, sortFunc]);

  const sortUserId = () => {
    if (webhooks) {
      if (users) {
        webhooks.sort(sortUserName.bind(null, users));
        setSortFunc(() => sortUserName.bind(null, users));
      } else {
        webhooks.sort(sortUserIdF);
        setSortFunc(() => sortUserIdF);
      }
      setWebhooks([...webhooks]);
    }
  };
  const sortName = () => {
    if (webhooks) {
      webhooks.sort(sortNameF);
      setSortFunc(() => sortNameF);
      setWebhooks([...webhooks]);
    }
  };
  const sortUrl = () => {
    if (webhooks) {
      webhooks.sort(sortUrlF);
      setSortFunc(() => sortUrlF);
      setWebhooks([...webhooks]);
    }
  };
  const sortCreated = () => {
    if (webhooks) {
      webhooks.sort(sortCreatedF);
      setSortFunc(() => sortCreatedF);
      setWebhooks([...webhooks]);
    }
  };
  const sortDeleted = () => {
    if (webhooks) {
      webhooks.sort(sortDeletedF);
      setSortFunc(() => sortDeletedF);
      setWebhooks([...webhooks]);
    }
  };
  return (
    <Box
      id={id}
      sx={{
        width: "100%",
        maxWidth: 958,
        mb: [3, 3],
        mx: "auto"
      }}
    >
      {createModal && (
        <Modal onClose={close} maxWidth="1000px">
          <h3>Create webhook</h3>
          <Grid
            gap={2}
            columns={[3, "1fr 3fr 3fr"]}
            sx={{
              alignItems: "center"
            }}
          >
            <Box>Name</Box>
            <Box>
              <Input
                autoFocus={true}
                label="Webhook name"
                value={webhookName}
                sx={{
                  border: "white",
                  borderBottom: "2px solid black",
                  borderRadius: "0px"
                }}
                onChange={e => setWebhookName(e.target.value)}
                placeholder="new-wehbook-name-123"
              ></Input>
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
                  borderRadius: "0px"
                }}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://own.site/hook1"
              ></Input>
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
              sx={{ mr: 2, mt: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondarySmall"
              onClick={doCreateWebhook}
            >
              Create
            </Button>
          </Flex>
        </Modal>
      )}
      {deleteModal && selectedStream && (
        <DeleteWebhookModal
          name={selectedStream.name}
          onClose={close}
          onDelete={() => {
            setMessage("Deleting webhook...");
            close();
            deleteWebhook(selectedStream.id)
              .then(() => {
                setMessage("Webhook deleted");
              })
              .catch(e => setMessage(`Error: ${e}`));
          }}
        />
      )}
      <Box sx={{ mt: "2em" }}>{message}</Box>
      <Box sx={{ mt: "2em" }}>
        <Button
          variant="outlineSmall"
          sx={{ margin: 2 }}
          onClick={() => {
            setMessage("");
            setCreateModal(true);
          }}
        >
          Create
        </Button>
        <Button
          variant="secondarySmall"
          aria-label="Delete Stream button"
          disabled={!selectedStream}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => selectedStream && setDeleteModal(true)}
        >
          Delete
        </Button>
      </Box>
      <Table sx={{ gridTemplateColumns: "auto auto auto auto auto auto auto" }}>
        <TableRow variant={TableRowVariant.Header} key="webhook header">
          <Box></Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortUserId}
          >
            User name ⭥
          </Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortName}
          >
            Name ⭥
          </Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortUrl}
          >
            URL ⭥
          </Box>
          <Box >
            Blocking
          </Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortCreated}
          >
            Created ⭥
          </Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortDeleted}
          >
            Status ⭥
          </Box>
        </TableRow>
        {webhooks.map((webhook: Webhook) => {
          const { id, name, userId, url, createdAt, deleted } = webhook;
          const selected = selectedStream && selectedStream.id === id;
          return (
            <>
              <TableRow
                key={id}
                variant={TableRowVariant.Normal}
                selected={selected}
                onClick={() => {
                  if (selected) {
                    setSelectedStream(null);
                  } else {
                    setSelectedStream(webhook);
                  }
                }}
              >
                <Checkbox value={selected} />
                <UserName id={userId} users={users} />
                <Box>{name}</Box>
                <Box>{url}</Box>
                <Checkbox value={webhook.blocking} />
                <RelativeTime
                  id={id}
                  prefix="createdat"
                  tm={createdAt}
                  swap={true}
                />
                <Box>{deleted ? "Deleted" : "Active"}</Box>
              </TableRow>
            </>
          );
        })}
      </Table>
    </Box>
  );
};
