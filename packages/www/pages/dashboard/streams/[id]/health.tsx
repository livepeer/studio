import React, { useCallback } from "react";
import { Box, Flex, Heading, Text } from "@livepeer.com/design-system";
import Layout from "../../../../layouts/dashboard";
import { useRouter } from "next/router";
import { useApi } from "../../../../hooks";
import { useEffect, useState } from "react";
import { StreamInfo } from "hooks/use-api";
import Chart from "components/Dashboard/Chart";
import Player from "components/Dashboard/Player";
import { isStaging } from "../../../../lib/utils";

const Arrow = ({ active }: Props) => {
  return (
    <Box
      as="svg"
      css={{
        marginTop: "80px",
        justifySelf: "center",
        transform: "rotate(360deg)",
        color: "$mauve6",
      }}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="24"
        cy="24"
        r="23.5"
        fill="transparent"
        stroke="currentColor"
      />
      <path
        d="M17 24H31"
        stroke={active ? "#6E56CF" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 17L31 24L24 31"
        stroke={active ? "#6E56CF" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
};

type Props = {
  active: boolean;
};

const interval = 10000;
const maxItems = 6;

const Health = () => {
  const [stream, setStream] = useState(null);
  const [dataChart, setDataChart] = useState<{ name: number; kbps: number }[]>([
    { name: 0, kbps: 0 },
  ]);
  const [info, setInfo] = useState<StreamInfo | null>(null);
  const [videoExists, setVideoExists] = useState<boolean>(false);

  const { getStream, getStreamInfo } = useApi();
  const router = useRouter();
  const { query } = router;
  const id = query.id;

  const doGetInfo = useCallback(
    async (id: string) => {
      setInfo(null);
      const [, rinfo] = await getStreamInfo(id);
      if (!rinfo || rinfo.isSession === undefined) {
        return;
      } else if (rinfo.stream) {
        const info = rinfo as StreamInfo;
        setInfo(info);
      }
    },
    [getStreamInfo]
  );

  const getIngestRate = useCallback(
    async (id: string) => {
      const [, rinfo] = await getStreamInfo(id);
      if (!rinfo) {
        return;
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

  useEffect(() => {
    if (!id) {
      return;
    }
    getStream(id)
      .then((stream) => setStream(stream))
      .catch((err) => {
        console.error(err);
      }); // todo: surface this
    doGetInfo(typeof id === "string" ? id : null);
  }, [doGetInfo]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (info) {
        getIngestRate(typeof id === "string" ? id : null);
      } else return null;
    }, interval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [getIngestRate, info]);

  const getPlaybackURL = useCallback(() => {
    const domain = isStaging() ? "monster" : "com";
    return `https://cdn.livepeer.${domain}/hls/${stream?.playbackId}/index.m3u8`;
  }, [stream]);

  if (!stream) {
    return (
      <Layout
        id="streams"
        breadcrumbs={[
          { title: "Streams", href: "/dashboard/streams" },
        ]}></Layout>
    );
  }

  return (
    <Layout
      id="streams"
      breadcrumbs={[
        { title: "Streams", href: "/dashboard/streams" },
        { title: stream?.name, href: `/dashboard/streams/${id}` },
        { title: "Stream Health" },
      ]}>
      <Box css={{ padding: "$6" }}>
        <Flex
          css={{
            borderBottom: "1px solid $colors$mauve6",
            paddingBottom: "$4",
          }}>
          <Text size="7" as="h1" css={{ fontWeight: 600 }}>
            Stream Health
          </Text>
        </Flex>
        <Box
          css={{
            display: "grid",
            alignItems: "center",
            gridTemplateColumns: "1fr 50px 1fr",
            width: "100%",
            gap: "24px",
            marginTop: "34px",
          }}>
          <Box>
            <Heading size="1" css={{ fontWeight: 600, marginBottom: "$2" }}>
              Source Stream
            </Heading>
            <Text
              as="p"
              css={{ color: "$gray9", fontSize: "$3", marginBottom: "$5" }}>
              Only the source.
            </Text>
            <Box
              css={{
                borderRadius: "$3",
                overflow: "hidden",
              }}>
              <Player
                setVideo={setVideoExists}
                src={getPlaybackURL()}
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
          </Box>
          <Arrow active />
          <Box>
            <Heading size="1" css={{ fontWeight: 600, marginBottom: "$2" }}>
              Source + Transcoded Renditions
            </Heading>
            <Text
              as="p"
              css={{ color: "$gray9", fontSize: "$3", marginBottom: "$5" }}>
              Adaptive bitrate streaming
            </Text>
            <Box
              css={{
                borderRadius: "$3",
                overflow: "hidden",
              }}>
              <Player
                setVideo={setVideoExists}
                src={getPlaybackURL()}
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
          </Box>

          {/* <VideoContainer
            smallDescription
            manifestUrl={playbackUrl}
            title="Source stream + Livepeer.com transcoded renditions"
            description="Adaptive bitrate streaming"
            withOverflow
            setVideo={setVideoExists}
          /> */}
        </Box>
        <Box css={{ my: "$8" }}>
          <Heading size="1" css={{ fontWeight: 600, marginBottom: "$2" }}>
            Session ingest rate
          </Heading>
          <Text
            as="p"
            css={{ color: "$gray9", fontSize: "$3", marginBottom: "$7" }}>
            After the stream loads, ingest rate updates every 10 seconds.
          </Text>
          <Chart data={dataChart} />
        </Box>
      </Box>
    </Layout>
  );
};
export default Health;
