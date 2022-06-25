import { Container, Box, Link as A, Heading } from "@livepeer/design-system";
import Card from "@components/Site/Card";
import { useState, useContext, ContextType, WheelEvent } from "react";
import { ScrollMenu, VisibilityContext } from "react-horizontal-scrolling-menu";
import useDrag from "hooks/use-drag";
import { useRouter } from "next/router";
import BulletedTitle from "@components/Site/BulletedTitle";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

type scrollVisibilityApiType = ContextType<typeof VisibilityContext>;

const getItems = () => {
  return [
    {
      title: "Start a Livestream",
      description:
        "An easy tutorial on how to get started livestreaming with or without writing code.",
      href: "https://livepeer.studio/docs/guides/start-live-streaming/tutorial",
    },
    {
      title: "Upload a Video",
      description:
        "This tutorial covers how to upload a video and play it back in your application.",
      href: "https://livepeer.studio/docs/guides/upload-a-video",
    },
    {
      title: "Mint a Video NFT",
      description: "Learn how to mint a video-optimized NFT on a blockchain.",
      href: "https://livepeer.studio/docs/guides/video-nfts/mint-a-video-nft",
    },
  ];
};

function GuideCard({ onClick, title, description, href, number }) {
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
        label={`G.${number}`}
        title={title}
        description={description}
        height={570}
        arrow
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
    window.open(href, "_ blank");
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
        size="5"
        css={{
          px: 0,
          ".react-horizontal-scrolling-menu--scroll-container": {
            gap: 10,
          },
          ".react-horizontal-scrolling-menu--item": {
            minWidth: 300,
            "@bp2": {
              width: "33%",
            },
          },
        }}>
        <Box
          css={{
            maxWidth: 1000,
            px: "$3",
          }}>
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
            <Box key={title + i}>
              <GuideCard
                title={title}
                href={href}
                number={"0" + (i + 1)}
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
