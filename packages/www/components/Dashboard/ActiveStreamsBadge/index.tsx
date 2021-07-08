import { useQuery } from "react-query";
import { Badge } from "@livepeer.com/design-system";
import { useApi } from "hooks";
import { useCallback } from "react";

const ActiveStreamsBadge = () => {
  const { user, getStreams } = useApi();
  const fetcher = useCallback(async () => {
    const [, , count] = await getStreams(user.id, {
      count: true,
      active: true,
    });
    return { count };
  }, [user.id]);

  const { isLoading, data } = useQuery("activeStreams", () => fetcher());
  if (isLoading || !data?.count) {
    return null;
  }
  return (
    <Badge size="1" variant="violet" css={{ letterSpacing: 0, mt: "7px" }}>
      {data?.count} active right now
    </Badge>
  );
};

export default ActiveStreamsBadge;
