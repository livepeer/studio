import { Box, Flex, Text } from "@livepeer/design-system";
import { GoDotFill } from "react-icons/go";
import Image from "next/image";
import React from "react";

export default function ProjectTile({
  name,
  logo,
  url,
  activeStreams,
  inProgressUploads,
  ...props
}) {
  return (
    <Box
      css={{
        border: "1px solid",
        borderColor: "$neutral6",
        p: "$4",
        borderRadius: "11px",
        width: "32%",
      }}>
      <Flex
        css={{
          gap: "$3",
        }}
        align={"center"}>
        <Image
          src={logo}
          alt="Project logo"
          style={{
            borderRadius: "10px",
          }}
          width={50}
          height={50}
        />
        <Flex direction={"column"}>
          <Text
            css={{
              fontWeight: 500,
            }}>
            {name}
          </Text>
          <Text
            css={{
              mt: "$0.5",
              color: "$neutral10",
            }}>
            {url}
          </Text>
        </Flex>
      </Flex>
      <Flex
        css={{
          gap: "$3",
          mt: "$6",
        }}>
        <Flex
          align={"center"}
          css={{
            color: "$primary10",
          }}>
          <GoDotFill /> {activeStreams} active streams
        </Flex>
        <Flex
          align={"center"}
          css={{
            color: "$primary10",
          }}>
          <GoDotFill /> {inProgressUploads} in-progress uploads
        </Flex>
      </Flex>
    </Box>
  );
}
