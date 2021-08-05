import { Box, Flex } from "@livepeer.com/design-system";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import BulletSvg from "./bullet-svg";

type Heading = { content: string; slug?: string; iconComponentName?: string };
export type Tree = [Heading, Tree[]] | [];

type Props = {
  tree: Tree[];
  onClose?: (() => void) | null;
  ignoreList?: string[];
};

function flatten(items) {
  const flat = [];

  items.forEach((item) => {
    if (Array.isArray(item)) {
      flat.push(...flatten(item));
    } else {
      flat.push(item);
    }
  });

  return flat;
}

const IconContainer = ({ children }) => (
  <Box
    as="i"
    css={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      mr: "$4",
      width: "16px",
      height: "16px",
    }}>
    {children}
  </Box>
);

const TableOfContents = ({ onClose = null, tree, ignoreList = [] }: Props) => {
  function renderHeading(
    heading: Heading,
    hasChildren = false,
    isChildren = false
  ) {
    const { pathname } = useRouter();
    const isActive = pathname === heading.slug;

    const Icon =
      require(`react-icons/fi`)[heading.iconComponentName] ?? BulletSvg;

    if (heading === undefined || ignoreList.includes(heading.content)) {
      return null;
    }

    if (hasChildren) {
      return (
        <Box
          css={{
            color: "black",
            alignItems: "center",
            display: "flex",
            pl: "0",
            py: "12px",
          }}>
          <IconContainer>
            <Icon />
          </IconContainer>
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
      borderRadius: 4,
    };
    return (
      <Link href={heading.slug} passHref>
        <Box
          as="a"
          onClick={onClose}
          css={{
            fontSize: "$3",
            color: isActive ? "primary" : "black",
            fontWeight: isActive ? 600 : 400,
            borderLeft: "1px solid",
            borderColor: isChildren
              ? isActive
                ? "$violet9"
                : "$mauve9"
              : "transparent",
            alignItems: "center",
            py: isChildren ? "8px" : "12px",
            pl: isChildren ? "12px" : "0",
            display: "flex",
            "&:hover": {
              color: "$violet9",
            },
          }}>
          <IconContainer>
            <Icon />
          </IconContainer>
          <Box
            css={{
              ...(heading.content === "POST" && {
                bc: "green",
                ...labelStyles,
              }),
              ...(heading.content === "GET" && {
                bc: "blue",
                ...labelStyles,
              }),
              ...(heading.content === "DELETE" && {
                bc: "red",
                ...labelStyles,
              }),
              ...(heading.content === "PUT" && {
                bc: "orange",
                ...labelStyles,
              }),
            }}>
            {heading.content}
          </Box>
        </Box>
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
          <Box key={i}>{renderPair(child, true)}</Box>
        ))}
      </>
    );
  }

  function renderPair(pair: Tree, isChildren = false) {
    const [isOpen, setIsOpen] = useState(false);
    const [heading, children] = pair;
    const hasChildren = children?.length > 0;
    const router = useRouter();
    const isActive = flatten(children).filter(
      (obj) => obj.slug === router?.pathname
    ).length;
    if (ignoreList.includes(heading.content)) return <></>;
    return (
      <>
        <Flex
          onClick={() => setIsOpen(isOpen ? false : true)}
          css={{
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box>{renderHeading(heading, hasChildren, isChildren)}</Box>
          {hasChildren && (
            <>
              {isOpen || isActive ? (
                <IconContainer>
                  <FiChevronUp />
                </IconContainer>
              ) : (
                <IconContainer>
                  <FiChevronDown />
                </IconContainer>
              )}
            </>
          )}
        </Flex>
        {hasChildren && (
          <Box
            css={{
              display: isOpen || isActive ? "block" : "none",
              my: 0,
              pl: "8px",
            }}>
            {renderChildren(children)}
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

  return (
    <>
      {tree.map((t, i) => (
        <div key={`tree-${i}`}>{render(t)}</div>
      ))}
    </>
  );
};

export default TableOfContents;
