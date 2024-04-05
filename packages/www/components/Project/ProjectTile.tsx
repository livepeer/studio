import {
  Box,
  Flex,
  Text,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Button,
} from "@livepeer/design-system";
import { GoDotFill } from "react-icons/go";
import Image from "next/image";
import React from "react";
import { sanitizeUrl } from "lib/url-sanitizer";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { HiDotsHorizontal } from "react-icons/hi";
import Link from "next/link";
import { generalSidebarItems } from "components/Sidebar";

export default function ProjectTile({
  name,
  url,

  ...props
}) {
  return (
    <Box
      css={{
        border: "1px solid",
        borderColor: "$neutral6",
        p: "$4",
        borderRadius: "11px",
        width: "30%",
      }}>
      <Flex direction={"column"}>
        <Flex align={"center"} justify={"between"}>
          <Text
            css={{
              fontWeight: 500,
            }}>
            {name || "Untitled project"}
          </Text>
          <DropdownMenu>
            <Box
              as={DropdownMenuTrigger}
              css={{
                border: 0,
                backgroundColor: "transparent",
                "&:focus": {
                  outline: "none",
                },
              }}>
              <HiDotsHorizontal />
            </Box>
            <DropdownMenuContent
              css={{
                border: "1px solid $colors$neutral6",
                p: "$3",
                width: "13rem",
                ml: "-11rem",
                mt: "$1",
              }}>
              <Box
                css={{
                  p: "$1",
                  pb: 0,
                  fontSize: 14,
                  color: "$primary11",
                  a: {
                    textDecoration: "none",
                    color: "$neutral12",
                  },
                }}>
                <Flex
                  direction={"column"}
                  css={{
                    gap: "$3",
                    width: "100%",
                  }}>
                  {generalSidebarItems.map((item) => (
                    <Link href="/" passHref legacyBehavior>
                      {item.title}
                    </Link>
                  ))}
                </Flex>
              </Box>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
        <Text
          css={{
            mt: "$0.5",
            color: "$neutral10",
          }}>
          {sanitizeUrl(url)}
        </Text>
      </Flex>
      <Button
        css={{
          padding: "18px",
          fontSize: "13px",
          marginTop: "40px",
        }}>
        Open Project
      </Button>
    </Box>
  );
}
