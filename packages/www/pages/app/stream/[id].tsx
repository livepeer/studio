import Link from "next/link";
import ReactTooltip from "react-tooltip";
import {
  Spinner,
  Box,
  Button,
  Flex,
  Heading,
  Container,
  Link as A
} from "@theme-ui/components";
import Layout from "../../../components/Layout";
import useLoggedIn from "../../../hooks/use-logged-in";
import { Stream } from "@livepeer.com/api";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Copy from "../../../public/img/copy.svg";
import { useRouter } from "next/router";
import Router from "next/router";
import { useApi, usePageVisibility } from "../../../hooks";
import { useEffect, useState } from "react";
import TabbedLayout from "../../../components/TabbedLayout";
import { Checkbox } from "../../../components/Table";
import StreamSessionsTable from "../../../components/StreamSessionsTable";
import DeleteStreamModal from "../../../components/DeleteStreamModal";
import Modal from "../../../components/Modal";
import Help from "../../../public/img/help.svg";
import { pathJoin } from "../../../lib/utils";
import {
  RelativeTime,
  RenditionsDetails
} from "../../../components/StreamsTable";
import { getTabs } from "../user";
import { getTabs as getTabsAdmin } from "../admin";

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
    <Flex sx={{ justifyContent: "flex-start", alignItems: "center" }}>
      {text ? (
        <Box sx={{ minWidth: 125, fontSize: 12, paddingRight: "1em" }}>
          {text}:
        </Box>
      ) : null}
      <CopyToClipboard text={ccurl} onCopy={() => setCopied(2000)}>
        <Flex sx={{ alignItems: "center" }}>
          {anchor ? (
            <a
              sx={{ fontSize: 12, fontFamily: "monospace", mr: 1 }}
              href={url}
              target="_blank"
            >
              {url}
            </a>
          ) : (
            <span sx={{ fontSize: 12, fontFamily: "monospace", mr: 1 }}>
              {url}
            </span>
          )}
          <Copy
            sx={{
              mr: 1,
              cursor: "pointer",
              width: 14,
              height: 14,
              color: "offBlack"
            }}
          />
        </Flex>
      </CopyToClipboard>
      {!!isCopied && <Box sx={{ fontSize: 12, color: "offBlack" }}>Copied</Box>}
    </Flex>
  );
};

const Cell = ({ children }) => {
  return <Box sx={{ m: "0.4em" }}>{children}</Box>;
};

export default () => {
  useLoggedIn();
  const {
    user,
    logout,
    getStream,
    deleteStream,
    getIngest,
    setRecord
  } = useApi();
  const router = useRouter();
  const { query, asPath } = router;
  const id = query.id;
  const [stream, setStream] = useState(null);
  const [ingest, setIngest] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [recordOffModal, setRecordOffModal] = useState(false);

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
    if (!id) {
      return;
    }
    getStream(id)
      .then((stream) => setStream(stream))
      .catch((err) => {
        if (err && err.status === 404) {
          setNotFound(true);
        }
        console.error(err);
      }); // todo: surface this
  }, [id]);
  const isVisible = usePageVisibility();
  useEffect(() => {
    if (!isVisible || !id || notFound) {
      return;
    }
    const interval = setInterval(() => {
      getStream(id)
        .then((stream) => setStream(stream))
        .catch((err) => console.error(err)); // todo: surface this
    }, 5000);
    return () => clearInterval(interval);
  }, [id, isVisible]);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const close = () => {
    setDeleteModal(false);
    setRecordOffModal(false);
  };

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  const getIngestURL = (
    stream: Stream,
    showKey: boolean,
    i: number
  ): string => {
    const key = showKey ? stream.streamKey : "";
    return i < ingest.length ? pathJoin(ingest[i].ingest, key) : key || "";
  };
  const getPlaybackURL = (stream: Stream, i: number): string => {
    return i < ingest.length
      ? pathJoin(ingest[i].base, "hls", `${stream.playbackId}/index.m3u8`)
      : stream.playbackId || "";
  };
  const doSetRecord = async (stream: Stream, record: boolean) => {
    console.log(`do set record ${stream.id} record ${record}`);
    setStream(null); // shows 'loading wheel' immediately
    await setRecord(stream.id, record);
    setStream(null); // make sure that we will load updated stream
  };

  const isAdmin = query.admin === "true";
  const tabs = isAdmin ? getTabsAdmin(2) : getTabs(0);
  const backLink = isAdmin ? "/app/admin/streams" : "/app/user";

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <Container>
        {deleteModal && stream && (
          <DeleteStreamModal
            streamName={stream.name}
            onClose={close}
            onDelete={() => {
              deleteStream(stream.id).then(() => Router.replace("/app/user"));
            }}
          />
        )}
        {recordOffModal && stream && (
          <Modal onClose={close}>
            <h3>Are you sure you want to turn off recoding?</h3>
            <p>
              Future stream sessions will not be recorded. In progress stream
              sessions will be recorded. Past sessions recordings will still be
              available.
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
                  close();
                  doSetRecord(stream, false);
                }}
              >
                Turn off recording
              </Button>
            </Flex>
          </Modal>
        )}
        <Link href={backLink} passHref>
          <A
            sx={{
              mt: 4,
              fontWeight: 500,
              mb: 3,
              color: "text",
              display: "block"
            }}
          >
            {"← stream list"}
          </A>
        </Link>
        {stream ? (
          <>
            <Flex
              sx={{
                justifyContent: "flex-start",
                alignItems: "baseline",
                flexDirection: "column"
              }}
            >
              <Heading as="h3" sx={{ mb: "0.5em" }}>
                {stream.name}
              </Heading>
              <Box
                sx={{
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: "10em auto",
                  width: "100%",
                  fontSize: 0
                }}
              >
                <Cell>Stream name</Cell>
                <Cell>{stream.name}</Cell>
                <Cell>Stream ID</Cell>
                <Cell>{stream.id}</Cell>
                <Cell>Stream key</Cell>
                <Cell>
                  {keyRevealed ? (
                    stream.streamKey
                  ) : (
                    <Button
                      type="button"
                      variant="outlineSmall"
                      onClick={() => setKeyRevealed(true)}
                      sx={{ mr: 0, py: "4px", fontSize: 0 }}
                    >
                      Show secret stream key
                    </Button>
                  )}
                </Cell>
                <Box
                  sx={{ mx: "0.4em", mt: "2em", mb: "0", gridColumn: "1/-1" }}
                >
                  <h5>Ingest and playback URL pairs:</h5>
                </Box>
                <Box
                  sx={{
                    mx: "0.4em",
                    mt: "0.4em",
                    mb: "1.5em",
                    gridColumn: "1/-1"
                  }}
                >
                  <Link
                    href="/docs/guides/dashboard/ingest-playback-url-pair"
                    passHref
                  >
                    <A target="_blank">
                      <i>Learn how to pick an ingest and playback URL pair.</i>
                    </A>
                  </Link>
                </Box>
                {!ingest.length && (
                  <Spinner sx={{ mb: 3, width: 32, height: 32 }} />
                )}
                {ingest.map((_, i) => {
                  return (
                    <>
                      <Cell>RTMP ingest URL {i + 1}</Cell>
                      <Cell>
                        {keyRevealed ? (
                          <ShowURL
                            text=""
                            url={getIngestURL(stream, keyRevealed, i)}
                            urlToCopy={getIngestURL(stream, true, i)}
                            anchor={false}
                          />
                        ) : (
                          <Flex
                            sx={{
                              justifyContent: "flex-start",
                              alignItems: "center"
                            }}
                          >
                            <Box
                              sx={{
                                minWidth: 125,
                                fontSize: 12,
                                paddingRight: "1em"
                              }}
                            >
                              {getIngestURL(stream, false, i)}
                              <b>stream-key</b>
                            </Box>
                          </Flex>
                        )}
                      </Cell>
                      <Box
                        sx={{
                          m: "0.4em",
                          mb: "1.4em"
                        }}
                      >
                        Playback URL {i + 1}
                      </Box>
                      <Box
                        sx={{
                          m: "0.4em",
                          mb: "1.4em"
                        }}
                      >
                        <ShowURL
                          text=""
                          url={getPlaybackURL(stream, i)}
                          anchor={true}
                        />
                      </Box>
                    </>
                  );
                })}
                <Box sx={{ m: "0.4em", gridColumn: "1/-1" }}>
                  <hr />
                </Box>
                <Cell>Renditions</Cell>
                <Cell>
                  <RenditionsDetails stream={stream} />
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
                {user.admin ? (
                  <>
                    <Cell> </Cell>
                    <Cell>
                      <strong>Admin only fields:</strong>
                    </Cell>
                    <Cell>Record stream</Cell>
                    <Box
                      sx={{
                        m: "0.4em",
                        justifySelf: "flex-start",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        if (stream.record) {
                          setRecordOffModal(true);
                        } else {
                          doSetRecord(stream, true);
                        }
                      }}
                    >
                      <Flex>
                        <Checkbox value={stream.record} />
                        <ReactTooltip
                          id={`tooltip-record-${stream.id}`}
                          className="tooltip"
                          place="top"
                          type="dark"
                          effect="solid"
                        >
                          <p>
                            When checked, transcoded streaming sessions will be
                            recorded and stored by Livepeer.com.
                            <br /> Each recorded session will have a recording
                            .m3u8 URL for playback. <br />
                            This feature is currently in beta and free.
                          </p>
                        </ReactTooltip>
                        <Help
                          data-tip
                          data-for={`tooltip-record-${stream.id}`}
                          sx={{
                            color: "muted",
                            cursor: "pointer",
                            ml: 1
                          }}
                        />
                      </Flex>
                    </Box>
                    <Cell>Deleted</Cell>
                    <Cell>{stream.deleted ? <strong>Yes</strong> : "No"}</Cell>
                    <Cell>Source segments</Cell>
                    <Cell>{stream.sourceSegments || 0}</Cell>
                    <Cell>Transcoded segments</Cell>
                    <Cell>{stream.transcodedSegments || 0}</Cell>
                    <Cell>Source duration</Cell>
                    <Cell>{stream.sourceSegmentsDuration || 0} sec</Cell>
                    <Cell>Transcoded duration</Cell>
                    <Cell>{stream.transcodedSegmentsDuration || 0} sec</Cell>
                    <Cell>Papertrail to stream key</Cell>
                    <Cell>
                      <a
                        target="_blank"
                        href={`https://papertrailapp.com/groups/16613582/events?q=${stream.streamKey}`}
                        sx={{ userSelect: "all" }}
                      >
                        {stream.streamKey}
                      </a>
                    </Cell>
                    <Cell>Papertrail to playback id</Cell>
                    <Cell>
                      <a
                        target="_blank"
                        href={`https://papertrailapp.com/groups/16613582/events?q=${stream.playbackId}`}
                        sx={{ userSelect: "all" }}
                      >
                        {stream.playbackId}
                      </a>
                    </Cell>
                    <Cell>Papertrail to stream id</Cell>
                    <Cell>
                      <a
                        target="_blank"
                        href={`https://papertrailapp.com/groups/16613582/events?q=${stream.id}`}
                        sx={{ userSelect: "all" }}
                      >
                        {stream.id}
                      </a>
                    </Cell>
                  </>
                ) : null}
              </Box>
            </Flex>
            <Flex
              sx={{
                justifyContent: "flex-end",
                mb: 3
              }}
            >
              <Button
                type="button"
                variant="outlineSmall"
                onClick={() => setDeleteModal(true)}
              >
                Delete
              </Button>
            </Flex>
            {/* <StreamSessionsTable streamId={stream.id} /> */}
          </>
        ) : notFound ? (
          <Box>Not found</Box>
        ) : (
          <Flex sx={{ justifyContent: "center", alignItems: "center" }}>
            <Spinner sx={{ mr: "1em" }} />
            <div sx={{ color: "text" }}>Loading</div>
          </Flex>
        )}
      </Container>
    </TabbedLayout>
  );
};
