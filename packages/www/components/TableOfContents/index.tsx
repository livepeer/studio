import { Box, Flex } from "@theme-ui/components";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export type Tree = [{ content: string; slug?: string }, Tree[]] | [];

type Props = {
  tree: Tree;
  onClose?: (() => void) | null;
  ignoreList?: string[];
};

const TableOfContents = ({ onClose = null, tree, ignoreList = [] }: Props) => {
  function renderHeading(heading, hasChildren = false) {
    const { pathname } = useRouter();
    const isActive = pathname === heading.slug;

    if (heading === undefined || ignoreList.includes(heading.content)) {
      return null;
    }

    if (hasChildren) {
      return (
        <Box
          sx={{
            color: "black",
            alignItems: "center",
            display: "flex"
          }}
        >
          {heading.content}
        </Box>
      );
    }
    const labelStyles = {
      fontSize: "10px",
      color: "white",
      fontWeight: 600,
      px: 2,
      py: "2px",
      borderRadius: 4
    };
    return (
      <Link href={heading.slug} passHref>
        <a
          onClick={onClose}
          sx={{
            color: isActive ? "black" : "listText",
            fontWeight: isActive ? 600 : 400,
            alignItems: "center",
            display: "flex",
            ":hover": {
              color: "black"
            },
            ":before": {
              content: '""',
              flexBasis: 4,
              flexShrink: 0,
              display: "block",
              width: 4,
              height: 4,
              mr: 3,
              borderRadius: "50%",
              background: "rgb(102, 102, 102)"
            }
          }}
        >
          <Box
            sx={{
              ...(heading.content === "POST" && {
                bg: "green",
                ...labelStyles
              }),
              ...(heading.content === "GET" && {
                bg: "blue",
                ...labelStyles
              }),
              ...(heading.content === "DELETE" && {
                bg: "red",
                ...labelStyles
              }),
              ...(heading.content === "PUT" && {
                bg: "orange",
                ...labelStyles
              })
            }}
          >
            {heading.content}
          </Box>
        </a>
      </Link>
    );
  }

  function renderChildren(children: Tree[]) {
    if (children.length === 0) {
      return null;
    }

    return (
      <>
        {children.map((child, i) => (
          <Box key={i}>{renderPair(child)}</Box>
        ))}
      </>
    );
  }

  function renderPair(pair: Tree) {
    const [isOpen, setIsOpen] = useState(true);
    const [heading, children] = pair;
    const hasChildren = children?.length > 0;
    if (ignoreList.includes(heading.content)) return <></>;
    return (
      <>
        <Flex
          onClick={() => setIsOpen(isOpen ? false : true)}
          sx={{ cursor: "pointer", alignItems: "center" }}
        >
          {hasChildren && (
            <svg
              sx={{
                minWidth: 6,
                mr: 3,
                ml: "-2px",
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
          )}

          <Box sx={{ py: 2, fontWeight: "body" }}>
            {renderHeading(heading, hasChildren)}
          </Box>
        </Flex>
        {hasChildren && (
          <Box
            sx={{
              display: isOpen ? "block" : "none",
              my: 0,
              borderLeft: "1px solid",
              borderColor: "#eaeaea",
              pl: 3
            }}
          >
            <Box>{renderChildren(children)}</Box>
          </Box>
        )}
      </>
    );
  }

  function render(tree: Tree) {
    const [heading, children] = tree;

    let Toc = renderPair(tree);

    if (heading) {
      Toc = renderPair(tree);
    } else {
      Toc = renderChildren(children);
    }
    return Toc;
  }

  return render(tree);
};

export default TableOfContents;
