import React, { useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  TextField,
  Label,
} from "@livepeer.com/design-system";
import Layout from "../../layouts/dashboard";
import { useApi } from "hooks";
import { useEffect, useState } from "react";
import { StreamInfo } from "hooks/use-api";
import Chart from "components/Dashboard/Chart";
import Player from "components/Dashboard/Player";
import { DashboardStreamHealth as Content } from "content";

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
  const [dataChart, setDataChart] = useState<
    { name: number; "Session bitrate": number }[]
  >([{ name: 0, "Session bitrate": 0 }]);
  const [info, setInfo] = useState<StreamInfo | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const { getStreamInfo } = useApi();

  const doGetInfo = useCallback(
    async (id: string) => {
      setInfo(null);
      const playbackId = id.split("/")[4];
      const [, rinfo] = await getStreamInfo(playbackId);
      if (!rinfo || rinfo.isSession === undefined) {
      } else if (rinfo.stream) {
        const info = rinfo as StreamInfo;
        setInfo(info);
      }
    },
    [getStreamInfo]
  );

  const getIngestRate = useCallback(
    async (id: string) => {
      const playbackId = id.split("/")[4];
      const [, rinfo] = await getStreamInfo(playbackId);
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
              "Session bitrate": Math.round(newInfo.session.ingestRate / 1000),
            },
          ].slice(Math.max(prev.length - maxItems, 0));
        });
      }
    },
    [getStreamInfo]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (info) {
        getIngestRate(playbackUrl);
      } else return null;
    }, interval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [getIngestRate, info]);

  return (
    <Layout
      id="streamHealth"
      breadcrumbs={[{ title: "Stream Health" }]}
      {...Content.metaData}>
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
        <Label
          css={{ display: "block", mt: "$4", mb: "$2" }}
          htmlFor="playbackUrl">
          Playback URL
        </Label>
        <TextField
          id="playbackUrl"
          type="url"
          onChange={(e) => {
            doGetInfo(e.target.value);
            setPlaybackUrl(e.target.value);
          }}
          size="2"
          placeholder="ie. https://cdn.livepeer.com/hls/123456abcdef7890/index.m3u8"
        />
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
            <Heading
              as="h2"
              size="1"
              css={{ fontWeight: 600, marginBottom: "$2" }}>
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
              <Player src={playbackUrl} />
            </Box>
          </Box>
          <Arrow active />
          <Box>
            <Heading
              as="h2"
              size="1"
              css={{ fontWeight: 600, marginBottom: "$2" }}>
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
              <Player src={playbackUrl} />
            </Box>
          </Box>
        </Box>
        <Box css={{ my: "$8" }}>
          <Heading
            as="h2"
            size="1"
            css={{ fontWeight: 600, marginBottom: "$2" }}>
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
