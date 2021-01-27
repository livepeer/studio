import { useEffect, useState, useMemo } from "react";
import { useApi } from "../../hooks";
import {
  Select,
  Box,
  Button,
  Flex,
  Input,
  Container,
} from "@theme-ui/components";
import Modal from "../Modal";
import CopyBox from "../CopyBox";
import CommonAdminTable from "../CommonAdminTable";

const ROWS_PER_PAGE = 25;

type TokenTableProps = {
  userId: string;
  id: string;
};

const AdminTokenTable = ({ id }: TokenTableProps) => {
  const [tokens, setTokens] = useState([]);
  const [tokenName, setTokenName] = useState("");
  const [newTokenUserId, setNewTokenUserId] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [copyTime, setCopyTime] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [nextCursor, setNextCursor] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [lastCursor, setLastCursor] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  const [lastFilters, setLastFilters] = useState([]);
  const { getApiTokens, createApiToken, deleteApiToken, getUsers } = useApi();

  useEffect(() => {
    getUsers(10000)
      .then((result) => {
        const [users, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(users)) {
          setUsers(users);
        } else {
          console.log(users);
        }
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, []);

  const close = () => {
    setCreateModal(false);
    setDeleteModal(false);
    setTokenName("");
    setNewTokenUserId("");
    setNewToken(null);
    setCopyTime(null);
  };

  const columns: any = useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id"
        // Header: ({ rows, getToggleAllRowsSelectedProps }) => {
        //   console.log(`--> ID header rows:`, rows, `nextCur='${nextCursor}'`);
        //   return "ID";
        // }
      },
      {
        Header: "User",
        accessor: "user.email"
      },
      {
        Header: "Name",
        accessor: "name"
      },
      {
        Header: "Last Active",
        accessor: "lastSeen"
      }
    ],
    [nextCursor, lastFilters]
  );

  const filtersDesc = [
    { id: "name", placeholder: "token name" },
    { id: "user.email", placeholder: "user's email" }
  ];

  const fetchData = ({ order, cursor, filters }, refetch: boolean = false) => {
    setLoading(true);
    if (!refetch) {
      setLastCursor(cursor);
      setLastFilters(filters);
      setLastOrder(order);
    }
    getApiTokens(null, order, filters, ROWS_PER_PAGE, cursor)
      .then((result) => {
        const [tokens, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(tokens)) {
          setLoadingError("");
          setNextCursor(nextCursor);
          setTokens(tokens);
        } else {
          const errors = JSON.stringify(tokens["errors"] || resp.statusText);
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

  return (
    <Container
      sx={{
        mb: 5,
        mt: 2,
      }}>
      {createModal && (
        <Modal onClose={close}>
          {!newToken && (
            <form
              id={id}
              onSubmit={(e) => {
                e.preventDefault();
                if (creating) {
                  return;
                }
                setCreating(true);
                createApiToken({ name: tokenName, userId: newTokenUserId })
                  .then((newToken) => {
                    setNewToken(newToken);
                    setCreating(false);
                    refecth();
                  })
                  .catch((e) => {
                    console.error(e);
                    setCreating(false);
                  });
              }}>
              <h3>Create token</h3>
              <p>
                Enter a name for your token to differentiate it from other
                tokens.
              </p>
              <Input
                label="Name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="New Token"></Input>
              <Select
                sx={{ mt: "1em" }}
                onChange={(e) => setNewTokenUserId(e.target.value)}
              >
                <option key="empty" value="">
                  --
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </Select>
              <Flex sx={{ justifyContent: "flex-end", py: 3 }}>
                <Button
                  type="button"
                  variant="outlineSmall"
                  onClick={close}
                  sx={{ mr: 2 }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primarySmall">
                  Create Token
                </Button>
              </Flex>
            </form>
          )}
          {newToken && (
            <Box>
              <h5>Token created</h5>
              <p>Please copy your token and store it in a safe place.</p>
              <p>
                <strong>
                  For security reasons, it will not be shown again.
                </strong>
              </p>
              <Box>
                <CopyBox
                  onCopy={() => setCopyTime(Date.now())}
                  copy={newToken.id}
                />
              </Box>
              <Flex
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 3,
                }}>
                <Box>{copyTime !== null && <strong>Copied!</strong>}</Box>
                <Button type="button" variant="primarySmall" onClick={close}>
                  Close
                </Button>
              </Flex>
            </Box>
          )}
        </Modal>
      )}
      {deleteModal && selectedRow && (
        <Modal onClose={close}>
          <h3>Delete token</h3>
          <p>Are you sure you want to delete token "{selectedRow.name}"?</p>
          <Flex sx={{ justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="outlineSmall"
              onClick={close}
              sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primarySmall"
              onClick={() => {
                deleteApiToken(selectedRow.id).finally(() => {
                  refecth();
                  close();
                });
              }}
            >
              Delete
            </Button>
          </Flex>
        </Modal>
      )}
      <CommonAdminTable
        onRowSelected={setSelectedRow}
        setNextCursor={setNextCursor}
        onFetchData={fetchData}
        loading={loading}
        data={tokens}
        nextCursor={nextCursor}
        rowsPerPage={ROWS_PER_PAGE}
        err={loadingError}
        columns={columns}
        filtersDesc={filtersDesc}
      >
        <Button
          key="createBut"
          variant="outlineSmall"
          sx={{ ml: "1em" }}
          onClick={() => {
            setCreateModal(true);
          }}>
          Create
        </Button>
        <Button
          key="deleteBut"
          variant="outlineSmall"
          disabled={!selectedRow}
          sx={{ ml: "1em" }}
          onClick={() => setDeleteModal(true)}
        >
          Delete
        </Button>
      </CommonAdminTable>
    </Container>
  );
};

export default AdminTokenTable;
