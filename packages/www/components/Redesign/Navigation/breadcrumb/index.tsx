import Logo from "components/Redesign/Logo";
import { useState } from "react";
import { Box, Link as A } from "@livepeer.com/design-system";
import BreadcrumbDropdown from "./dropdown";
import slugify from "@sindresorhus/slugify";
import Link from "next/link";

type LinkProps = React.ComponentProps<typeof Link>;
type MobileDropdownLink = LinkProps & { isSelected: boolean };

export type BreadcrumbItem = LinkProps & {
  mobileDropdownLinks?: MobileDropdownLink[];
};

type Props = {
  breadcrumb?: BreadcrumbItem[];
  withLogoType: boolean;
};

const Divider = () => (
  <Box
    as="span"
    css={{
      ml: "12px",
      mr: "6px",
      fontWeight: 800,
      color: "text",
      "@bp1": {
        fontSize: "$1",
      },
      "@bp3": {
        fontSize: "$2",
      },
    }}>
    /
  </Box>
);

const NavigationBreadcrumb = ({ breadcrumb, withLogoType }: Props) => {
  const [openDropdown, setOpenDropdown] = useState(false);

  if (breadcrumb) {
    return (
      <>
        <Logo logoType={false} />
        {breadcrumb.map((item) => (
          <Box as="span" key={`breadcrumb-${item.href}`}>
            <Box
              as="span"
              css={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                height: "33px",
              }}>
              <Divider />
              <Box
                css={{
                  fontWeight: 800,
                  color: "text",
                  display: "flex",
                  alignItems: "center",
                  "@bp1": {
                    fontSize: "$2",
                  },
                  "@bp3": {
                    fontSize: "$3",
                  },
                }}>
                {slugify(item.children.toString())}
              </Box>
            </Box>
            {item.mobileDropdownLinks && (
              <Box
                as="span"
                css={{
                  position: "relative",
                  alignItems: "center",
                  height: "33px",
                  ml: "-6px",
                  "@bp1": {
                    display: "inline-flex",
                  },
                  "@bp3": {
                    fontSize: "none",
                  },
                }}>
                <Divider />
                {(() => {
                  const { children, ...selectedProps } =
                    item.mobileDropdownLinks.find((l) => l.isSelected) ??
                    item.mobileDropdownLinks.find((l) => l.href === "/docs");
                  return (
                    <>
                      <Box
                        css={{
                          fontWeight: 800,
                          color: "text",
                          display: "flex",
                          alignItems: "center",
                          "@bp1": {
                            fontSize: "$2",
                          },
                          "@bp3": {
                            fontSize: "$3",
                          },
                        }}>
                        {slugify(
                          children.toString() === "API Reference"
                            ? "API"
                            : children.toString()
                        )}
                      </Box>
                    </>
                  );
                })()}
                <BreadcrumbDropdown
                  isOpen={openDropdown}
                  close={() => setOpenDropdown(false)}
                  css={{
                    "@bp1": {
                      right: "12px",
                    },
                    "@bp2": {
                      right: "15px",
                    },
                  }}>
                  {item.mobileDropdownLinks
                    .filter((l) => !l.isSelected)
                    .map((link) => (
                      <Link
                        href={link.href}
                        passHref
                        key={`dropdown-link-${link.href}`}>
                        <A
                          css={{
                            display: "block",
                            fontWeight: 500,
                            fontSize: "$2",
                            color: "$hiContrast",
                            ":not(:last-of-type)": {
                              mb: "$3",
                            },
                          }}>
                          {link.children === "API Reference"
                            ? "API"
                            : link.children}
                        </A>
                      </Link>
                    ))}
                </BreadcrumbDropdown>
              </Box>
            )}
          </Box>
        ))}
      </>
    );
  }
  return <Logo logoType={withLogoType} />;
};

export default NavigationBreadcrumb;
