import { useQuery } from "react-query";
import { Badge } from "@livepeer/design-system";
import { useApi } from "hooks";
import { useCallback } from "react";

const ActiveStreamsBadge = () => {
  const { user, getStreams } = useApi();
  const fetcher = useCallback(async () => {
    const [streams] = await getStreams(user.id, {
      count: true,
      active: true,
    });
    return { streams };
  }, [user.id]);

  const { isLoading, data } = useQuery("activeStreams", () => fetcher());
  if (isLoading || !(data?.streams?.length > 0)) {
    return null;
  }
  return (
    <Badge size="1" variant="primary" css={{ letterSpacing: 0, mt: "7px" }}>
      {data?.streams?.length} active right now
    </Badge>
  );
};

export default ActiveStreamsBadge;
