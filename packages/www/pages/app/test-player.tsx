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

const Player = dynamic(import("../../components/Player"), { ssr: false });
const licenseServer = "https://widevine-proxy.appspot.com/proxy";
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
    } else if (rinfo.stream && rinfo.user) {
      const info = rinfo as StreamInfo;
      setInfo(info);
      setMessage("");
    }
    setLoading(false);
  };

  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const tabs = getTabs(0);
  return (
    <TabbedLayout tabs={tabs}>
      <Box sx={{ width: "100%", pt: 5, pb: 5, borderColor: "muted" }}>
        <Container>
          <Box sx={{ mb: 4 }}>
            <Heading as="h2" sx={{ fontSize: 5, mb: 2 }}>
              Test Player
            </Heading>
            <Box sx={{ maxWidth: 700, color: "offBlack" }}>
              Test and debug your Livepeer.com stream. For more information
              follow the step-by-step process in the{" "}
              <Link href="/guide" passHref>
                <a sx={{ textDecoration: "underline" }}>
                  Livepeer.com debugging guide.
                </a>
              </Link>
            </Box>
          </Box>
          <Box sx={{ mb: 5 }}>
            <form
              sx={{
                display: "flex",
                justifyContent: "flex-start"
              }}
              onSubmit={(e: any) => {
                e.preventDefault();

                if (loading || !e.target.manifestUrl.value) {
                  return;
                }
                setManifestUrl(e.target.manifestUrl.value);
                doGetInfo(e.target.manifestUrl.value);
              }}
            >
              <Input
                sx={{ width: "30em" }}
                label="manifestUrl"
                name="manifestUrl"
                required
                placeholder="Playback URL"
              />

              <Button
                type="submit"
                variant="primarySmall"
                aria-label="Get info button"
                disabled={loading}
                sx={{ ml: 2 }}
              >
                Load my stream
              </Button>
            </form>
            <Box sx={{ mt: 1, pl: 3, fontSize: 0, color: "rgba(0,0,0,.5)" }}>
              ie. https://fra-cdn.livepeer.com/hls/123456abcdef7890/index.m3u8
            </Box>
          </Box>
          {message === "Not found" && <Box>Stream not found.</Box>}
          {!loading && info && info.stream && (
            <>
              <Grid
                sx={{
                  mb: 4,
                  gridTemplateColumns: "repeat(2, 1fr)"
                }}
              >
                <Box>
                  <Box sx={{ mb: 2, fontWeight: 600 }}>Source</Box>
                  <Player
                    licenseServer={licenseServer}
                    src={manifestUrl}
                    posterUrl={videoThumbnail}
                    config={{
                      abr: { enabled: false },
                      controlPanelElements: [
                        "time_and_duration",
                        "play_pause",
                        "rewind",
                        "fast_forward",
                        "volume",
                        "spacer",
                        "fullscreen"
                      ],
                      overflowMenuButtons: []
                    }}
                  />
                </Box>
                <Box>
                  <Box sx={{ mb: 2, fontWeight: 600 }}>
                    ABR (source + renditions)
                  </Box>
                  <Player
                    licenseServer={licenseServer}
                    src={manifestUrl}
                    posterUrl={videoThumbnail}
                    config={{
                      controlPanelElements: [
                        "time_and_duration",
                        "play_pause",
                        "rewind",
                        "fast_forward",
                        "volume",
                        "spacer",
                        "overflow_menu",
                        "fullscreen"
                      ],
                      overflowMenuButtons: ["quality"]
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
                  gridTemplateColumns: "200px auto"
                }}
              >
                <Box>Status:</Box>
                <Box>{info.stream.isActive ? "Active" : "Inactive"}</Box>

                <Box>Playback settings</Box>
                <Box>{JSON.stringify(info.stream.profiles)}</Box>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </TabbedLayout>
  );
};

export default Debugger;
