import {
  Box,
  Flex,
  Text,
  Button,
  Link as A,
  DialogTrigger,
  Dialog,
  DialogContent,
  DialogClose,
} from "@livepeer.com/design-system";
import Logo from "@components/Marketing/Logo";
import { useApi } from "hooks";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useDocSearch } from "@components/Marketing/AlgoliaDocsSearch";
import { ListBulletIcon, Cross1Icon } from "@radix-ui/react-icons";
import {
  MobileTableOfContents,
  MenuProps,
} from "@components/Marketing/Docs/TableOfContents";
import Link from "next/link";

type DocsNavProps = {
  categories: { name: string; slug: string }[];
  mobileCategories: { name: string; slug: string }[];
  menu: MenuProps;
};

const DocsNav = ({ categories, menu }: DocsNavProps) => {
  const { token } = useApi();
  const router = useRouter();
  const currentPath = router.asPath
    .split("/")
    .slice(0, 3)
    .join("/")
    .split("#")[0];

  const { SearchModal, onSearchOpen, searchButtonRef } = useDocSearch();

  return (
    <>
      <Box
        css={{
          borderBottom: "1px solid $colors$mauve4",
          gridColumn: "1 / 16",
          position: "sticky",
          py: "$3",
          px: "$5",
          transition: "all 0.2s",
          top: 0,
          zIndex: 100,
          bc: "$loContrast",
        }}>
        <Flex justify="between" align="center">
          <Flex align="center">
            <Flex align="center">
              <Logo />
            </Flex>
            <Box
              onClick={onSearchOpen}
              ref={searchButtonRef}
              css={{
                backgroundColor: "$panel",
                display: "none",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid $colors$mauve6",
                borderRadius: "8px",
                px: "$2",
                py: "$1",
                width: "215px",
                ml: "$6",
                color: "$mauve11",
                cursor: "pointer",
                "@bp2": {
                  display: "flex",
                },
              }}>
              <Flex css={{ alignItems: "center" }}>
                <MagnifyingGlassIcon />
                <Text variant="gray" css={{ ml: "$2" }}>
                  Search
                </Text>
              </Flex>
              <Box
                css={{
                  border: "1px solid $colors$mauve7",
                  p: "$1",
                  borderRadius: "4px",
                  color: "$mauve11",
                }}>
                <Box css={{ fontSize: "10px" }}>⌘ K</Box>
              </Box>
            </Box>
          </Flex>
          <Dialog>
            <DialogTrigger as={Flex}>
              <Flex
                css={{
                  color: "$hiContrast",
                  backgroundColor: "$panel",
                  borderRadius: 20,
                  fontSize: 6,
                  py: "$1",
                  px: "$3",
                  cursor: "pointer",
                  flexShrink: 0,
                  "@bp2": {
                    display: "none",
                  },
                }}>
                <ListBulletIcon />
              </Flex>
            </DialogTrigger>
            <DialogContent css={{ overflow: "scroll" }}>
              <Box
                css={{
                  position: "absolute",
                  right: 20,
                  top: 20,
                  cursor: "pointer",
                }}>
                <DialogClose as={Box}>
                  <Cross1Icon />
                </DialogClose>
              </Box>
              <MobileTableOfContents menu={menu} />
            </DialogContent>
          </Dialog>
          <Flex
            align="center"
            justify="end"
            css={{
              display: "none",
              "@bp2": {
                display: "flex",
              },
            }}>
            <Flex align="center" justify="between">
              <Flex align="center" justify="center">
                {categories.map((each, idx) => {
                  return (
                    <Link href={each?.slug} key={idx} passHref>
                      <A
                        css={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          ml: "$5",
                          textDecoration: "none",
                          color:
                            each?.slug === currentPath
                              ? "$hiContrast"
                              : "$mauve11",
                          "&:hover": {
                            textDecoration: "none",
                            color: "$hiContrast",
                          },
                        }}>
                        {each.name}
                      </A>
                    </Link>
                  );
                })}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Flex
        align="center"
        css={{
          borderBottom: "1px solid $colors$mauve5",
          display: "flex",
          px: "$5",
          py: "$2",
          "@bp2": {
            display: "none",
          },
        }}>
        <Flex align="center" justify="between" css={{ width: "100%" }}>
          <Flex align="center" justify="center">
            {categories.map((each, idx) => {
              return (
                <Link href={each?.slug} key={idx} passHref>
                  <A
                    css={{
                      fontSize: "$1",
                      cursor: "pointer",
                      textDecoration: "none",
                      mr: "$3",
                      color:
                        each?.slug === currentPath ? "$hiContrast" : "$mauve9",
                      "&:hover": {
                        textDecoration: "none",
                        color: "$hiContrast",
                      },
                    }}>
                    {each.name}
                  </A>
                </Link>
              );
            })}
          </Flex>
          <Button onClick={onSearchOpen} ref={searchButtonRef} css={{}}>
            <Flex css={{ alignItems: "center" }}>
              <MagnifyingGlassIcon />
              <Text variant="gray" css={{ ml: "$1", fontSize: "$2" }}>
                Search
              </Text>
            </Flex>
          </Button>
        </Flex>
      </Flex>
      <SearchModal />
    </>
  );
};

export default DocsNav;
