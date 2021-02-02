import { useState, useMemo } from "react";
import { useApi } from "../../hooks";
import { Button, Flex, Container, Select } from "@theme-ui/components";
import Modal from "../Modal";
import { products } from "@livepeer.com/api/src/config";
import CommonAdminTable from "../CommonAdminTable";

type UserTableProps = {
  userId: string;
  id: string;
};

const USERS_PER_PAGE = 25;

const UserTable = ({ userId, id }: UserTableProps) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminModal, setAdminModal] = useState(false);
  const [removeAdminModal, setRemoveAdminModal] = useState(false);
  const [nextCursor, setNextCursor] = useState("");
  const [lastCursor, setLastCursor] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  const [lastFilters, setLastFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const { getUsers, makeUserAdmin } = useApi();

  const close = () => {
    setAdminModal(false);
    setRemoveAdminModal(false);
  };

  const getProductName = (productId) =>
    products ? `${products[productId]?.name}` : productId;

  const columns: any = useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Email",
        accessor: "email",
      },
      {
        Header: "EmailValid",
        accessor: "emailValid",
        Cell: (cell) => {
          return cell.value ? "true" : "false";
        },
      },
      {
        Header: "Admin",
        accessor: "admin",
        Cell: (cell) => {
          return cell.value ? "true" : "false";
        },
      },
      {
        Header: "Plan",
        accessor: "stripeProductId",
        Cell: ({ value }) => {
          return getProductName(value);
        },
      },
    ],
    [nextCursor, lastFilters]
  );

  const filtersDesc = useMemo(
    () => [
      { id: "email", placeholder: "user's email" },
      {
        id: "stripeProductId",
        render: ({ value, setValue }) => {
          return (
            <Select
              sx={{ ml: "1em", width: "8em" }}
              onChange={(e) => setValue(e.target.value)}>
              <option id="empty" value="">
                —
              </option>
              {Object.keys(products).map((id) => (
                <option key={id} value={id}>
                  {products[id].name}
                </option>
              ))}
            </Select>
          );
        },
      },
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
    getUsers(USERS_PER_PAGE, cursor, order, filters)
      .then((result) => {
        const [users, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(users)) {
          setLoadingError("");
          setNextCursor(nextCursor);
          setUsers(users);
        } else {
          const errors = JSON.stringify(users["errors"] || resp.statusText);
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
      id={id}
      sx={{
        my: 2,
      }}>
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
              sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primarySmall"
              onClick={() => {
                makeUserAdmin(selectedUser.email, true)
                  .then(refecth)
                  .finally(close);
              }}>
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
              sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primarySmall"
              onClick={() => {
                makeUserAdmin(selectedUser.email, false)
                  .then(refecth)
                  .finally(close);
              }}>
              Remove Admin Rights
            </Button>
          </Flex>
        </Modal>
      )}
      <CommonAdminTable
        onRowSelected={setSelectedUser}
        setNextCursor={setNextCursor}
        onFetchData={fetchData}
        loading={loading}
        data={users}
        nextCursor={nextCursor}
        rowsPerPage={USERS_PER_PAGE}
        err={loadingError}
        columns={columns}
        filtersDesc={filtersDesc}
        initialSortBy={[{ id: "email", desc: false }]}>
        <Button
          variant="outlineSmall"
          disabled={!selectedUser || selectedUser.admin}
          sx={{ ml: "1em" }}
          onClick={() => selectedUser && setAdminModal(true)}>
          Make User Admin
        </Button>
        <Button
          variant="outlineSmall"
          disabled={!selectedUser || !selectedUser.admin}
          sx={{ ml: "1em" }}
          onClick={() => selectedUser && setRemoveAdminModal(true)}>
          Remove Admin Rights
        </Button>
      </CommonAdminTable>
    </Container>
  );
};
export default UserTable;
