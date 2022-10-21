import { Box, Flex } from "@livepeer/design-system";
import Layout from "layouts/dashboard";
import { useRouter } from "next/router";
import { useApi, useLoggedIn } from "hooks";
import { useEffect, useState, useMemo } from "react";
import { isStaging } from "lib/utils";
import Spinner from "components/Dashboard/Spinner";
import { Variant as StatusVariant } from "@components/Dashboard/StatusBadge";
import StreamPlayerBox from "@components/Dashboard/StreamDetails/StreamPlayerBox/";
import StreamDetailsBox from "@components/Dashboard/StreamDetails/StreamDetailsBox";
import StreamHeadingBox from "@components/Dashboard/StreamDetails/StreamHeadingBox";
import StreamChildrenHeadingBox from "@components/Dashboard/StreamDetails/StreamChildrenHeadingBox";
import EmbedVideoDialog from "@components/Dashboard/AssetDetails/EmbedVideoDialog";

const StreamDetail = ({
  breadcrumbs,
  children,
  stream,
  streamHealth,
  invalidateStream,
  setSwitchTab,
  activeTab = "Overview",
  embedVideoDialogOpen,
  setEmbedVideoDialogOpen,
}) => {
  useLoggedIn();
  const { user, getIngest, getAdminStreams } = useApi();
  const router = useRouter();
  const { query } = router;
  const id = query.id;
  const [ingest, setIngest] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isCopied, setCopied] = useState(0);
  const [lastSession, setLastSession] = useState(null);
  const [lastSessionLoading, setLastSessionLoading] = useState(false);

  useEffect(() => {
    if (user && user.admin && stream && !lastSessionLoading) {
      setLastSessionLoading(true);
      getAdminStreams({
        sessionsonly: true,
        limit: 1,
        order: "createdAt-true",
        filters: [{ id: "parentId", value: stream.id }],
        userId: stream.userId,
      })
        .then((res) => {
          const [streamsOrError] = res;
          if (Array.isArray(streamsOrError) && streamsOrError.length > 0) {
            setLastSession(streamsOrError[0]);
          }
        })
        .catch((e) => console.log(e))
        .finally(() => setLastSessionLoading(false));
    }
  }, [user, stream]);

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  useEffect(() => {
    getIngest(true)
      .then((ingest) => {
        if (Array.isArray(ingest)) {
          ingest.sort((a, b) => a.base.localeCompare(b.base));
        }
        if ((ingest?.length ?? 0) > 0) {
          setIngest(ingest?.[0]);
        }
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [id]);

  const healthState = useMemo(() => {
    if (!stream?.isActive) return null;

    const activeCond = streamHealth?.conditions.find(
      (c) => c.type === "Active"
    );
    const healthyCond = streamHealth?.healthy;
    const healthValid =
      activeCond?.status &&
      healthyCond?.status != null &&
      healthyCond.lastProbeTime >= activeCond.lastTransitionTime;
    return !healthValid
      ? StatusVariant.Pending
      : healthyCond.status
      ? StatusVariant.Healthy
      : StatusVariant.Unhealthy;
  }, [stream?.isActive, streamHealth]);

  if (!user) {
    return <Layout />;
  }

  let { broadcasterHost, region } = stream || {};
  if (!broadcasterHost && lastSession && lastSession.broadcasterHost) {
    broadcasterHost = lastSession.broadcasterHost;
  }
  if (!region && lastSession && lastSession.region) {
    region = lastSession.region;
  }

  const playbackId = (stream || {}).playbackId || "";

  let globalIngestUrl = "";
  let globalPlaybackUrl = "";
  if (ingest) {
    globalIngestUrl = ingest?.ingests?.rtmp;
    globalPlaybackUrl = `${ingest?.playback ?? ""}/${playbackId}/index.m3u8`;
  }

  return (
    <>
      <EmbedVideoDialog
        isOpen={embedVideoDialogOpen}
        onOpenChange={setEmbedVideoDialogOpen}
        playbackId={stream?.playbackId}
      />

      <Layout id="streams" breadcrumbs={breadcrumbs}>
        <Box css={{ px: "$6", py: "$7" }}>
          {stream ? (
            <>
              <Flex>
                <Box
                  css={{
                    minWidth: 424,
                    flex: "0 0 33%",
                  }}>
                  <StreamHeadingBox
                    stream={stream}
                    healthState={healthState}
                    streamHealth={streamHealth}
                  />

                  <Box>
                    <StreamPlayerBox
                      stream={stream}
                      globalPlaybackUrl={globalPlaybackUrl}
                      onEmbedVideoClick={() => setEmbedVideoDialogOpen(true)}
                    />
                    <StreamDetailsBox
                      stream={stream}
                      globalIngestUrl={globalIngestUrl}
                      globalPlaybackUrl={globalPlaybackUrl}
                      invalidateStream={invalidateStream}
                    />
                  </Box>
                </Box>
                <Box css={{ flexGrow: 1, ml: "$8" }}>
                  <StreamChildrenHeadingBox
                    stream={stream}
                    user={user}
                    activeTab={activeTab}
                    setSwitchTab={setSwitchTab}
                    invalidateStream={invalidateStream}
                  />
                  <Box css={{ py: "$4" }}>{children}</Box>
                </Box>
              </Flex>
            </>
          ) : notFound ? (
            <Box>Not found</Box>
          ) : (
            <Flex
              css={{
                height: "calc(100vh - 300px)",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Spinner />
            </Flex>
          )}
        </Box>
      </Layout>
    </>
  );
};

export default StreamDetail;
