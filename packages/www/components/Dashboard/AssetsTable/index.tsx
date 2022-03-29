import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useApi, usePageVisibility } from "hooks";
import {
  Flex,
  Heading,
  Link as A,
  Text,
  Box,
} from "@livepeer.com/design-system";

type StreamsTableData = {
  id: string;
  name: TextCellProps;
  details: RenditionDetailsCellProps;
  createdAt: DateCellProps;
  lastSeen: DateCellProps;
  status: TextCellProps;
};

const AssetsTable = ({
  userId,
  title = "Video on Demand Assets",
}: {
  userId: string;
  title?: string;
}) => {
  const [assets, setAssets] = useState([]);

  const { getAssets } = useApi();

  useEffect(() => {
    async function init() {
      const [assets] = await getAssets(userId);
      setAssets(assets);
    }
    init();
  }, [userId]);

  console.log(assets);

  const columns: Column<StreamsTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.value", ...params),
      },
      {
        Header: "Created",
        accessor: "createdAt",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.createdAt.date", ...params),
      },
      {
        Header: "Last seen",
        accessor: "lastSeen",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.lastSeen.date", ...params),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
        disableSortBy: true,
      },
    ],
    []
  );

  return (
    <>
      <Heading size="2" css={{ fontWeight: 600 }}>
        {title}
      </Heading>
      <Flex
        direction="column"
        justify="center"
        css={{
          margin: "0 auto",
          height: "calc(100vh - 400px)",
          maxWidth: 450,
        }}>
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          Video on Demand Assets
        </Heading>
        <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
          Livepeer Video Services now supports Video on Demand which allows you
          to import video assets, store them on decentralized storage, and
          easily mint a video NFT. This functionality is currently in beta and
          available only on the API.
        </Text>

        <Box
          css={{
            display: "block",
            "@bp1": {
              display: "flex",
            },
          }}>
          <Link href="/docs/api-reference/vod/import" passHref>
            <A
              target="_blank"
              variant="violet"
              css={{ display: "flex", ai: "center", mb: "$5" }}>
              <Box>Documentation</Box>
              <ArrowRightIcon />
            </A>
          </Link>
        </Box>
      </Flex>
    </>
  );
};

export default AssetsTable;
