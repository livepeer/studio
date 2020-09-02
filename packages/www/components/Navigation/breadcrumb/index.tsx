import Link from "../../Link";
import Logo from "../../Logo";
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import BreadcrumbDropdown from "./dropdown";
import slugify from "@sindresorhus/slugify";

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
  <span
    sx={{
      ml: "12px",
      mr: "6px",
      fontWeight: 800,
      fontSize: ["14px", "22px"],
      color: "text"
    }}
  >
    /
  </span>
);

const NavigationBreadcrumb = ({ breadcrumb, withLogoType }: Props) => {
  const [openDropdown, setOpenDropdown] = useState(false);

  const handleSelectedLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpenDropdown((p) => !p);
  };

  if (breadcrumb) {
    return (
      <>
        <Logo logoType={false} />
        {breadcrumb.map((item) => (
          <span key={`breadcrumb-${item.href}`}>
            <span
              sx={{
                position: "relative",
                display: ["inline-flex", null, "none"],
                alignItems: "center",
                height: "34px"
              }}
            >
              <Divider />
              <Link
                {...item}
                children={slugify(item.children.toString())}
                sx={{
                  fontWeight: 800,
                  fontSize: ["16px", "22px"],
                  color: "text",
                  "&:hover": { textDecoration: "none" }
                }}
              />
            </span>
            {item.mobileDropdownLinks && (
              <span
                sx={{
                  position: "relative",
                  display: ["inline-flex", null, "none"],
                  alignItems: "center",
                  height: "34px",
                  ml: "-6px"
                }}
              >
                <Divider />
                {(() => {
                  const {
                    children,
                    ...selectedProps
                  } = item.mobileDropdownLinks.find((l) => l.isSelected);
                  return (
                    <Link
                      {...selectedProps}
                      onClick={handleSelectedLinkClick}
                      sx={{
                        fontWeight: 800,
                        fontSize: ["16px", "22px"],
                        color: "text",
                        display: "flex",
                        alignItems: "center",
                        "&:hover": { textDecoration: "none" }
                      }}
                    >
                      {slugify(children.toString())}
                      <i
                        sx={{
                          ml: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {openDropdown ? <FiChevronUp /> : <FiChevronDown />}
                      </i>
                    </Link>
                  );
                })()}
                <BreadcrumbDropdown
                  isOpen={openDropdown}
                  close={() => setOpenDropdown(false)}
                  tipSx={{ right: ["12px", "15px"] }}
                >
                  {item.mobileDropdownLinks
                    .filter((l) => !l.isSelected)
                    .map((link) => (
                      <Link
                        key={`dropdown-link-${link.href}`}
                        {...link}
                        sx={{
                          display: "block",
                          fontWeight: 500,
                          fontSize: "16px",
                          color: "text",
                          ":not(:last-of-type)": {
                            mb: 3
                          }
                        }}
                      />
                    ))}
                </BreadcrumbDropdown>
              </span>
            )}
          </span>
        ))}
      </>
    );
  }
  return <Logo logoType={withLogoType} />;
};

export default NavigationBreadcrumb;
