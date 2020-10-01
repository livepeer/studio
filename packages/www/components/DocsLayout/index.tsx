import Layout from "../Layout";
import { Flex, Box, Container } from "@theme-ui/components";
import { useState } from "react";
import TableOfContents from "../TableOfContents";
import guides from "./guides";
import { useRouter } from "next/router";
import { DocsNav } from "../Navigation";

const ignoreList = [
  "/password-reset",
  "/password-reset-token",
  "/make-admin",
  "/user-verification",
  "/user",
  "/user/token",
  "password-reset",
  "password-reset-token",
  "make-admin",
  "user-verification",
  "user"
];

const DocsLayout = ({ children, tree = guides }) => {
  const { pathname } = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Layout
      title={`Docs - Livepeer.com`}
      description={`An introduction to the Livepeer.com platform and how to get started creating streams.`}
      url={`https://livepeer.com/docs`}
      customNav={<DocsNav />}
    >
      <Container
        sx={{
          pb: 4,
          mt: [20, 20, 40]
        }}
      >
        <Flex sx={{ flexDirection: ["column", "column", "row"] }}>
          <Box
            sx={{
              bg: "white",
              position: ["fixed", "fixed", "sticky"],
              top: [130, 130, 105],
              height: [
                "calc(100vh - 130)",
                "calc(100vh - 130)",
                "calc(100vh - 105px)"
              ],
              overflow: "scroll",
              minWidth: ["100%", "100%", 350],
              maxWidth: ["100%", "100%", 350],
              display: [
                isOpen ? "block" : "none",
                isOpen ? "block" : "none",
                "block"
              ],
              left: 0,
              zIndex: 10,
              pt: 2,
              pl: [19, 19, 1]
            }}
          >
            {pathname.includes("/docs/reference") ? (
              <h4 sx={{ mb: 3 }}>API Reference</h4>
            ) : (
              <h4 sx={{ mb: 3 }}>Guides</h4>
            )}
            <TableOfContents
              onClose={() => setIsOpen(false)}
              tree={tree}
              ignoreList={ignoreList}
            />
          </Box>

          <Box
            className="markdown-body"
            sx={{
              "> div :last-child": { mb: 0 },
              pt: [2, 2, 1],
              a: { color: "primary" },
              pl: [0, 0, 4]
            }}
          >
            {children}
          </Box>
        </Flex>
      </Container>
    </Layout>
  );
};

export default DocsLayout;
