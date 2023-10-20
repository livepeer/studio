import {
  Container,
  Box,
  Flex,
  Text,
  Heading,
  Link as A,
  Button,
} from "@livepeer/design-system";
import Guides from "components/Site/Guides";
import Link from "next/link";
import * as Hi from "react-icons/hi";
import * as Fa from "react-icons/fa";
import * as Fi from "react-icons/fi";
import * as Md from "react-icons/md";
import { FiArrowUpRight } from "react-icons/fi";

const getIconProvider = (provider) => {
  if (provider === "hi") {
    return Hi;
  }
  if (provider === "fa") {
    return Fa;
  }
  if (provider === "fi") {
    return Fi;
  }
  if (provider === "mdi") {
    return Md;
  }
};

const Cards = ({
  backgroundColor = "$loContrast",
  title = null,
  heading = null,
  description = null,
  items,
  ctas,
}) => {
  return (
    <Box css={{ position: "relative", bc: backgroundColor }}>
      {/* <Guides backgroundColor={backgroundColor} /> */}
      <Box
        css={{
          position: "relative",
          py: 40,
        }}>
        <Box
          css={{
            display: "grid",
            grid: "1fr/repeat(1,1fr)",
            position: "relative",
            height: "100%",
            maxWidth: "1145px",
            gap: 20,
            margin: "0 auto",
            "@bp1": {
              grid: "1fr/repeat(2,1fr)",
            },
            "@bp3": {
              grid: "1fr/repeat(3,1fr)",
            },
          }}>
          {items.map((item, i) => {
            return (
              <Box
                key={i}
                css={{
                  bc: "white",
                  py: "$4",
                  pl: "$6",
                  pr: "$6",
                  width: "100%",
                  borderRadius: "$4",
                  "@bp1": {
                    pl: "$3",
                    "&:nth-child(odd)": {
                      pl: "$6",
                    },
                  },
                  "@bp3": {
                    "&:nth-child(odd)": {
                      pl: "$3",
                    },
                  },
                }}>
                {item?.icon?.provider && (
                  <Box
                    css={{
                      mb: "$3",
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: 1000,
                      display: "flex",
                      ai: "center",
                      color: "$hiContrast",
                      jc: "center",
                      background:
                        "linear-gradient(90deg, $green4 0%, $green5 100%)",
                    }}>
                    {getIconProvider(item.icon.provider)[item.icon.name]()}
                  </Box>
                )}
                <Text
                  css={{
                    position: "relative",
                    fontWeight: 600,
                    mb: "$2",
                    fontSize: "$5",
                  }}>
                  {item.title}
                </Text>
                <Text variant="gray" css={{ lineHeight: 1.6 }}>
                  {item.description}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default Cards;
