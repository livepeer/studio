import Layout from "../Layout";
import Sidebar from "./sidebar";
import { Flex, Box, Container } from "@theme-ui/components";
import { useState } from "react";

export default ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Layout>
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "muted",
          boxShadow: isOpen ? "none" : "0 10px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Container>
          <Flex
            onClick={() => (isOpen ? setIsOpen(false) : setIsOpen(true))}
            sx={{
              display: ["flex", "flex", "none"],
              cursor: "pointer",
              pb: 3,
              pt: 2,
              alignItems: "center",
            }}
          >
            <svg
              sx={{
                mr: 3,
                ml: "1px",
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
              width="6"
              height="10"
              viewBox="0 0 6 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.4 8.56L4.67 5M1.4 1.23L4.66 4.7"
                stroke="#999"
                strokeLinecap="square"
              ></path>
            </svg>
            <Box>Menu</Box>
          </Flex>
        </Container>
      </Box>
      <Container sx={{ pb: 4, mt: [20, 20, 40] }}>
        <Flex sx={{ flexDirection: ["column", "column", "row"] }}>
          <Box
            sx={{
              bg: "white",
              position: ["fixed", "fixed", "sticky"],
              top: [113, 113, 0],
              height: ["calc(100vh - 113px)"],
              overflow: "scroll",
              minWidth: ["100%", "100%", 350],
              maxWidth: ["100%", "100%", 350],
              display: [
                isOpen ? "block" : "none",
                isOpen ? "block" : "none",
                "block",
              ],
              left: 0,
              zIndex: 10,
              pt: 3,
              px: 3,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Sidebar />
            </Box>
          </Box>
          <Box
            className="markdown-body"
            sx={{ pt: [2, 2, 0], a: { color: "extremelyBlue" }, pl: [0, 0, 4] }}
          >
            {children}
          </Box>
        </Flex>
      </Container>
    </Layout>
  );
};
