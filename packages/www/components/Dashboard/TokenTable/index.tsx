import {
  styled,
  Heading,
  Button,
  Box,
  Flex,
} from "@livepeer.com/design-system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import { CopyToClipboard } from "react-copy-to-clipboard";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { Column, Row } from "react-table";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { CopyIcon } from "@radix-ui/react-icons";
import Create from "./Create";
import Delete from "./Delete";

type TokenTableData = {
  name: TextCellProps;
  token: TextCellProps;
  lastUsed: DateCellProps;
  createdAt: DateCellProps;
};

const Copy = styled(CopyIcon, {
  width: 14,
  height: 14,
  color: "$hiContrast",
});

const TokenTable = ({
  title = "API Keys",
  userId,
}: {
  title?: string;
  userId: string;
}) => {
  const [tokens, setTokens] = useState([]);
  const [newToken, setNewToken] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [onUnselect, setOnUnselect] = useState();
  const { getApiTokens, deleteApiToken } = useApi();

  useEffect(() => {
    getApiTokens(userId)
      .then((result) => {
        const [tokens, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(tokens)) {
          setTokens(tokens);
        } else {
          console.error(result);
        }
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [userId, newToken]);

  const columns: Column<TokenTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      {
        Header: "Token",
        accessor: "token",
        width: 400,
        disableSortBy: true,
        Cell: TextCell,
      },
      {
        Header: "Last Used",
        accessor: "lastUsed",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.lastUsed.date", ...params),
      },
      {
        Header: "Created",
        accessor: "createdAt",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.createdAt.date", ...params),
      },
    ],
    []
  );

  const Key = ({ token }) => {
    const [isCopied, setCopied] = useState(0);
    const [keyRevealed, setKeyRevealed] = useState(false);

    return (
      <Box css={{ minWidth: 300 }}>
        {keyRevealed ? (
          <Flex css={{ height: 25, ai: "center" }}>
            {token.id}
            <CopyToClipboard text={token.id} onCopy={() => setCopied(2000)}>
              <Flex
                css={{
                  alignItems: "center",
                  cursor: "pointer",
                  ml: "$1",
                }}>
                <Copy />
                {!!isCopied && (
                  <Box
                    css={{
                      ml: "$2",
                      fontSize: "$2",
                      color: "$hiContrast",
                    }}>
                    Copied
                  </Box>
                )}
              </Flex>
            </CopyToClipboard>
          </Flex>
        ) : (
          <Button size="1" type="button" onClick={() => setKeyRevealed(true)}>
            Reveal key
          </Button>
        )}
      </Box>
    );
  };

  const data: TokenTableData[] = useMemo(() => {
    return tokens.map((token) => {
      return {
        token: {
          children: <Key token={token} />,
        },
        name: {
          children: token.name,
        },
        createdAt: {
          date: new Date(token.createdAt),
          fallback: <Box css={{ color: "$mauve8" }}>—</Box>,
        },
        lastUsed: {
          date: new Date(token.lastSeen),
          fallback: <i>unused</i>,
        },
      };
    });
  }, [tokens]);

  const handleRowSelectionChange = useCallback(
    (rows: Row<TokenTableData>[]) => {
      setSelectedTokens(
        rows.map((r: any) => tokens.find((t) => t.id === r.original.id))
      );
    },
    [tokens]
  );

  return (
    <Box>
      <Flex
        align="end"
        justify="between"
        css={{
          mb: "$5",
        }}>
        <Heading size="2" css={{ fontWeight: 600 }}>
          {title}
        </Heading>

        <Flex css={{ alignItems: "center" }}>
          {!!selectedTokens.length && (
            <Delete
              onUnselect={onUnselect}
              total={selectedTokens.length}
              onDelete={async () => {
                for (const selectedToken of selectedTokens) {
                  await deleteApiToken(selectedToken.id);
                }
              }}
            />
          )}
          {!selectedTokens.length && (
            <Create newToken={newToken} setNewToken={setNewToken} />
          )}
        </Flex>
      </Flex>

      <Box css={{ mb: "$5" }}>
        {/* TODO fix this before merging! @julianbenegas */}
        {/* <Table
          setOnUnselect={setOnUnselect}
          columns={columns}
          data={data}
          rowSelection="all"
          onRowSelectionChange={handleRowSelectionChange}
        /> */}
      </Box>
    </Box>
  );
};

export default TokenTable;
