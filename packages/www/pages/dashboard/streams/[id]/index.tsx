import { useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Grid,
  Link as A,
  Status,
  Badge,
  Tooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@livepeer.com/design-system";
import Layout from "../../../../layouts/dashboard";
import useLoggedIn from "../../../../hooks/use-logged-in";
import { Stream } from "@livepeer.com/api";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useRouter } from "next/router";
import { useApi, usePageVisibility } from "../../../../hooks";
import { useEffect, useState } from "react";
import StreamSessionsTable from "components/Dashboard/SessionsTable";
import {
  pathJoin,
  isStaging,
  isDevelopment,
  formatNumber,
} from "../../../../lib/utils";
import { RelativeTime } from "components/CommonAdminTable";
import {
  CopyIcon as Copy,
  QuestionMarkCircledIcon as Help,
  PauseIcon,
} from "@radix-ui/react-icons";
import Spinner from "components/Dashboard/Spinner";
import Player from "components/Dashboard/Player";
import Record from "@components/Dashboard/StreamDetails/Record";
import Terminate from "@components/Dashboard/StreamDetails/Terminate";
import Suspend from "@components/Dashboard/StreamDetails/Suspend";
import Delete from "@components/Dashboard/StreamDetails/Delete";
import Link from "next/link";
import useSWR from "swr";

type TimedAlertProps = {
  text: string;
  close: Function;
  variant?: string;
};

const TimedAlert = ({ text, variant, close }: TimedAlertProps) => {
  const isShown = !!text;
  const closeVariant = variant ? `close-${variant}` : "close";
  useEffect(() => {
    if (isShown) {
      const interval = setTimeout(() => {
        close();
      }, 3000);
      return () => clearTimeout(interval);
    }
  }, [text]);
  return isShown ? (
    <Alert css={{ m: 2 }}>{text}</Alert>
  ) : // <Alert variant={variant} css={{ m: 2 }}>
  //   {text}
  //   <Close variant={closeVariant} ml="auto" mr={-2} onClick={() => close()} />
  // </Alert>
  null;
};

type ShowURLProps = {
  text: string;
  url: string;
  anchor?: boolean;
  urlToCopy?: string;
};

const ShowURL = ({ text, url, urlToCopy, anchor = false }: ShowURLProps) => {
  const [isCopied, setCopied] = useState(0);
  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);
  const ccurl = urlToCopy ? urlToCopy : url;
  return (
    <Flex css={{ justifyContent: "flex-start", alignItems: "center" }}>
      {text ? (
        <Box css={{ minWidth: 125, fontSize: 12, paddingRight: "1em" }}>
          {text}:
        </Box>
      ) : null}
      <CopyToClipboard text={ccurl} onCopy={() => setCopied(2000)}>
        <Flex css={{ alignItems: "center" }}>
          {anchor ? (
            <A css={{ fontSize: "$2", mr: "$1" }} href={url} target="_blank">
              {url}
            </A>
          ) : (
            <Box css={{ fontSize: "$2", mr: "$1" }}>{url}</Box>
          )}
          <Copy
            css={{
              mr: "$1",
              cursor: "pointer",
              width: 14,
              height: 14,
              color: "$hiContrast",
            }}
          />
        </Flex>
      </CopyToClipboard>
      {!!isCopied && (
        <Box
          css={{
            ml: "$1",
            fontSize: "$2",
            color: "$hiContrast",
          }}>
          Copied
        </Box>
      )}
    </Flex>
  );
};

const Cell = ({ children, css = {} }) => {
  return <Box css={{ mb: "$3", ...css }}>{children}</Box>;
};

const ClipBut = ({ text }) => {
  const [isCopied, setCopied] = useState(0);
  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);
  return (
    <CopyToClipboard text={text} onCopy={() => setCopied(2000)}>
      <Flex
        css={{
          alignItems: "center",
          cursor: "pointer",
          ml: 0,
          mr: 0,
        }}>
        <Box css={{ mr: "$1" }}>{text}</Box>
        <Copy
          css={{
            mr: "$2",
            width: 14,
            height: 14,
            color: "$hiContrast",
          }}
        />
        {!!isCopied && (
          <Box css={{ fontSize: "$2", color: "$hiContrast" }}>Copied</Box>
        )}
      </Flex>
    </CopyToClipboard>
  );
};

const ID = () => {
  useLoggedIn();
  const { user, getStream, getIngest, setRecord, getAdminStreams } = useApi();
  const userIsAdmin = user && user.admin;
  const router = useRouter();
  const { query } = router;
  const id = query.id;
  const [ingest, setIngest] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [isCopied, setCopied] = useState(0);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [lastSession, setLastSession] = useState(null);
  const [lastSessionLoading, setLastSessionLoading] = useState(false);
  const [regionalUrlsVisible, setRegionalUrlsVisible] = useState(false);
  const [resultText, setResultText] = useState("");
  const [alertText, setAlertText] = useState("");
  const [videoExists, setVideoExists] = useState<boolean>(false);

  const fetcher = useCallback(async () => {
    const stream: Stream = await getStream(id);
    return stream;
  }, [id]);

  const { data: stream, revalidate } = useSWR([id], () => fetcher());

  useEffect(() => {
    if (user && user.admin && stream && !lastSessionLoading) {
      setLastSessionLoading(true);
      getAdminStreams({
        sessionsonly: true,
        limit: 1,
        order: "createdAt-true",
        filters: [{ id: "parentId", value: stream.id }],
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
        setIngest(ingest);
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [id]);

  useEffect(() => {
    if (stream?.isActive) {
      setVideoExists(true);
    } else {
      setVideoExists(false);
    }
  }, [stream?.isActive]);

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  let { broadcasterHost, region } = stream || {};
  if (!broadcasterHost && lastSession && lastSession.broadcasterHost) {
    broadcasterHost = lastSession.broadcasterHost;
  }
  if (!region && lastSession && lastSession.region) {
    region = lastSession.region;
  }
  let broadcasterPlaybackUrl;
  const playbackId = (stream || {}).playbackId || "";
  const domain = isStaging() ? "monster" : "com";
  const globalIngestUrl = `rtmp://rtmp.livepeer.${domain}/live`;
  const globalPlaybackUrl = `https://cdn.livepeer.${domain}/hls/${playbackId}/index.m3u8`;

  if (stream && stream.region && !lastSession) {
    broadcasterPlaybackUrl = `https://${stream.region}.livepeer.${domain}/stream/${stream.id}.m3u8`;
  } else if (lastSession && lastSession.region) {
    broadcasterPlaybackUrl = `https://${lastSession.region}.livepeer.${domain}/stream/${playbackId}.m3u8`;
  }

  return (
    <Layout
      id="streams"
      breadcrumbs={[
        { title: "Streams", href: "/dashboard/streams" },
        { title: stream?.name },
      ]}>
      <Box css={{ p: "$6" }}>
        {stream ? (
          <>
            <Flex
              justify="between"
              align="end"
              css={{
                borderBottom: "1px solid",
                borderColor: "$mauve6",
                pb: "$3",
                mb: "$5",
                width: "100%",
              }}>
              <Heading size="2">
                <Flex css={{ ai: "center" }}>
                  <Box
                    css={{
                      fontWeight: 600,
                      letterSpacing: "0",
                      mr: "$2",
                    }}>
                    {stream.name}
                  </Box>
                  {stream.isActive ? (
                    <Badge
                      size="2"
                      variant="green"
                      css={{ mt: "$1", letterSpacing: 0 }}>
                      <Box css={{ mr: "$1" }}>
                        <Status size="1" variant="green" />
                      </Box>
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      size="2"
                      css={{
                        mt: "$1",
                        letterSpacing: 0,
                      }}>
                      <Box css={{ mr: "$1" }}>
                        <Status size="1" />
                      </Box>
                      Idle
                    </Badge>
                  )}
                  {stream.suspended && (
                    <Badge
                      size="2"
                      variant="red"
                      css={{
                        ml: "$1",
                        mt: "$1",
                        letterSpacing: 0,
                      }}>
                      <Box css={{ mr: 5 }}>
                        <PauseIcon />
                      </Box>
                      Suspended
                    </Badge>
                  )}
                </Flex>
              </Heading>
              <DropdownMenu>
                <DropdownMenuTrigger as={Button}>Actions</DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <Record
                      stream={stream}
                      revalidate={revalidate}
                      isSwitch={false}
                    />
                    <Suspend stream={stream} revalidate={revalidate} />
                    <Delete stream={stream} revalidate={revalidate} />

                    {userIsAdmin && stream.isActive && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Admin only</DropdownMenuLabel>
                        <Terminate stream={stream} revalidate={revalidate} />
                      </>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Flex>
            <Grid gap="8" columns="2" css={{ pb: "$9" }}>
              <Box>
                <Heading size="1" css={{ fontWeight: 600, mb: "$3" }}>
                  Details
                </Heading>
                <Flex
                  css={{
                    justifyContent: "flex-start",
                    alignItems: "baseline",
                    flexDirection: "column",
                  }}>
                  <Box
                    css={{
                      display: "grid",
                      alignItems: "center",
                      gridTemplateColumns: "10em auto",
                      width: "100%",
                      fontSize: "$2",
                      position: "relative",
                    }}>
                    <Cell>Stream name</Cell>
                    <Cell>{stream.name}</Cell>
                    <Cell>Stream ID</Cell>
                    <Cell>
                      <ClipBut text={stream.id}></ClipBut>
                    </Cell>
                    <Cell>Stream key</Cell>
                    <Cell>
                      {keyRevealed ? (
                        <Flex>
                          {stream.streamKey}
                          <CopyToClipboard
                            text={stream.streamKey}
                            onCopy={() => setCopied(2000)}>
                            <Flex
                              css={{
                                alignItems: "center",
                                cursor: "pointer",
                                ml: "$1",
                              }}>
                              <Copy
                                css={{
                                  width: 14,
                                  height: 14,
                                  color: "$hiContrast",
                                }}
                              />
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
                        <Button
                          type="button"
                          variant="violet"
                          onClick={() => setKeyRevealed(true)}>
                          Reveal stream key
                        </Button>
                      )}
                    </Cell>
                    <Cell>RTMP ingest URL</Cell>
                    <Cell css={{ cursor: "pointer" }}>
                      <ShowURL text="" url={globalIngestUrl} anchor={false} />
                    </Cell>
                    <Cell>Playback URL</Cell>
                    <Cell css={{ cursor: "pointer" }}>
                      <ShowURL text="" url={globalPlaybackUrl} anchor={false} />
                    </Cell>
                    <Cell>Record sessions</Cell>
                    <Cell>
                      <Flex css={{ position: "relative", top: "2px" }}>
                        <Box css={{ mr: "$2" }}>
                          <Record stream={stream} revalidate={revalidate} />
                        </Box>
                        <Tooltip
                          multiline
                          content={
                            <div>
                              When enabled, transcoded streaming sessions will
                              be recorded and stored by Livepeer.com. Each
                              recorded session will have a recording .m3u8 URL
                              for playback. This feature is currently in beta
                              and free.
                            </div>
                          }>
                          <Help />
                        </Tooltip>
                      </Flex>
                    </Cell>
                    <Cell>Created at</Cell>
                    <Cell>
                      <RelativeTime
                        id="cat"
                        prefix="createdat"
                        tm={stream.createdAt}
                        swap={true}
                      />
                    </Cell>
                    <Cell>Last seen</Cell>
                    <Cell>
                      <RelativeTime
                        id="last"
                        prefix="lastSeen"
                        tm={stream.lastSeen}
                        swap={true}
                      />
                    </Cell>
                    <Cell>Status</Cell>
                    <Cell>{stream.isActive ? "Active" : "Idle"}</Cell>
                    <Cell>Suspended</Cell>
                    <Cell>{stream.suspended ? "Suspended" : "Normal"}</Cell>
                    {/* {user.admin || isStaging() || isDevelopment() ? (
                      <>
                        <Cell> </Cell>
                        <Cell>
                          <strong>Admin or staging only fields:</strong>
                        </Cell>
                      </>
                    ) : null}
                    {user.admin ? (
                      <>
                        <Cell> </Cell>
                        <Cell>
                          <strong>Admin only fields:</strong>
                        </Cell>
                        <Cell>Deleted</Cell>
                        <Cell>
                          {stream.deleted ? <strong>Yes</strong> : "No"}
                        </Cell>
                        <Cell>Source segments</Cell>
                        <Cell>{stream.sourceSegments || 0}</Cell>
                        <Cell>Transcoded segments</Cell>
                        <Cell>{stream.transcodedSegments || 0}</Cell>
                        <Cell>Source duration</Cell>
                        <Cell>
                          {formatNumber(stream.sourceSegmentsDuration || 0, 0)}{" "}
                          sec (
                          {formatNumber(
                            (stream.sourceSegmentsDuration || 0) / 60,
                            2
                          )}{" "}
                          min)
                        </Cell>
                        <Cell>Transcoded duration</Cell>
                        <Cell>
                          {formatNumber(
                            stream.transcodedSegmentsDuration || 0,
                            0
                          )}{" "}
                          sec (
                          {formatNumber(
                            (stream.transcodedSegmentsDuration || 0) / 60,
                            2
                          )}{" "}
                          min)
                        </Cell>
                        <Cell>Source bytes</Cell>
                        <Cell>{formatNumber(stream.sourceBytes || 0, 0)}</Cell>
                        <Cell>Transcoded bytes</Cell>
                        <Cell>
                          {formatNumber(stream.transcodedBytes || 0, 0)}
                        </Cell>
                        <Cell>Ingest rate</Cell>
                        <Cell>
                          {formatNumber(stream.ingestRate || 0, 3)} bytes/sec (
                          {formatNumber((stream.ingestRate || 0) * 8, 0)})
                          bits/sec
                        </Cell>
                        <Cell>Outgoing rate</Cell>
                        <Cell>
                          {formatNumber(stream.outgoingRate || 0, 3)} bytes/sec
                          ({formatNumber((stream.outgoingRate || 0) * 8, 0)})
                          bits/sec
                        </Cell>
                        <Cell>Papertrail to stream key</Cell>
                        <Cell>
                          <a
                            target="_blank"
                            href={`https://papertrailapp.com/groups/16613582/events?q=${stream.streamKey}`}
                            css={{ userSelect: "all" }}>
                            {stream.streamKey}
                          </a>
                        </Cell>
                        <Cell>Papertrail to playback id</Cell>
                        <Cell>
                          <a
                            target="_blank"
                            href={`https://papertrailapp.com/groups/16613582/events?q=${stream.playbackId}`}
                            css={{ userSelect: "all" }}>
                            {stream.playbackId}
                          </a>
                        </Cell>
                        <Cell>Papertrail to stream id</Cell>
                        <Cell>
                          <a
                            target="_blank"
                            href={`https://papertrailapp.com/groups/16613582/events?q=${stream.id}`}
                            css={{ userSelect: "all" }}>
                            {stream.id}
                          </a>
                        </Cell>
                        <Cell>Region/Broadcaster</Cell>
                        <Cell>
                          {region}{" "}
                          {broadcasterHost ? " / " + broadcasterHost : ""}
                          {stream && stream.mistHost
                            ? " / " + stream.mistHost
                            : ""}
                        </Cell>
                        {broadcasterPlaybackUrl ? (
                          <>
                            <Cell>Broadcaster playback</Cell>
                            <Cell>
                              <a
                                target="_blank"
                                href={broadcasterPlaybackUrl}
                                css={{ userSelect: "all" }}>
                                {broadcasterPlaybackUrl}
                              </a>
                            </Cell>
                          </>
                        ) : null}
                      </>
                    ) : null} */}
                  </Box>
                </Flex>
                <TimedAlert
                  text={resultText}
                  close={() => setResultText("")}
                  variant="info"
                />
                <TimedAlert
                  text={alertText}
                  close={() => setAlertText("")}
                  variant="attention"
                />
              </Box>
              <Box
                css={{
                  maxWidth: "470px",
                  justifySelf: "flex-end",
                  width: "100%",
                }}>
                <Heading size="1" css={{ fontWeight: 600, mb: "$3" }}>
                  Current Stream
                </Heading>

                {videoExists ? (
                  <Box
                    css={{
                      width: "100%",
                      height: 300,
                      borderRadius: "$2",
                      overflow: "hidden",
                      position: "relative",
                    }}>
                    {stream.isActive ? (
                      <Badge
                        size="2"
                        variant="green"
                        css={{
                          position: "absolute",
                          zIndex: 1,
                          left: 10,
                          top: 10,
                          letterSpacing: 0,
                        }}>
                        <Box css={{ mr: 5 }}>
                          <Status size="1" variant="green" />
                        </Box>
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        size="2"
                        css={{
                          position: "absolute",
                          zIndex: 1,
                          left: 10,
                          top: 10,
                          letterSpacing: 0,
                        }}>
                        <Box css={{ mr: 5 }}>
                          <Status size="1" />
                        </Box>
                        Idle
                      </Badge>
                    )}
                    {/* <Player1 /> */}
                    <Player
                      setVideo={setVideoExists}
                      src={globalPlaybackUrl}
                      config={{
                        controlPanelElements: [
                          "time_and_duration",
                          "play_pause",
                          "rewind",
                          "fast_forward",
                          "mute",
                          "volume",
                          "spacer",
                          "fullscreen",
                          "overflow_menu",
                        ],
                        overflowMenuButtons: ["quality"],
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    css={{
                      width: "100%",
                      height: 300,
                      borderRadius: "$2",
                      overflow: "hidden",
                      position: "relative",
                      backgroundColor: "$mauve5",
                    }}>
                    <Badge
                      size="2"
                      css={{
                        position: "absolute",
                        zIndex: 1,
                        left: 10,
                        top: 10,
                        letterSpacing: 0,
                      }}>
                      <Box css={{ mr: 5 }}>
                        <Status size="1" />
                      </Box>
                      Idle
                    </Badge>
                  </Box>
                )}
                <Link href={`/dashboard/streams/${stream?.id}/health`} passHref>
                  <Button
                    as="a"
                    size="3"
                    variant="violet"
                    css={{ mt: "$3", width: "100%", cursor: "pointer" }}>
                    View Stream Health
                  </Button>
                </Link>
              </Box>
            </Grid>

            <StreamSessionsTable streamId={stream.id} />
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
  );
};
export default ID;
