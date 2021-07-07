/** @jsx jsx */
import { jsx } from "theme-ui";
import { useEffect, useState, useCallback, useMemo } from "react";
import useApi, { StreamInfo } from "../../hooks/use-api";
import { Box, Input, Container, Heading } from "@theme-ui/components";
import Link from "next/link";
import Layout from "../../layouts";
import useLoggedIn from "../../hooks/use-logged-in";
import TabbedLayout from "../../components/TabbedLayout";
import { getTabs } from "./user";
import VideoContainer from "components/TestPlayer/videoContainer";
import Chart from "components/Chart";
import JSONHighlighter from "components/JSONHighlighter";

type Props = {
  active?: boolean;
};

const interval = 10000;
const maxItems = 6;

const Arrow = ({ active }: Props) => {
  return (
    <Box
      as="svg"
      sx={{
        marginTop: ["0", "80px"],
        justifySelf: "center",
        transform: ["rotate(90deg)", "rotate(360deg)"],
      }}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23.5" fill="white" stroke="#E6E6E6" />
      <path
        d="M17 24H31"
        stroke={active ? "#943CFF" : "#CCCCCC"}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M24 17L31 24L24 31"
        stroke={active ? "#943CFF" : "#CCCCCC"}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Box>
  );
};

const Checked = () => {
  return (
    <Box
      as="svg"
      sx={{ ml: "12px" }}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.72 8.79L10.43 13.09L8.78 11.44C8.69036 11.3353 8.58004 11.2503 8.45597 11.1903C8.33191 11.1303 8.19678 11.0965 8.05906 11.0912C7.92134 11.0859 7.78401 11.1091 7.65568 11.1594C7.52736 11.2096 7.41081 11.2859 7.31335 11.3833C7.2159 11.4808 7.13964 11.5974 7.08937 11.7257C7.03909 11.854 7.01589 11.9913 7.02121 12.1291C7.02653 12.2668 7.06026 12.4019 7.12028 12.526C7.1803 12.65 7.26532 12.7604 7.37 12.85L9.72 15.21C9.81344 15.3027 9.92426 15.376 10.0461 15.4258C10.1679 15.4755 10.2984 15.5008 10.43 15.5C10.6923 15.4989 10.9437 15.3947 11.13 15.21L16.13 10.21C16.2237 10.117 16.2981 10.0064 16.3489 9.88458C16.3997 9.76272 16.4258 9.63201 16.4258 9.5C16.4258 9.36799 16.3997 9.23728 16.3489 9.11542C16.2981 8.99356 16.2237 8.88296 16.13 8.79C15.9426 8.60375 15.6892 8.49921 15.425 8.49921C15.1608 8.49921 14.9074 8.60375 14.72 8.79ZM12 2C10.0222 2 8.08879 2.58649 6.4443 3.6853C4.79981 4.78412 3.51809 6.3459 2.76121 8.17317C2.00433 10.0004 1.8063 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92894 19.0711C6.32746 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2002 20.3147 17.5557C21.4135 15.9112 22 13.9778 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7363 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM12 20C10.4178 20 8.87104 19.5308 7.55544 18.6518C6.23985 17.7727 5.21447 16.5233 4.60897 15.0615C4.00347 13.5997 3.84504 11.9911 4.15372 10.4393C4.4624 8.88743 5.22433 7.46197 6.34315 6.34315C7.46197 5.22433 8.88743 4.4624 10.4393 4.15372C11.9911 3.84504 13.5997 4.00346 15.0615 4.60896C16.5233 5.21447 17.7727 6.23984 18.6518 7.55544C19.5308 8.87103 20 10.4177 20 12C20 14.1217 19.1572 16.1566 17.6569 17.6569C16.1566 19.1571 14.1217 20 12 20Z"
        fill="#943CFF"
      />
    </Box>
  );
};

const Debugger = () => {
  useLoggedIn();
  const { user, getStreamInfo } = useApi();
  const [message, setMessage] = useState("");
  const [manifestUrl, setManifestUrl] = useState("");
  const [info, setInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataChart, setDataChart] = useState<{ name: number; kbps: number }[]>([
    { name: 0, kbps: 0 },
  ]);
  const [videoExists, setVideoExists] = useState<boolean>(false);

  const myJson = useMemo(
    () => JSON.stringify(info?.session?.profiles),
    [info?.session?.profiles]
  );

  const doGetInfo = useCallback(
    async (id: string) => {
      setInfo(null);
      setLoading(true);
      const playbackId = id.split("/")[4];
      const [, rinfo] = await getStreamInfo(playbackId);
      if (!rinfo || rinfo.isSession === undefined) {
        setMessage("Not found");
        setLoading(false);
      } else if (rinfo.stream) {
        const info = rinfo as StreamInfo;
        setInfo(info);
        setMessage("");
        setLoading(false);
      }
    },
    [getStreamInfo]
  );

  const getIngestRate = useCallback(
    async (id: string) => {
      const playbackId = id.split("/")[4];
      const [, rinfo] = await getStreamInfo(playbackId);
      if (!rinfo) {
        setMessage("Not found");
      } else if (rinfo.stream) {
        const newInfo = rinfo as StreamInfo;
        setDataChart((prev) => {
          const lastItem = prev[prev.length - 1];
          return [
            ...prev,
            {
              name: lastItem ? lastItem.name + interval / 1000 : 0,
              kbps: Math.round(newInfo.session.ingestRate / 1000),
            },
          ].slice(Math.max(prev.length - maxItems, 0));
        });
      }
    },
    [getStreamInfo]
  );

  const handleChange = useCallback(
    (e) => {
      setInfo(null);
      const value = e.target.value;
      const pattern = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
          "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
          "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
          "(\\#[-a-z\\d_]*)?$",
        "i"
      );
      if (pattern.test(value)) {
        setManifestUrl(value);
        setLoading(true);
        setTimeout(() => {
          doGetInfo(value);
        }, 1000);
      } else if (value && !pattern.test(value)) {
        setManifestUrl("Not valid");
        setMessage("");
        setInfo(null);
        setLoading(false);
      } else {
        setManifestUrl("");
        setMessage("");
        setInfo(null);
        setLoading(false);
      }
    },
    [doGetInfo]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (info) {
        getIngestRate(manifestUrl);
      } else return null;
    }, interval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [getIngestRate, info]);

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  const tabs = getTabs(2);
  return (
    <TabbedLayout tabs={tabs}>
      <Box
        sx={{
          width: "100%",
          pt: 5,
          pb: 5,
          borderColor: "muted",
        }}>
        <Container
          sx={{
            display: "flex",
            flexDirection: "column",
          }}>
          <Box
            sx={{
              mb: 4,
              display: "flex",
              flexDirection: "column",
              marginBottom: "48px",
            }}>
            <Heading as="h2" sx={{ fontSize: 5, mb: "16px" }}>
              Test Player
            </Heading>
            <Box sx={{ color: "offBlack" }}>
              Test and debug your Livepeer.com stream. For more information
              follow the step-by-step process in the{" "}
              <Link href="/docs/guides/debugging-guide" passHref>
                <Box
                  as="a"
                  sx={{
                    textDecoration: "underline",
                    fontWeight: "bold",
                  }}>
                  Livepeer.com debugging guide.
                </Box>
              </Link>
            </Box>
          </Box>
          <Box sx={{ mb: 5 }}>
            <Box
              as="form"
              sx={{
                display: "flex",
                justifyContent: "flex-start",
              }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: [
                    `${
                      message === "Not found" ||
                      loading ||
                      manifestUrl === "Not valid" ||
                      !videoExists
                        ? "column"
                        : message !== "Not found" && info
                        ? "row"
                        : ""
                    }`,
                    "row",
                  ],
                  alignItems: [
                    `${
                      message === "Not found" ||
                      loading ||
                      manifestUrl === "Not valid" ||
                      !videoExists
                        ? "flex-start"
                        : "center"
                    }`,
                    "center",
                  ],
                  width: "100%",
                }}>
                <Input
                  sx={{
                    width: ["100%", "470px"],
                    borderRadius: "8px",
                    border: "1px solid #CCCCCC",
                    height: "48px",
                    alignSelf: "center",
                  }}
                  label="manifestUrl"
                  name="manifestUrl"
                  required
                  placeholder="Playback URL"
                  onChange={handleChange}
                />
                {loading && (
                  <Box sx={{ mt: ["16px", "0"], ml: ["0", "12px"] }}>
                    Loading...
                  </Box>
                )}
                {!info && manifestUrl === "Not valid" && !loading && (
                  <Box sx={{ mt: ["16px", "0"], ml: ["0", "12px"] }}>
                    Not a valid url.
                  </Box>
                )}
                {!info &&
                  manifestUrl !== "Not valid" &&
                  !loading &&
                  manifestUrl && (
                    <Box sx={{ mt: ["16px", "0"], ml: ["0", "12px"] }}>
                      Stream not found.
                    </Box>
                  )}
                {info && !videoExists && !loading && (
                  <Box sx={{ mt: ["16px", "0"], ml: ["0", "12px"] }}>
                    The stream exists but the url is invalid.
                  </Box>
                )}
                {info && videoExists && <Checked />}
              </Box>
            </Box>
            <Box
              sx={{
                mt: "12px",
                fontSize: "12px",
                color: "rgba(0,0,0,.5)",
                fontStyle: "italic",
                wordBreak: "break-word",
              }}>
              ie. https://fra-cdn.livepeer.com/hls/123456abcdef7890/index.m3u8
            </Box>
            <Box
              sx={{
                mt: "2px",
                fontSize: "12px",
                color: "rgba(0,0,0,.5)",
                fontStyle: "italic",
                wordBreak: "break-word",
              }}>
              Stream playback will work in all browsers and devices, but this
              test player tool works best in Chrome.
            </Box>
          </Box>
          <Box
            sx={{
              display: "grid",
              alignItems: "center",
              gridTemplateColumns: ["1fr", "1fr 50px 1fr"],
              width: "100%",
              gap: "24px",
            }}>
            <VideoContainer
              manifestUrl={manifestUrl}
              title="Your source stream only"
              description="Only the source is streaming."
            />
            <Arrow active={videoExists} />
            <VideoContainer
              manifestUrl={manifestUrl}
              title="Source stream + Livepeer.com transcoded renditions"
              description="Adaptive bitrate streaming"
              withOverflow
              setVideo={setVideoExists}
            />
          </Box>
          <Box
            as="hr"
            sx={{
              width: "100%",
              color: "#E6E6E6",
              margin: "40px 0 48px",
            }}
          />
          <Box>
            <Box
              as="h1"
              sx={{ fontSize: "32px", fontWeight: "600", mb: "40px" }}>
              Stream info
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: ["1fr", "1fr 1fr"],
                gap: "64px",
                width: "100%",
              }}>
              <Box>
                <Box
                  as="p"
                  sx={{ fontSize: "20px", fontWeight: "600", mb: "8px" }}>
                  Session ingest rate
                </Box>
                <Box
                  as="p"
                  sx={{
                    fontSize: "16px",
                    color: "offBlack",
                    marginBottom: "48px",
                  }}>
                  After the stream loads, ingest rate updates every 10 seconds.
                </Box>
                <Chart data={info && videoExists ? dataChart : null} />
              </Box>
              <Box>
                <Box
                  as="p"
                  sx={{ fontSize: "20px", fontWeight: "600", mb: "19px" }}>
                  Status
                </Box>
                {info?.stream && videoExists ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        background: "#00EB88",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        mr: "16px",
                      }}
                    />
                    <p>Active</p>
                  </Box>
                ) : (
                  <Box as="p" sx={{ fontSize: "16px", color: "offBlack" }}>
                    No data
                  </Box>
                )}
                <Box
                  as="p"
                  sx={{
                    fontSize: "20px",
                    fontWeight: "600",
                    margin: "40px 0 16px",
                  }}>
                  Playback settings
                </Box>

                <Box
                  sx={{
                    background: "#FBFBFB",
                    border: "1px solid #CCCCCC",
                    borderRadius: "8px",
                    minHeight: info?.session ? "auto" : "128px",
                    width: "100%",
                    maxWidth: "100%",
                    overflowX: "scroll",
                    padding: "16px",
                  }}>
                  {info?.session && videoExists && (
                    <JSONHighlighter json={myJson} />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </TabbedLayout>
  );
};

export default Debugger;
