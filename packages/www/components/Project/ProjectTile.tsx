import {
  Box,
  Flex,
  Text,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Button,
} from "@livepeer/design-system";
import React from "react";
import { HiDotsHorizontal } from "react-icons/hi";
import { NavLink, generalSidebarItems } from "components/Sidebar";
import { useProjectContext } from "context/ProjectContext";
import Link from "next/link";

export default function ProjectTile({ name, id }) {
  const { setProjectId } = useProjectContext();

  return (
    <Box
      css={{
        bc: "$neutral2",
        border: "1px solid",
        borderColor: "$neutral6",
        p: "$4",
        width: "100%",
        borderRadius: "11px",
        cursor: "pointer",
        minHeight: 130,
        transition: ".2s",
        "&:hover": {
          cursor: "pointer",
          transition: ".2s",
          borderColor: "$neutral9",
        },
      }}>
      <Flex direction={"column"}>
        <Flex align={"center"} justify={"between"}>
          <Text
            css={{
              fontWeight: 500,
            }}>
            {name}
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
              placeholder="Settings"
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
                    <Link
                      onClick={() => setProjectId(id)}
                      href={`/projects/${id}/${item.path}`}>
                      <NavLink key={item.title}>{item.title}</NavLink>
                    </Link>
                  ))}
                </Flex>
              </Box>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>
      <Button css={{ mt: 40 }} size={1}>
        Open Project
      </Button>
    </Box>
  );
}
