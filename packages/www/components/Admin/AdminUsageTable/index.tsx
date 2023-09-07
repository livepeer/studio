/** @jsxImportSource @emotion/react */
import { jsx } from "theme-ui";
import { useEffect, useState } from "react";
import { useApi } from "hooks";
import { Select, Container, Box, Button, Input } from "@theme-ui/components";
import { Table, TableRow, TableRowVariant } from "components/Admin/Table";

function dur2str(dur?: number) {
  if (!dur) {
    return "";
  }
  const min = dur / 60;
  return `${dur} sec (${min} min)`;
}

const Index = ({ id }: { id: string }, children) => {
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [usage, setUsage] = useState(null);
  const [users, setUsers] = useState([]);
  const { getUsers, getUsage, getBillingUsage } = useApi();
  useEffect(() => {
    getUsers(10000)
      .then((result) => {
        const [users, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(users)) {
          users.sort((a, b) => a.email.localeCompare(b.email));
          setUsers(users);
        } else {
          setMessage(`${result}`);
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage(err);
      }); // todo: surface this
  }, []);
  const doGetUsage = async (fromTime, toTime, userId) => {
    console.log(`do get usage ${fromTime} ${toTime} ${userId}`);
    const ftd = +new Date(fromTime);
    if (isNaN(ftd)) {
      setMessage(`Invalid date ${fromTime}`);
      return;
    }
    const ttd = +new Date(toTime);
    if (isNaN(ttd)) {
      setMessage(`Invalid date ${toTime}`);
      return;
    }
    const [res, usage] = await getBillingUsage(ftd, ttd, null, null, userId);
    if (res.status == 200) {
      console.log(`got usage data:`, usage);
      setUsage(usage);
    } else {
      setMessage(`Error: ${usage}`);
    }
  };

  return (
    <Container
      id={id}
      sx={{
        mb: 5,
        mt: 2,
      }}>
      <Box sx={{ mt: "2em" }}>{message}</Box>
      <Box sx={{ mt: "2em" }}>
        <Select
          sx={{ mt: "1em" }}
          onChange={(e) => setSelectedUser(e.target.value)}>
          {users.map((user) => (
            <option value={user.id} key={user.id}>
              {user.email}
            </option>
          ))}
        </Select>
        <Input
          label="fromTime"
          value={fromTime}
          onChange={(e) => setFromTime(e.target.value)}
          placeholder="2020-09-01"></Input>
        <Input
          label="toTime"
          value={toTime}
          onChange={(e) => setToTime(e.target.value)}
          placeholder="2020-09-02"></Input>
        <Button
          variant="secondarySmall"
          aria-label="Get usage button"
          disabled={!selectedUser || !fromTime || !toTime}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => doGetUsage(fromTime, toTime, selectedUser)}>
          Get usage
        </Button>
      </Box>
      <Table
        sx={{
          border: "1px solid #e0e0e0",
          gridTemplateColumns: "auto auto auto auto auto",
          gap: "1rem",
        }}>
        <>
          <TableRow
            variant={TableRowVariant.Header}
            key="usage header"
            sx={{ background: "#f7f7f7", fontWeight: "bold" }}>
            <>
              <Box sx={{ padding: "0.5rem" }}>Category</Box>
              <Box sx={{ padding: "0.5rem", textAlign: "center" }}>
                Transcoding
              </Box>
              <Box sx={{ padding: "0.5rem", textAlign: "center" }}>
                Delivery
              </Box>
              <Box sx={{ padding: "0.5rem", textAlign: "center" }}>Storage</Box>
            </>
          </TableRow>
          <TableRow
            key="just one row for now"
            variant={TableRowVariant.Normal}
            sx={{ borderBottom: "1px solid #e0e0e0" }}>
            <>
              <Box sx={{ padding: "0.5rem" }}>Values</Box>
              <Box sx={{ padding: "0.5rem", textAlign: "right" }}>
                {usage && usage.TotalUsageMins}
              </Box>
              <Box sx={{ padding: "0.5rem", textAlign: "right" }}>
                {usage && usage.DeliveryUsageMins}
              </Box>
              <Box sx={{ padding: "0.5rem", textAlign: "right" }}>
                {usage && usage.StorageUsageMins}
              </Box>
            </>
          </TableRow>
        </>
      </Table>
    </Container>
  );
};

export default Index;
