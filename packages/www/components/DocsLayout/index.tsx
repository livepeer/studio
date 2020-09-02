import Layout from "../Layout";
import { Flex, Box, Container, Link as A } from "@theme-ui/components";
import { useState } from "react";
import TableOfContents from "../TableOfContents";
import guides from "./guides";
import Link from "next/link";
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

export default ({ children, tree = guides }) => {
  const { pathname } = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Layout
      title={`Docs - Livepeer.com`}
      description={`An introduction to the Livepeer.com platform and how to get started creating streams.`}
      url={`https://livepeer.com/docs`}
      customNav={<DocsNav />}
    >
      <Box
        sx={{
          position: "sticky",
          top: 64,
          bg: "white",
          borderBottom: "1px solid",
          borderColor: "muted",
          boxShadow: isOpen ? "none" : "0 10px 20px rgba(0,0,0,0.1)"
        }}
      >
        <Container>
          <Flex
            onClick={() => (isOpen ? setIsOpen(false) : setIsOpen(true))}
            sx={{
              display: ["flex", "flex", "none"],
              cursor: "pointer",
              pb: 3,
              pt: 3,
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Flex sx={{ alignItems: "center" }}>
              <svg
                sx={{
                  mr: 3,
                  ml: "1px",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)"
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
            <Flex
              sx={{
                display: "flex",
                alignItems: "centered"
              }}
            >
              <Link href="/docs" passHref>
                <A
                  variant={
                    pathname === "/docs/reference"
                      ? "buttons.outlineSmall"
                      : "buttons.primarySmall"
                  }
                  sx={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0
                  }}
                >
                  Guides
                </A>
              </Link>
              <Link href="/docs/reference" passHref>
                <A
                  variant={
                    pathname === "/docs/reference"
                      ? "buttons.primarySmall"
                      : "buttons.outlineSmall"
                  }
                  sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  API Reference
                </A>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
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
            {pathname === "/docs/reference" ? (
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
