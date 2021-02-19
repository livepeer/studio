import { useState } from "react";
import useApi, { StreamInfo } from "../../hooks/use-api";
import { Box, Grid, Input, Container, Heading } from "@theme-ui/components";
import Link from "next/link";
import Layout from "../../components/Layout";
import useLoggedIn from "../../hooks/use-logged-in";
import dynamic from "next/dynamic";
import TabbedLayout from "../../components/TabbedLayout";
import { getTabs } from "./user";
import Button from "../../components/Button";
import SyntaxHighlighter from "react-syntax-highlighter";
import VideoContainer from "components/TestPlayer/videoContainer";

const Arrow = () => {
  return (
    <svg
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
        stroke="#CCCCCC"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M24 17L31 24L24 31"
        stroke="#CCCCCC"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const Debugger = () => {
  useLoggedIn();
  const { user, getStreamInfo } = useApi();
  const [message, setMessage] = useState("");
  const [manifestUrl, setManifestUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<StreamInfo | null>(null);

  const handleChange = (e) => {
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
      setManifestUrl(e.target.value);
      doGetInfo(e.target.value);
    }
    return;
  };

  const doGetInfo = async (id: string) => {
    setLoading(true);
    setInfo(null);
    const playbackId = id.split("/")[4];
    const [, rinfo] = await getStreamInfo(playbackId);
    if (!rinfo || rinfo.isSession === undefined) {
      setMessage("Not found");
    } else if (rinfo.stream) {
      const info = rinfo as StreamInfo;
      setInfo(info);
      setMessage("");
    }
    setLoading(false);
  };

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
              <span
                sx={{
                  color: "black",
                  textDecoration: "underline",
                  fontWeight: "bold",
                }}>
                Livepeer.com debugging guide.
              </span>
            </Box>
          </Box>
          <Box sx={{ mb: 5 }}>
            <form
              sx={{
                display: "flex",
                justifyContent: "flex-start",
              }}>
              <Input
                sx={{
                  width: ["100%", "470px"],
                  borderRadius: "8px",
                  border: "1px solid #CCCCCC",
                  height: "48px",
                }}
                label="manifestUrl"
                name="manifestUrl"
                required
                placeholder="Playback URL"
                onChange={handleChange}
              />
            </form>
            <Box
              sx={{
                mt: "12px",
                fontSize: "12px",
                color: "rgba(0,0,0,.5)",
                fontStyle: "italic",
              }}>
              ie. https://fra-cdn.livepeer.com/hls/123456abcdef7890/index.m3u8
            </Box>
            {message === "Not found" && (
              <Box sx={{ mt: "16px" }}>Stream not found.</Box>
            )}
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
              title="Source"
              description="Highest resolution only"
            />
            <Arrow />
            <VideoContainer
              manifestUrl={manifestUrl}
              title="ABR"
              description="Source + transcoded renditions"
            />
          </Box>
          <hr
            sx={{
              width: "100%",
              color: "#E6E6E6",
              margin: "40px 0 48px",
            }}
          />
          <Box>
            <h1 sx={{ fontSize: "32px", fontWeight: "600", mb: "40px" }}>
              Stream info
            </h1>
            <div
              sx={{
                display: "grid",
                gridTemplateColumns: ["1fr", "1fr 1fr"],
                width: "100%",
              }}>
              <div>
                <p sx={{ fontSize: "20px", fontWeight: "600", mb: "48px" }}>
                  Session ingest rate
                </p>
              </div>
              <div>
                <p sx={{ fontSize: "20px", fontWeight: "600", mb: "19px" }}>
                  Status
                </p>
                {info?.stream ? (
                  <div sx={{ display: "flex", alignItems: "center" }}>
                    <div
                      sx={{
                        background: "#00EB88",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        mr: "16px",
                      }}
                    />
                    <p>Active</p>
                  </div>
                ) : (
                  <p sx={{ fontSize: "16px", color: "offBlack" }}>No data</p>
                )}
                <p
                  sx={{
                    fontSize: "20px",
                    fontWeight: "600",
                    margin: "40px 0 16px",
                  }}>
                  Playback settings
                </p>

                <div
                  sx={{
                    background: "#FBFBFB",
                    border: "1px solid #CCCCCC",
                    borderRadius: "8px",
                    height: "128px",
                    width: "100%",
                  }}>
                  {info?.session && (
                    <SyntaxHighlighter language={"json"}>
                      {JSON.stringify(info?.session.profiles)}
                    </SyntaxHighlighter>
                  )}
                </div>
              </div>
            </div>
          </Box>
        </Container>
      </Box>
    </TabbedLayout>
  );
};

export default Debugger;
