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
import { useRouter } from "next/router";

export default function ProjectTile({ name, id }) {
  const { setProjectId, appendProjectId } = useProjectContext();
  const { push } = useRouter();

  const navigate = (id, path) => {
    setProjectId(id);
    push(appendProjectId(path));
  };

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
                    <Box
                      onClick={() => {
                        navigate(id, item.path);
                      }}>
                      <NavLink key={item.title}>{item.title}</NavLink>
                    </Box>
                  ))}
                </Flex>
              </Box>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>
      <Button
        onClick={() => {
          navigate(id, "/");
        }}
        css={{ mt: 40 }}
        size={1}>
        Open Project
      </Button>
    </Box>
  );
}
