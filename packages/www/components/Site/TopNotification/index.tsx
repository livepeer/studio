import { Box, Text, Link as A } from "@livepeer/design-system";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import Link from "next/link";
import { ReactNode } from "react";

export type TopNotificationProps = {
  title?: string | ReactNode;
  description?: string;
  link: {
    label: string;
    href: string;
    asPath?: string;
    isExternal?: boolean;
  };
};

const TopNotification = ({ title, link }: TopNotificationProps) => (
  <Box
    css={{
      position: "relative",
      bc: "$neutral3",
      zIndex: 1,
      textAlign: "center",
      alignItems: "center",
      justifyContent: "center",
      display: "none",
      py: "$2",
      gap: "$4",
      "@bp1": {
        display: "flex",
      },
    }}>
    {title && <Text sx={{ display: "inline" }}>{title}</Text>}
    {link.isExternal ? (
      <A
        css={{
          display: "inline-flex",
          cursor: "pointer",
          alignItems: "center",
          ml: 2,
        }}
        variant="primary"
        target="_blank"
        rel="noopener noreferrer"
        href={link.href}
        data-dark>
        {link.label}
        <i css={{ ml: 1 }}>
          <FiArrowUpRight strokeWidth={3} />
        </i>
      </A>
    ) : (
      <Link href={link.href} as={link.asPath}>
        <A
          css={{
            display: "inline-flex",
            cursor: "pointer",
            alignItems: "center",
            ml: 2,
          }}
          data-dark>
          {link.label}
          <i css={{ ml: 1 }}>
            <FiArrowRight strokeWidth={3} />
          </i>
        </A>
      </Link>
    )}
  </Box>
);
export default TopNotification;
