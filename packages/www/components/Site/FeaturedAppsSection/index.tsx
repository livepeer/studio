import { Container, Box, Flex, Heading, Text } from "@livepeer/design-system";
import { useState, useContext, ContextType, WheelEvent } from "react";
import { ScrollMenu, VisibilityContext } from "react-horizontal-scrolling-menu";
import useDrag from "hooks/use-drag";
import { useRouter } from "next/router";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import BulletedTitle from "@components/Site/BulletedTitle";

type scrollVisibilityApiType = ContextType<typeof VisibilityContext>;

const getItems = () => {
  return [
    {
      title: "Huddle01",
      description:
        "The world's first web3-native video meeting solution integrated with Livepeer Studio to deliver low-latency video meetings.",
      href: "http://localhost:3000/blog/how-huddle01-built-the-worlds-first-web3-meeting-app",
    },
    {
      title: "InFlow Music",
      description:
        "A web3 music platform aims to disrupt the industry by offering live music concerts and events to award-winning artists and their fans.",
      href: "http://localhost:3000/blog/how-inflow-created-first-music-platform-web3-economy",
    },
    {
      title: "Korkuma",
      description:
        "A live shopping platform aiming to become the next top sales channel for forward-looking ecommerce brands.",
      href: "http://localhost:3000/blog/livepeer-helps-korkuma-bring-immersive-commerce-to-the-masses",
    },
  ];
};

function FeaturedAppCard({ onClick, title, description, href }) {
  const visibility = useContext(VisibilityContext);

  return (
    <Box
      onClick={() => onClick({ href, visibility })}
      css={{
        width: "160px",
        minWidth: 280,
        borderRight: "1px solid",
        borderColor: "rgba(0, 1, 22, 15%)",
        px: "$4",
        pb: "$6",
        color: "$neutral11",
        cursor: "pointer",
        transition: ".15s",
        height: 300,
        "@bp2": {
          minWidth: 380,
        },
        "&:active": {
          cursor: "grabbing",
        },
        "&:hover": {
          transition: ".15s",
          color: "$loContrast",
          ".featuredAppCard__arrow": {
            bc: "#0A5CD8",
            transition: ".15s",
            color: "$hiContrast",
          },
        },
      }}
      tabIndex={0}>
      <Flex direction="column" gap={9} css={{ color: "inherit" }}>
        <Flex
          align="center"
          css={{
            fontSize: 35,
            color: "inherit",
            "@bp2": {
              fontSize: 45,
            },
          }}>
          <Box css={{ mr: "$2", color: "inherit" }}>{title}</Box>
          <Box
            className="featuredAppCard__arrow"
            css={{
              mt: "-$2",
              bc: "$neutral11",
              px: "$1",
              color: "$hiContrast",
              transition: ".15s",
            }}>
            <Box css={{ color: "inherit" }} as={ArrowRightIcon} />
          </Box>
        </Flex>
        <Text size="3" css={{ color: "inherit" }}>
          {description}
        </Text>
      </Flex>
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

const FeaturedAppsSection = () => {
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
    router.push(href);
  };

  return (
    <Box
      id="featured"
      css={{
        bc: "$hiContrast",
        pt: "$6",
        m: "$3",
        borderRadius: "$4",
        "@bp2": {
          m: "$5",
        },
      }}>
      <Container
        css={{
          px: "$3",
          "@bp2": {
            px: "$4",
          },
        }}>
        <Box css={{ maxWidth: 600 }}>
          <BulletedTitle css={{ mb: "$4", color: "$loContrast" }}>
            Featured Apps
          </BulletedTitle>
          <Heading
            size="4"
            css={{ color: "$loContrast", mb: "$4", letterSpacing: "-1px" }}>
            Web3 video apps built with Livepeer Studio
          </Heading>
          <Text size="5" css={{ mb: 120, color: "$loContrast" }}>
            Disrupting the way creators own and monetize their content,
            developers are building new types of experiences with web3 video
            apps across decentralized social, music, live entertainment,
            shopping, and gaming.
          </Text>
        </Box>
        <Box
          css={{
            borderTop: "1px solid",
            borderColor: "rgba(0, 1, 22, 15%)",
            ".react-horizontal-scrolling-menu--item:last-child > div": {
              borderRight: 0,
            },
          }}>
          <ScrollMenu
            onWheel={onWheel}
            onMouseDown={() => dragStart}
            onMouseUp={() => dragStop}
            onMouseMove={handleDrag}>
            {items.map(({ title, description, href }) => (
              <FeaturedAppCard
                title={title}
                href={href}
                description={description}
                key={title}
                onClick={handleItemClick(href)}
              />
            ))}
          </ScrollMenu>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedAppsSection;
