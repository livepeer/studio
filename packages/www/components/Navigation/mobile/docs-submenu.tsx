import { Box, Container, Flex } from "@theme-ui/components";
import { useState } from "react";
import { useRouter } from "next/router";
import { FiChevronDown } from "react-icons/fi";
import { IconButton } from "@theme-ui/components";
import _throttle from "lodash/throttle";
import TableOfContents, { Tree } from "../../TableOfContents";

type Props = {
  tree: Tree[];
  ignoreList: string[];
  mobileSubmenuVisible: boolean;
};

const DocsMobileSubMenu = ({
  tree,
  ignoreList,
  mobileSubmenuVisible
}: Props) => {
  const { pathname } = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 64,
        bg: "white",
        boxShadow: isOpen
          ? "none"
          : "rgba(0, 0, 0, 0.02) 0px 30px 30px, rgba(0, 0, 0, 0.03) 0px 0px 8px, rgba(0, 0, 0, 0.05) 0px 1px 0px",
        zIndex: 21,
        opacity: mobileSubmenuVisible || isOpen ? 1 : 0,
        visibility: mobileSubmenuVisible || isOpen ? "visible" : "hidden",
        transition: "opacity .2s"
      }}
    >
      <Container>
        <Flex
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            display: ["flex", "flex", "none"],
            cursor: "pointer",
            pb: 3,
            pt: 3,
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "24px",
            lineHeight: "29px",
            letterSpacing: "-0.04em",
            fontWeight: 600
          }}
        >
          {pathname.includes("/docs/reference") ? (
            <Box>API Reference</Box>
          ) : (
            <Box>Guides</Box>
          )}
          <IconButton sx={{ fontSize: 6 }}>
            <FiChevronDown size="24px" />
          </IconButton>
        </Flex>
      </Container>
      <Box
        sx={{
          position: "fixed",
          top: "128px",
          height: isOpen ? "calc(100vh - 128px)" : 0,
          width: "100%",
          bg: "rgba(0,0,0,.35)",
          overflow: "hidden",
          transition: "height .2s"
        }}
        onClick={handleClick}
      >
        <Container
          sx={{
            bg: "background",
            height: "calc(100vh - 228px)",
            overflow: "auto"
          }}
        >
          <TableOfContents
            onClose={() => setIsOpen(false)}
            tree={tree}
            ignoreList={ignoreList}
          />
        </Container>
      </Box>
    </Box>
  );
};

export default DocsMobileSubMenu;
