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

const Player = dynamic(import("../../components/Player"), { ssr: false });
const videoThumbnail = "https://i.vimeocdn.com/video/499134794_1280x720.jpg";

const Debugger = () => {
  useLoggedIn();
  const { user, getStreamInfo } = useApi();
  const [message, setMessage] = useState("");
  const [manifestUrl, setManifestUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<StreamInfo | null>(null);

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
          minHeight: "100vh",
        }}>
        <Container
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: ["0px", "50px", "100px"],
          }}>
          <Box
            sx={{
              mb: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "60px",
            }}>
            <img
              src="/img/videoPlayer.svg"
              sx={{
                objectFit: "cover",
                width: "80px",
                height: "80px",
                mb: "35px",
              }}
            />
            <Heading as="h2" sx={{ fontSize: 5, mb: "16px" }}>
              Test Player
            </Heading>
            <Box sx={{ maxWidth: 700, color: "offBlack", textAlign: "center" }}>
              Paste your Playback URL to test and debug your Livepeer.com stream
            </Box>
          </Box>
          <Box sx={{ mb: 5 }}>
            <form
              sx={{
                display: "flex",
                justifyContent: "flex-start",
              }}
              onSubmit={(e: any) => {
                e.preventDefault();

                if (loading || !e.target.manifestUrl.value) {
                  return;
                }
                setManifestUrl(e.target.manifestUrl.value);
                doGetInfo(e.target.manifestUrl.value);
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
          </Box>
          {message === "Not found" && <Box>Stream not found.</Box>}
          {!loading && info && info.stream && (
            <>
              <Grid
                sx={{
                  mb: 4,
                  gridTemplateColumns: "repeat(2, 1fr)",
                }}>
                <Box>
                  <Box sx={{ mb: 2, fontWeight: 600 }}>
                    Source (highest resolution only)
                  </Box>
                  <Player
                    src={manifestUrl}
                    posterUrl={videoThumbnail}
                    config={{
                      abr: { enabled: false },
                      controlPanelElements: [
                        "time_and_duration",
                        "play_pause",
                        "rewind",
                        "fast_forward",
                        "mute",
                        "volume",
                        "spacer",
                        "fullscreen",
                      ],
                      overflowMenuButtons: [],
                    }}
                  />
                </Box>
                <Box>
                  <Box sx={{ mb: 2, fontWeight: 600 }}>
                    ABR (source + transcoded renditions)
                  </Box>
                  <Player
                    src={manifestUrl}
                    posterUrl={videoThumbnail}
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
              </Grid>

              <Box sx={{ fontWeight: 600, fontSize: 3, mb: 3 }}>
                Stream info
              </Box>
              <Grid
                sx={{
                  alignItems: "flex-start",
                  width: "100%",
                  fontSize: 1,
                  gridGap: "10px",
                  gridTemplateColumns: "200px auto",
                }}>
                <Box>Status:</Box>
                <Box>{info.stream.isActive ? "Active" : "Idle"}</Box>

                <Box>Playback settings:</Box>
                <Box
                  sx={{
                    pre: {
                      padding: "0 !important",
                      background: "transparent !important",
                    },
                    code: {
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                    },
                  }}>
                  <SyntaxHighlighter language={"json"}>
                    {JSON.stringify(info.session.profiles)}
                  </SyntaxHighlighter>
                </Box>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </TabbedLayout>
  );
};

export default Debugger;
