import { Container, Box, Link as A, Heading } from "@livepeer/design-system";
import Card from "@components/Marketing/Card";
import { useState, useContext, ContextType, WheelEvent } from "react";
import { ScrollMenu, VisibilityContext } from "react-horizontal-scrolling-menu";
import useDrag from "hooks/use-drag";
import { useRouter } from "next/router";
import BulletedTitle from "@components/Marketing/BulletedTitle";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

type scrollVisibilityApiType = ContextType<typeof VisibilityContext>;

const getItems = () => {
  return [
    {
      title: "Livestream Quick Start",
      description: "Start live streaming with Livepeer Studio",
      href: "",
    },
    {
      title: "Record a Livestream",
      description:
        "A web3 music platform aims to disrupt the industry by offering live music concerts and events to award-winning artists and their fans.",
      href: "",
    },
    {
      title: "Guide 3",
      description:
        "A live shopping platform aiming to become the next top sales channel for forward-looking ecommerce brands.",
      href: "",
    },
    {
      title: "Guide 4",
      description:
        "A web3 music platform aims to disrupt the industry by offering live music concerts and events to award-winning artists and their fans.",
      href: "",
    },
    {
      title: "Guide 5",
      description:
        "A live shopping platform aiming to become the next top sales channel for forward-looking ecommerce brands.",
      href: "",
    },
  ];
};

function GuideCard({ onClick, title, description, href }) {
  const visibility = useContext(VisibilityContext);

  return (
    <Box
      onClick={() => onClick({ href, visibility })}
      tabIndex={0}
      css={{
        cursor: "pointer",
        transition: ".15s",
        "&:active": {
          cursor: "grabbing",
        },
      }}>
      <Card
        lines="tomato"
        label="G.01"
        title={title}
        description={description}
        height={570}
      />
    </Box>
  );
}

function onWheel(apiObj: scrollVisibilityApiType, ev: WheelEvent): void {
  const isThouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15;

  if (isThouchpad) {
    ev.stopPropagation();
    return;
  }

  if (ev.deltaY < 0) {
    apiObj.scrollNext();
  } else if (ev.deltaY > 0) {
    apiObj.scrollPrev();
  }
}
const GuideSection = () => {
  const router = useRouter();
  const [items] = useState(getItems);

  // NOTE: for drag by mouse
  const { dragStart, dragStop, dragMove, dragging } = useDrag();
  const handleDrag =
    ({ scrollContainer }: scrollVisibilityApiType) =>
    (ev: React.MouseEvent) =>
      dragMove(ev, (posDiff) => {
        if (scrollContainer.current) {
          scrollContainer.current.scrollLeft += posDiff;
        }
      });

  const handleItemClick = (href) => () => {
    if (dragging) {
      return false;
    }
    window.open("https://www.google.com", "_ blank");
  };
  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
        ml: "$3",
        mr: "$3",
        borderTopRightRadius: "$2",
        pt: 60,
        pb: "$4",
      }}>
      <Container
        css={{
          px: 0,
          "@bp2": {
            px: "$2",
          },
        }}>
        <Box css={{ maxWidth: 1000 }}>
          <BulletedTitle css={{ mb: "$4", color: "$hiContrast" }}>
            Guides
          </BulletedTitle>
          <Heading
            size="4"
            css={{
              mb: 100,
              letterSpacing: "-1px",
              lineHeight: 1.2,
              "@bp2": {
                lineHeight: "60px",
                mb: 140,
              },
            }}>
            Get started building with Livepeer Studio today with these guides.
            Still have questions? Try asking the community{" "}
            <A
              href="https://discord.gg/7D6hGG6dCZ"
              css={{
                display: "inline-flex",
                alignItems: "center",
                color: "$loContrast",
                position: "relative",
                px: "$1",
                borderRadius: "4px",
                bc: "$hiContrast",
                cursor: "pointer",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "none",
                },
              }}>
              in Discord{" "}
              <Box
                as={ArrowTopRightIcon}
                css={{ ml: "$1", height: 32, width: 32 }}
              />
            </A>
          </Heading>
        </Box>

        <ScrollMenu
          onWheel={onWheel}
          onMouseDown={() => dragStart}
          onMouseUp={() => dragStop}
          onMouseMove={handleDrag}>
          {items.map(({ title, description, href }, i) => (
            <Box
              key={title + i}
              css={{
                minWidth: 280,
                mr: "$4",
                "@bp1": {
                  minWidth: 340,
                },
                "@bp2": {
                  minWidth: 453,
                },
              }}>
              <GuideCard
                title={title}
                href={href}
                description={description}
                key={title}
                onClick={handleItemClick(href)}
              />
            </Box>
          ))}
        </ScrollMenu>
      </Container>
    </Box>
  );
};

export default GuideSection;
