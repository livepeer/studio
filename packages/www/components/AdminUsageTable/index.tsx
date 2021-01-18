import { useEffect, useState } from "react";
import { useApi } from "../../hooks";
import { Select, Container, Box, Button, Input } from "@theme-ui/components";
import { Table, TableRow, TableRowVariant } from "../Table";

function dur2str(dur?: number) {
  if (!dur) {
    return "";
  }
  const min = dur / 60;
  return `${dur} sec (${min} min)`;
}

export default ({ id }: { id: string }) => {
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [usage, setUsage] = useState(null);
  const [users, setUsers] = useState([]);
  const { getUsers, getUsage } = useApi();
  useEffect(() => {
    getUsers(10000)
      .then((result) => {
        if (Array.isArray(result)) {
          const [users] = result;
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
    const [res, usage] = await getUsage(ftd, ttd, userId);
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
            <option value={user.id}>{user.email}</option>
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
      <Table sx={{ gridTemplateColumns: "auto auto auto auto auto" }}>
        <TableRow variant={TableRowVariant.Header} key="usage header">
          <Box></Box>
          <Box>Source seconds</Box>
          <Box>Transcoded seconds</Box>
          <Box>Source segments</Box>
          <Box>Transcoded segments</Box>
        </TableRow>
        <TableRow key="just one row for now" variant={TableRowVariant.Normal}>
          <Box></Box>
          <Box>{dur2str(usage && usage.sourceSegmentsDuration)}</Box>
          <Box>{dur2str(usage && usage.transcodedSegmentsDuration)}</Box>
          <Box>{usage && usage.sourceSegments}</Box>
          <Box>{usage && usage.transcodedSegments}</Box>
        </TableRow>
      </Table>
    </Container>
  );
};
