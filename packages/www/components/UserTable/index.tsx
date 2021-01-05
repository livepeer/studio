import { useEffect, useState } from "react";
import { useApi, useDebounce } from "../../hooks";
import {
  Box,
  Button,
  Flex,
  Container,
  Input,
  Select
} from "@theme-ui/components";
import Modal from "../Modal";
import { Table, TableRow, Checkbox, TableRowVariant } from "../Table";
import { products } from "@livepeer.com/api/src/config";

type UserTableProps = {
  userId: string;
  id: string;
};

const USERS_PER_PAGE = 100;

const UserTable = ({ userId, id }: UserTableProps) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminModal, setAdminModal] = useState(false);
  const [removeAdminModal, setRemoveAdminModal] = useState(false);
  const [cursor, setCursor] = useState("");
  const [prevCursor, setPrevCursor] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [product, setProduct] = useState("");
  const filter = useDebounce(filterInput, 500, (v) => {
    setPrevCursor([]);
    setNextCursor("");
    setCursor("");
  });
  const { getUsers, makeUserAdmin } = useApi();
  useEffect(() => {
    setUsers([]);
    getUsers(USERS_PER_PAGE, cursor, filter, product)
      .then((result) => {
        if (Array.isArray(result)) {
          const [users, nextCursor] = result;
          setNextCursor(nextCursor);
          setUsers(users);
        } else {
          console.log(users);
        }
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [
    userId,
    adminModal,
    removeAdminModal,
    selectedUser,
    cursor,
    filter,
    product
  ]);
  const close = () => {
    setAdminModal(false);
    setRemoveAdminModal(false);
    setSelectedUser(null);
  };
  return (
    <Container
      id={id}
      sx={{
        my: 2
      }}
    >
      {adminModal && selectedUser && (
        <Modal onClose={close}>
          <h3>Make User Admin</h3>
          <p>
            Are you sure you want to make user "{selectedUser.email}" an admin?
          </p>
          <Flex sx={{ justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="outlineSmall"
              onClick={close}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondarySmall"
              onClick={() => {
                makeUserAdmin(selectedUser.email, true).then(close);
              }}
            >
              Make User Admin
            </Button>
          </Flex>
        </Modal>
      )}
      {removeAdminModal && selectedUser && (
        <Modal onClose={close}>
          <h3>Remove Admin Rights</h3>
          <p>
            Are you sure you want to remove admin rights for "
            {selectedUser.email}"?
          </p>
          <Flex sx={{ justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="outlineSmall"
              onClick={close}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondarySmall"
              onClick={() => {
                makeUserAdmin(selectedUser.email, false).then(close);
              }}
            >
              Remove Admin Rights
            </Button>
          </Flex>
        </Modal>
      )}
      <Flex sx={{ justifyContent: "flex-start", alignItems: "baseline" }}>
        <Button
          variant="secondarySmall"
          disabled={!selectedUser || selectedUser.admin}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => selectedUser && setAdminModal(true)}
        >
          Make User Admin
        </Button>
        <Button
          variant="secondarySmall"
          disabled={!selectedUser || !selectedUser.admin}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => selectedUser && setRemoveAdminModal(true)}
        >
          Remove Admin Rights
        </Button>
        <Button
          variant="secondarySmall"
          disabled={prevCursor.length === 0}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => {
            setNextCursor(cursor);
            setCursor(prevCursor.pop());
            setPrevCursor([...prevCursor]);
          }}
        >
          Previouse page
        </Button>
        <Button
          variant="secondarySmall"
          disabled={users.length < USERS_PER_PAGE || nextCursor === ""}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => {
            prevCursor.push(cursor);
            setPrevCursor([...prevCursor]);
            setCursor(nextCursor);
            setNextCursor("");
          }}
        >
          Next page
        </Button>
        <Input
          sx={{ width: "10em" }}
          label="filterInput"
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          placeholder="email"
        ></Input>
        <Select sx={{ ml: "1em" }} onChange={(e) => setProduct(e.target.value)}>
          <option value="">--</option>
          {Object.keys(products).map((id) => (
            <option value={id}>{products[id].name}</option>
          ))}
        </Select>
      </Flex>
      {users.length === 0 ? (
        <p>No users created yet</p>
      ) : (
        <Table sx={{ gridTemplateColumns: "auto 1fr auto auto auto" }}>
          <TableRow variant={TableRowVariant.Header} key="header">
            <Box></Box>
            <Box>ID</Box>
            <Box>Email</Box>
            <Box>EmailValid</Box>
            <Box>Admin</Box>
          </TableRow>
          {users.map((user) => {
            const { id, email, emailValid, admin } = user;
            const selected = selectedUser && selectedUser.id === id;
            return (
              <TableRow
                selected={selected}
                key={id}
                onClick={() => {
                  if (selected) {
                    setSelectedUser(null);
                  } else {
                    setSelectedUser(user);
                  }
                }}
              >
                <Checkbox value={selected} />
                <Box>{id}</Box>
                <Box>{email}</Box>
                <Box>{JSON.stringify(emailValid)}</Box>
                <Box>{JSON.stringify(admin)}</Box>
              </TableRow>
            );
          })}
        </Table>
      )}
    </Container>
  );
};
export default UserTable;
