import { Box, Flex } from "@theme-ui/components";
import Link from "next/link";
import { useState } from "react";
import { Styled } from "theme-ui";
import { useRouter } from "next/router";

const listItems = [
  {
    label: "Using Livepeer for live streaming",
    href: "/docs",
  },
  {
    label: "How to live stream with livepeer.com",
    open: true,
    children: [
      {
        label: "How to create a stream",
        href: "/docs/livepeer-dot-com/create-a-stream",
      },
      {
        href: "/docs/livepeer-dot-com/stream-page-specifications",
        label: "Understanding the stream page specifications",
      },
      {
        href: "/docs/livepeer-dot-com/broadcast-a-stream-session",
        label: "How to broadcast a stream session",
      },
      {
        href: "/docs/livepeer-dot-com/stream-rendition-properties",
        label: "How to set stream rendition properties",
      },
      {
        href: "/docs/livepeer-dot-com/playback-a-stream",
        label: "How to playback a stream",
      },
      {
        href: "/docs/livepeer-dot-com/delete-a-stream",
        label: "How to delete a stream",
      },
    ],
  },
  {
    label: "How to live stream with Livepeer API",
    open: true,
    children: [
      {
        label: "How to create an API key",
        href: "/docs/livepeer-api/create-api-key",
      },
      {
        label: "How to get base urls",
        href: "/docs/livepeer-api/base-urls",
      },
      {
        label: "How to create a stream",
        href: "/docs/livepeer-api/create-a-stream",
      },
      {
        label: "How to broadcast a live stream",
        href: "/docs/livepeer-api/broadcast-a-live-stream",
      },
      {
        label: "How to playback a live stream",
        href: "/docs/livepeer-api/playback-a-live-stream",
      },
      {
        label: "How to list all streams",
        href: "/docs/livepeer-api/list-all-streams",
      },
      {
        label: "How to delete a stream",
        href: "/docs/livepeer-api/delete-a-stream",
      },
    ],
  },
  {
    label: "How do you manage API keys",
    children: [
      {
        href: "/docs/api-keys/when-do-you-need-an-API-key",
        label: "When do you need an API key?",
      },
      {
        href: "/docs/api-keys/create-an-api-key",
        label: "How to create an API key",
      },
      {
        href: "/docs/api-keys/delete-an-api-key",
        label: "How to delete an API key",
      },
    ],
  },
];

export default ({ ...props }) => {
  const { asPath } = useRouter();
  return (
    <Box sx={{ a: { textDecoration: "none" } }} {...props}>
      <Styled.h5 as="h1" sx={{ mb: 3 }}>
        Documentation
      </Styled.h5>
      {listItems.map((listItem, i) => {
        if (listItem?.children) {
          return (
            <Category
              key={i}
              active={listItem.children.some((l) => l.href === asPath)}
              label={listItem.label}
              open={
                listItem?.open ||
                listItem.children.some((l) => l.href === asPath)
              }
            >
              {listItem.children.map((listItem) => {
                return (
                  <ListItem
                    key={listItem.href}
                    active={asPath === listItem.href}
                    href={listItem.href}
                    label={listItem.label}
                  />
                );
              })}
            </Category>
          );
        } else {
          return (
            <ListItem
              key={listItem.href}
              active={asPath === listItem.href}
              href={listItem.href}
              label={listItem.label}
            />
          );
        }
      })}
    </Box>
  );
};

function Category({ label, open = false, active, children }) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <Box sx={{ mb: 3 }}>
      <Flex
        onClick={() => (isOpen ? setIsOpen(false) : setIsOpen(true))}
        sx={{ cursor: "pointer", alignItems: "center" }}
      >
        <svg
          sx={{
            mr: 3,
            ml: "1px",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
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
        <Box sx={{ fontWeight: active ? "heading" : "body" }}>{label}</Box>
      </Flex>
      <Box sx={{ borderLeft: "1px solid", borderColor: "#eaeaea", pl: 3 }}>
        <Box sx={{ display: isOpen ? "block" : "none" }}>{children}</Box>
      </Box>
    </Box>
  );
}

function ListItem({ href, label, active }) {
  return (
    <Flex
      sx={{
        alignItems: "center",
        my: 3,
        ":before": {
          content: '""',
          flexBasis: 4,
          flexShrink: 0,
          display: "block",
          width: 4,
          height: 4,
          mr: 3,
          borderRadius: "50%",
          background: "rgb(102, 102, 102)",
        },
      }}
    >
      <Link href={href} as={href} passHref>
        <a
          sx={{
            fontWeight: active ? "heading" : "body",
            color: active ? "black" : "#444444",
          }}
        >
          {label}
        </a>
      </Link>
    </Flex>
  );
}
