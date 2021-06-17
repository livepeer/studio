import React, { useCallback } from "react";
import { Box, Flex, Link, Text } from "@livepeer.com/design-system";
import Layout from "../../../../layouts/dashboard";
import { useRouter } from "next/router";
import { useApi } from "../../../../hooks";
import { useEffect, useState } from "react";

import Chart from "@components/Chart";
import VideoContainer from "@components/TestPlayer/videoContainer";
import { StreamInfo } from "hooks/use-api";

const Arrow = ({ active }: Props) => {
  return (
    <svg
      style={{
        marginTop: "80px",
        justifySelf: "center",
        transform: "rotate(360deg)",
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 17L31 24L24 31"
        stroke={active ? "#943CFF" : "#CCCCCC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
  const [loading, setLoading] = useState<boolean>(false);
  const [videoExists, setVideoExists] = useState<boolean>(false);

  const { getStream, getStreamInfo } = useApi();
  const router = useRouter();
  const { query } = router;
  const id = query.id;

  const doGetInfo = useCallback(
    async (id: string) => {
      setInfo(null);
      setLoading(true);
      const [, rinfo] = await getStreamInfo(id);
      if (!rinfo || rinfo.isSession === undefined) {
        setLoading(false);
      } else if (rinfo.stream) {
        const info = rinfo as StreamInfo;
        setInfo(info);
        setLoading(false);
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

  const playbackUrl = `https://cdn.livepeer.monster/hls/${stream?.playbackId}/index.m3u8`;

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
      <Box css={{ padding: "48px 34px" }}>
        <Flex
          css={{
            borderBottom: "1px solid rgba(0, 0, 0, 0.15)",
            paddingBottom: "22px",
          }}>
          <Text size="7" as="h1" css={{ fontWeight: "bolder" }}>
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
          <VideoContainer
            manifestUrl={playbackUrl}
            title="Your source stream only"
            description="Only the source is streaming."
            setVideo={setVideoExists}
          />
          <Arrow active />
          <VideoContainer
            manifestUrl={playbackUrl}
            title="Source stream + Livepeer.com transcoded renditions"
            description="Adaptive bitrate streaming"
            withOverflow
            setVideo={setVideoExists}
          />
        </Box>
        <Box css={{ marginTop: "70px" }}>
          <Text
            as="h2"
            css={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "12px",
            }}>
            Session ingest rate
          </Text>
          <Text
            as="p"
            css={{ color: "$gray9", fontSize: "14px", marginBottom: "42px" }}>
            After the stream loads, ingest rate updates every 10 seconds.
          </Text>
          <Chart data={dataChart} />
        </Box>
      </Box>
    </Layout>
  );
};
export default Health;
