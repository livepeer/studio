/** @jsxImportSource @emotion/react */
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import {
  Spinner,
  Box,
  Button,
  Flex,
  Heading,
  Container,
  Link as A,
  Label,
  Radio,
  Alert,
  Close,
} from "@theme-ui/components";
import Layout from "../../../layouts/admin";
import useLoggedIn from "../../../hooks/use-logged-in";
import { Stream, User } from "@livepeer.studio/api";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Copy from "../../../public/img/copy.svg";
import { useRouter } from "next/router";
import Router from "next/router";
import { useApi, usePageVisibility } from "../../../hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import TabbedLayout from "components/Admin/TabbedLayout";
import StreamSessionsTable from "components/Admin/StreamSessionsTable";
import DeleteStreamModal from "components/Admin/DeleteStreamModal";
import ConfirmationModal from "components/Admin/ConfirmationModal";
import Modal from "components/Admin/Modal";
import Help from "../../../public/img/help.svg";
import {
  pathJoin,
  isStaging,
  isDevelopment,
  formatNumber,
} from "../../../lib/utils";
import { RenditionsDetails } from "components/Admin/StreamsTable";
import { RelativeTime } from "components/Admin/CommonAdminTable";
import { getTabs as getTabsAdmin } from "../admin";
import SuspendUserModal from "components/Admin/SuspendUserModal";

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
    <Alert variant={variant} sx={{ m: 2 }}>
      {text}
      <Close variant={closeVariant} ml="auto" mr={-2} onClick={() => close()} />
    </Alert>
  ) : null;
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
    <Flex sx={{ justifyContent: "flex-start", alignItems: "center" }}>
      {text ? (
        <Box sx={{ minWidth: 125, fontSize: 12, paddingRight: "1em" }}>
          {text}:
        </Box>
      ) : null}
      <CopyToClipboard text={ccurl} onCopy={() => setCopied(2000)}>
        <Flex sx={{ alignItems: "center" }}>
          {anchor ? (
            <Box
              as="a"
              sx={{ fontSize: 12, fontFamily: "monospace", mr: 1 }}
              href={url}
              target="_blank">
              {url}
            </Box>
          ) : (
            <Box
              as="span"
              sx={{ fontSize: 12, fontFamily: "monospace", mr: 1 }}>
              {url}
            </Box>
          )}
          <Copy
            sx={{
              mr: 1,
              cursor: "pointer",
              width: 14,
              height: 14,
              color: "offBlack",
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
        sx={{
          alignItems: "center",
          cursor: "pointer",
          ml: 0,
          mr: 0,
        }}>
        <Box sx={{ mr: 2 }}>{text}</Box>
        <Copy
          sx={{
            mr: 1,
            width: 14,
            height: 14,
            color: "offBlack",
          }}
        />
        {!!isCopied && (
          <Box sx={{ fontSize: 12, color: "offBlack" }}>Copied</Box>
        )}
      </Flex>
    </CopyToClipboard>
  );
};

const ID = () => {
  useLoggedIn();
  const {
    user,
    logout,
    getStreamInfo,
    deleteStream,
    getIngest,
    patchStream,
    getAdminStreams,
    generateJwt,
    terminateStream,
  } = useApi();
  const userIsAdmin = user && user.admin;
  const router = useRouter();
  const { query } = router;
  const id = useMemo(() => {
    let id = query.id?.toString() ?? "";

    // trim a potential `video(rec)+` prefix from the playback ID
    const plusSign = id.indexOf("+");
    if (plusSign >= 0 && plusSign < id.length - 1) {
      id = id.substring(plusSign + 1);
    }

    return id;
  }, [query.id]);
  const [stream, setStream] = useState<Stream>(null);
  const [streamOwner, setStreamOwner] = useState<User>(null);
  const [jwt, setJwt] = useState<string>(null);
  const [ingest, setIngest] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [terminateModal, setTerminateModal] = useState(false);
  const [suspendUserModal, setSuspendUserModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [recordOffModal, setRecordOffModal] = useState(false);
  const [isCopied, setCopied] = useState(0);
  const [lastSession, setLastSession] = useState(null);
  const [lastSessionLoading, setLastSessionLoading] = useState(false);
  const [regionalUrlsVisible, setRegionalUrlsVisible] = useState(false);
  const [resultText, setResultText] = useState("");
  const [alertText, setAlertText] = useState("");

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
        setIngest(ingest);
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [id]);
  const fetchStream = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const [res, info] = await getStreamInfo(id);
      if (res.status === 404) {
        return setNotFound(true);
      } else if ("errors" in info) {
        throw new Error(info.errors.toString());
      }

      setStream(info.stream as Stream);
      setStreamOwner(info.user as User);
    } catch (err) {
      console.error(err); // todo: surface this
    }
  }, [id]);
  const fetchJwt = useCallback(async () => {
    if (
      stream?.playbackPolicy?.type != "public" &&
      stream?.playbackId &&
      user.admin &&
      !jwt
    ) {
      const streamJwt = await generateJwt(stream.playbackId);
      setJwt(streamJwt);
    }
  }, [stream]);
  useEffect(() => {
    fetchStream();
  }, [fetchStream]);
  const isVisible = usePageVisibility();
  useEffect(() => {
    if (!isVisible || notFound) {
      return;
    }
    const interval = setInterval(function () {
      fetchJwt();
      fetchStream();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStream, fetchJwt, isVisible, notFound]);
  const userField = useMemo(() => {
    let value = streamOwner?.email;
    if (streamOwner?.admin) {
      value += " (admin)";
    }
    if (streamOwner?.suspended) {
      value += " (suspended)";
    }
    return value;
  }, [streamOwner?.email, streamOwner?.admin, streamOwner?.suspended]);
  const playerUrl = useMemo(() => {
    if (!stream?.playbackId) {
      return "https://lvpr.tv/";
    }
    const autoplay = query.autoplay?.toString() ?? "0";
    let url = `https://lvpr.tv/?v=${stream?.playbackId}&autoplay=${autoplay}`;
    if (jwt) {
      url += `&jwt=${jwt}`;
    }
    if (isStaging() || isDevelopment()) {
      url += "&monster";
    }
    return url;
  }, [query.autoplay, stream?.playbackId]);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const close = () => {
    setSuspendModal(false);
    setTerminateModal(false);
    setSuspendUserModal(false);
    setDeleteModal(false);
    setRecordOffModal(false);
  };

  if (!user) {
    return <Layout />;
  }

  const getIngestURL = (
    stream: Stream,
    showKey: boolean,
    i: number,
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
    await patchStream(stream.id, { record });
    setStream(null); // make sure that we will load updated stream
  };

  const isAdmin = query.admin === "true";
  const tabs = getTabsAdmin(2);
  const backLink = isAdmin ? "/app/admin/streams" : "/app/user";
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
  const globalPlaybackUrl = `https://livepeercdn.${domain}/hls/${playbackId}/index.m3u8`;

  if (stream && stream.region && !lastSession) {
    broadcasterPlaybackUrl = `https://${stream.region}.livepeer.${domain}/stream/${stream.id}.m3u8`;
  } else if (lastSession && lastSession.region) {
    broadcasterPlaybackUrl = `https://${lastSession.region}.livepeer.${domain}/stream/${playbackId}.m3u8`;
  }

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <Container>
        {suspendModal && stream && (
          <ConfirmationModal
            actionText="Confirm"
            onClose={close}
            onAction={() => {
              const suspended = !stream.suspended;
              patchStream(stream.id, { suspended })
                .then((res) => {
                  stream.suspended = suspended;
                  setStream({ ...stream, suspended });
                })
                .catch((e) => {
                  console.error(e);
                })
                .finally(close);
            }}>
            {!stream.suspended ? (
              <div>
                Are you sure you want to suspend and block this stream? Any
                active stream sessions will immediately end. New sessions will
                be prevented from starting until unchecked.
              </div>
            ) : (
              <div>
                Are you sure you want to allow new stream sessions again?
              </div>
            )}
          </ConfirmationModal>
        )}
        {terminateModal && stream && (
          <ConfirmationModal
            actionText="Terminate"
            onClose={close}
            onAction={() => {
              terminateStream(stream.id)
                .then((res) => {
                  setResultText(`Success: ${res}`);
                })
                .catch((e) => {
                  console.error(e);
                  setAlertText(`${e}`);
                })
                .finally(close);
            }}>
            <div>
              Are you sure you want to terminate (stop running live) stream{" "}
              <b>{stream.name}</b>? Terminating a stream will break RTMP
              connection.
            </div>
          </ConfirmationModal>
        )}
        <SuspendUserModal
          user={streamOwner}
          isOpen={suspendUserModal}
          onClose={close}
          onSuspend={fetchStream}
        />
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
                sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondarySmall"
                onClick={() => {
                  close();
                  doSetRecord(stream, false);
                }}>
                Turn off recording
              </Button>
            </Flex>
          </Modal>
        )}
        <Link href={backLink} passHref legacyBehavior>
          <A
            sx={{
              mt: 4,
              fontWeight: 500,
              mb: 3,
              color: "text",
              display: "block",
            }}>
            {"← stream list"}
          </A>
        </Link>
        {stream ? (
          <>
            <Flex
              sx={{
                justifyContent: "flex-start",
                alignItems: "baseline",
                flexDirection: "column",
              }}>
              <Heading as="h3" sx={{ mb: "0.5em" }}>
                {stream.name}
              </Heading>
              <Flex
                sx={{
                  justifyContent: "flex-end",
                  mb: 3,
                }}>
                <Box
                  sx={{
                    display: "grid",
                    alignItems: "center",
                    gridTemplateColumns: "10em auto",
                    width: "60%",
                    fontSize: 0,
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
                            sx={{
                              alignItems: "center",
                              cursor: "pointer",
                              ml: 1,
                            }}>
                            <Copy
                              sx={{
                                mr: 1,
                                width: 14,
                                height: 14,
                                color: "offBlack",
                              }}
                            />
                            {!!isCopied && (
                              <Box sx={{ fontSize: 12, color: "offBlack" }}>
                                Copied
                              </Box>
                            )}
                          </Flex>
                        </CopyToClipboard>
                      </Flex>
                    ) : (
                      <Button
                        type="button"
                        variant="outlineSmall"
                        onClick={() => setKeyRevealed(true)}
                        sx={{ mr: 0, py: "4px", fontSize: 0 }}>
                        Show secret stream key
                      </Button>
                    )}
                  </Cell>
                  <Cell>RTMP ingest URL</Cell>
                  <Cell>
                    <ShowURL text="" url={globalIngestUrl} anchor={true} />
                  </Cell>
                  <Cell>Playback URL</Cell>
                  <Cell>
                    <ShowURL text="" url={globalPlaybackUrl} anchor={true} />
                  </Cell>
                  <Box
                    sx={{
                      mx: "0.4em",
                      mt: "0.4em",
                      mb: "0",
                      gridColumn: "1/-1",
                    }}>
                    <Box
                      onClick={() =>
                        setRegionalUrlsVisible(!regionalUrlsVisible)
                      }
                      sx={{
                        cursor: "pointer",
                        display: "inline-block",
                        transform: regionalUrlsVisible
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.4s ease",
                      }}>
                      ▶
                    </Box>{" "}
                    Regional ingest and playback URL pairs
                  </Box>
                  <Box
                    sx={{
                      gridColumn: "1/-1",
                      position: "relative",
                      overflow: "hidden",
                      mb: "0.8em",
                    }}>
                    <Box
                      sx={{
                        position: "relative",
                        overflow: "hidden",
                        transition: "margin-bottom .4s ease",
                        mb: regionalUrlsVisible ? "0" : "-100%",
                        display: "grid",
                        alignItems: "center",
                        gridTemplateColumns: "10em auto",
                      }}>
                      <Box
                        sx={{
                          mx: "0.4em",
                          mt: "0.4em",
                          gridColumn: "1/-1",
                          width: ["100%", "100%", "75%", "50%"],
                        }}>
                        The global RTMP ingest and playback URL pair above auto
                        detects livestreamer and viewer locations to provide the
                        optimal Livepeer Studio experience.
                        <Link
                          href="/docs/guides/ingest-playback-url-pair"
                          passHref
                          legacyBehavior>
                          <A target="_blank">
                            <i>
                              Learn more about forgoing the global ingest and
                              playback URLs before selecting a regional URL
                              pair.
                            </i>
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
                              <ShowURL
                                text=""
                                url={getIngestURL(stream, false, i)}
                                urlToCopy={getIngestURL(stream, false, i)}
                                anchor={false}
                              />
                            </Cell>
                            <Box
                              sx={{
                                m: "0.4em",
                                mb: "1.4em",
                              }}>
                              Playback URL {i + 1}
                            </Box>
                            <Box
                              sx={{
                                m: "0.4em",
                                mb: "1.4em",
                              }}>
                              <ShowURL
                                text=""
                                url={getPlaybackURL(stream, i)}
                                anchor={true}
                              />
                            </Box>
                          </>
                        );
                      })}
                    </Box>
                  </Box>
                  <Box sx={{ m: "0.4em", gridColumn: "1/-1" }}>
                    <hr />
                  </Box>
                  <Cell>Record sessions</Cell>
                  <Box
                    sx={{
                      m: "0.4em",
                      justifySelf: "flex-start",
                      cursor: "pointer",
                    }}>
                    <Flex
                      sx={{
                        alignItems: "flex-start",
                        justifyItems: "center",
                      }}>
                      <Label
                        onClick={() => {
                          if (!stream.record) {
                            doSetRecord(stream, true);
                          }
                        }}>
                        <Radio
                          autocomplete="off"
                          name="record-mode"
                          value={`${!!stream.record}`}
                          checked={!!stream.record}
                        />
                        <Flex sx={{ alignItems: "center" }}>On</Flex>
                      </Label>
                      <Label sx={{ ml: "0.5em" }}>
                        <Radio
                          autocomplete="off"
                          name="record-mode"
                          value={`${!stream.record}`}
                          checked={!stream.record}
                          onClick={(e) => {
                            if (stream.record) {
                              setRecordOffModal(true);
                            }
                          }}
                        />
                        <Flex sx={{ alignItems: "center" }}>Off</Flex>
                      </Label>
                      <Flex
                        sx={{
                          ml: "0.5em",
                          minWidth: "24px",
                          height: "24px",
                          alignItems: "center",
                        }}>
                        <Help
                          data-tooltip-id={`tooltip-record-${stream.id}`}
                          data-tooltip-content={`When checked, transcoded streaming sessions will be recorded and stored by Livepeer Studio. Each recorded session will have a recording .m3u8 URL for playback and an MP4 download link.`}
                          sx={{
                            color: "muted",
                            cursor: "pointer",
                            ml: 1,
                            width: "18px",
                            height: "18px",
                          }}
                        />
                      </Flex>
                    </Flex>
                    <Tooltip id={`tooltip-record-${stream.id}`} />
                  </Box>
                  <Box sx={{ m: "0.4em", gridColumn: "1/-1" }}>
                    <hr />
                  </Box>
                  <Cell>Suspend and block</Cell>
                  <Box
                    sx={{
                      m: "0.4em",
                      justifySelf: "flex-start",
                      cursor: "pointer",
                    }}>
                    <Flex
                      sx={{
                        alignItems: "flex-start",
                        justifyItems: "center",
                      }}>
                      <Label
                        onClick={() => {
                          if (!stream.suspended) {
                            setSuspendModal(true);
                          }
                        }}>
                        <Radio
                          autocomplete="off"
                          name="suspend-mode"
                          value={`${!!stream.suspended}`}
                          checked={!!stream.suspended}
                        />
                        <Flex sx={{ alignItems: "center" }}>On</Flex>
                      </Label>
                      <Label sx={{ ml: "0.5em" }}>
                        <Radio
                          autocomplete="off"
                          name="suspend-mode"
                          value={`${!stream.suspended}`}
                          checked={!stream.suspended}
                          onClick={(e) => {
                            if (stream.suspended) {
                              setSuspendModal(true);
                            }
                          }}
                        />
                        <Flex sx={{ alignItems: "center" }}>Off</Flex>
                      </Label>
                      <Flex
                        sx={{
                          ml: "0.5em",
                          minWidth: "24px",
                          height: "24px",
                          alignItems: "center",
                        }}>
                        <Help
                          data-tooltip-id={`tooltip-suspend-${stream.id}`}
                          data-tooltip-content={`When turned on, any active stream sessions will immediately end. New sessions will be prevented from starting until turned off.`}
                          sx={{
                            color: "muted",
                            cursor: "pointer",
                            ml: 1,
                            width: "18px",
                            height: "18px",
                          }}
                        />
                      </Flex>
                    </Flex>
                    <Tooltip id={`tooltip-suspend-${stream.id}`} />
                  </Box>
                  <Box sx={{ m: "0.4em", gridColumn: "1/-1" }}>
                    <hr />
                  </Box>
                  <Cell>User</Cell>
                  <Cell>{userField}</Cell>
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
                  <Cell>Suspended</Cell>
                  <Cell>{stream.suspended ? "Yes" : " No"}</Cell>
                  {user.admin || isStaging() || isDevelopment() ? (
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
                          2,
                        )}{" "}
                        min)
                      </Cell>
                      <Cell>Transcoded duration</Cell>
                      <Cell>
                        {formatNumber(
                          stream.transcodedSegmentsDuration || 0,
                          0,
                        )}{" "}
                        sec (
                        {formatNumber(
                          (stream.transcodedSegmentsDuration || 0) / 60,
                          2,
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
                        {formatNumber(stream.outgoingRate || 0, 3)} bytes/sec (
                        {formatNumber((stream.outgoingRate || 0) * 8, 0)})
                        bits/sec
                      </Cell>
                      <Cell>Papertrail to stream key</Cell>
                      <Cell>
                        <Box
                          as="a"
                          target="_blank"
                          href={`https://papertrailapp.com/groups/16613582/events?q=${stream.streamKey}`}
                          sx={{ userSelect: "all" }}>
                          {stream.streamKey}
                        </Box>
                      </Cell>
                      <Cell>Papertrail to playback id</Cell>
                      <Cell>
                        <Box
                          as="a"
                          target="_blank"
                          href={`https://papertrailapp.com/groups/16613582/events?q=${stream.playbackId}`}
                          sx={{ userSelect: "all" }}>
                          {stream.playbackId}
                        </Box>
                      </Cell>
                      <Cell>Papertrail to stream id</Cell>
                      <Cell>
                        <Box
                          as="a"
                          target="_blank"
                          href={`https://papertrailapp.com/groups/16613582/events?q=${stream.id}`}
                          sx={{ userSelect: "all" }}>
                          {stream.id}
                        </Box>
                      </Cell>
                      <Cell>JWT for gated stream</Cell>
                      <Cell>{jwt}</Cell>
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
                            <Box
                              as="a"
                              target="_blank"
                              href={broadcasterPlaybackUrl}
                              sx={{ userSelect: "all" }}>
                              {broadcasterPlaybackUrl}
                            </Box>
                          </Cell>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </Box>
                <Box
                  sx={{
                    display: "block",
                    alignItems: "center",
                    width: "40%",
                  }}>
                  <iframe
                    src={playerUrl}
                    style={{ width: "100%", aspectRatio: "4 / 3" }}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                    sandbox="allow-same-origin; allow-scripts"></iframe>
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
            </Flex>
            <Flex
              sx={{
                justifyContent: "flex-end",
                mb: 3,
              }}>
              {userIsAdmin ? (
                <Flex>
                  <Button
                    sx={{ mr: 3 }}
                    type="button"
                    variant="outlineSmall"
                    onClick={() => setTerminateModal(true)}>
                    Terminate
                  </Button>
                </Flex>
              ) : null}
              {userIsAdmin ? (
                <Flex>
                  <Button
                    sx={{ mr: 3 }}
                    type="button"
                    variant="outlineSmall"
                    disabled={
                      streamOwner?.id === user?.id ||
                      streamOwner?.suspended === true
                    }
                    onClick={() => setSuspendUserModal(true)}>
                    Suspend User
                  </Button>
                </Flex>
              ) : null}
              <Button
                type="button"
                variant="outlineSmall"
                onClick={() => setDeleteModal(true)}>
                Delete
              </Button>
            </Flex>
            <StreamSessionsTable
              streamId={stream.id}
              streamName={stream.name}
            />
          </>
        ) : notFound ? (
          <Box>Not found</Box>
        ) : (
          <Flex sx={{ justifyContent: "center", alignItems: "center" }}>
            <Spinner sx={{ mr: "1em" }} />
            <Box sx={{ color: "text" }}>Loading</Box>
          </Flex>
        )}
      </Container>
    </TabbedLayout>
  );
};
export default ID;
