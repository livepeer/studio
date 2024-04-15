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
import { NavLink, generalSidebarItems } from "components/Sidebar";
import useProject from "hooks/use-project";
import { useRouter } from "next/router";

export default function ProjectTile({ name, url, id, ...props }) {
  const { setCurrentProject } = useProject();

  const navigate = (id, path) => {
    setCurrentProject(
      {
        id,
      },
      false
    );
  };

  return (
    <Box
      css={{
        border: "1px solid",
        borderColor: "$neutral6",
        p: "$4",
        width: "100%",
        borderRadius: "11px",
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
                p: "$2",
                width: "13rem",
                mt: "$1",
                ml: "-11rem",
              }}>
              <Box
                css={{
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
                    width: "100%",
                  }}>
                  {generalSidebarItems.map((item) => (
                    <Box
                      onClick={() => {
                        navigate(id, item.path);
                      }}>
                      <NavLink key={item.title} href={item.path}>
                        {item.title}
                      </NavLink>
                    </Box>
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
