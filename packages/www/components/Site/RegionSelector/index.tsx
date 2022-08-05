import {
  Box,
  Flex,
  DropdownMenu,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@livepeer/design-system";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/router";
import { useState } from "react";

const Item = ({ active = false, language, locale, flag, ...props }) => (
  <DropdownMenuCheckboxItem
    checked={active}
    css={{
      borderRadius: 3,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      color: "$loContrast",
      fontSize: "$3",
      fontWeight: active ? 600 : 400,
      backgroundColor: active ? "#f5f5ff" : "transparent",
      p: "$2",
      "&:focus": {
        backgroundColor: "#f5f5ff",
        outline: "none",
        color: "$loContrast",
      },
    }}
    {...props}>
    <>
      <Flex css={{ alignItems: "center" }}>
        <Box css={{ mr: 12 }}>{flag}</Box>
        {language}
      </Flex>
      <Box>
        <CheckIcon css={{ width: 6, height: 6 }} />
      </Box>
    </>
  </DropdownMenuCheckboxItem>
);

const items = [
  {
    flag: "🇺🇸",
    language: "English",
    locale: "en",
  },
  {
    flag: "🇪🇸",
    language: "Spanish",
    locale: "es",
  },
];

const LanguageDropdown = () => {
  const router = useRouter();
  const { locale, pathname, asPath } = router;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={(open) => setIsOpen(open)}>
      <DropdownMenuTrigger asChild>
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            textTransform: "uppercase",
            fontWeight: 500,
            cursor: "pointer",
            color: "$loContrast",
            fontSize: "$4",
            ":focus": {
              outline: "none",
            },
          }}>
          <Box>{router.locale}</Box>
          <Box css={{ ml: "$2", mr: "$1", fontSize: "$4" }}>
            {items.filter((item) => item.locale === router.locale)[0]?.flag}
          </Box>
          <Box
            as={ChevronDownIcon}
            css={{
              transition: ".2s transform",
              transform: `rotate(${isOpen ? "180deg" : 0})`,
              width: 24,
              height: 24,
            }}
          />
        </Box>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        css={{
          minWidth: 300,
          backgroundColor: "#ffffff",
          borderRadius: 6,
          padding: "$1",
          boxShadow:
            "0px 1px 0px rgba(0, 0, 0, 0.05), 0px 0px 8px rgba(0, 0, 0, 0.03), 0px 30px 30px rgba(0, 0, 0, 0.02)",
        }}>
        {items.map((item, i) => (
          <Item
            key={i}
            onSelect={() =>
              router.push(pathname, asPath, { locale: item.locale })
            }
            flag={item.flag}
            active={locale === item.locale ? true : false}
            language={item.language}
            locale="en"
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageDropdown;
