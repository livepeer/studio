import { Box, Heading } from "@livepeer/design-system";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";

export const DefaultTableHeader = ({ title }: { title: string }) => (
  <Heading size="2" css={{ fontWeight: 600 }}>
    {title}
  </Heading>
);

export const makeSelectAction = (title: string, onClick: () => void) => ({
  onClick,
  css: { display: "flex", alignItems: "center" },
  size: "2",
  children: (
    <>
      <Cross1Icon /> <Box css={{ ml: "$2" }}>{title}</Box>
    </>
  ),
});

export const makeCreateAction = (title: string, onClick: () => void) => ({
  onClick,
  css: { display: "flex", alignItems: "center", ml: "$1" },
  children: (
    <>
      <PlusIcon />{" "}
      <Box as="span" css={{ ml: "$2" }}>
        {title}
      </Box>
    </>
  ),
});
