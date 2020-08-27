import { Container, Box, Link as A } from "@theme-ui/components";
import Logo from "../Logo";
import { Text } from "@theme-ui/components";
import { Grid } from "@theme-ui/components";
import LinksList, { LinksListProps } from "./LinksList";
import Link from "../Link";
import Textfield from "../Textfield";

const linksLists: LinksListProps[] = [
  {
    heading: "Company",
    links: [
      { children: "Home", href: "/" },
      { children: "About", href: "/team" },
      { children: "Jobs", href: "/jobs" }
    ]
  },
  {
    heading: "Resources",
    links: [
      { children: "Documentation", href: "/docs" },
      { children: "Blog", href: "/blog" },
      { children: "Contact", href: "/contact" },
      { children: "Privacy Policy", href: "/privacy-policy" }
    ]
  }
];

const Footer = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO handle submit
    console.log("Submitting");
  };

  return (
    <Box
      sx={{
        py: 5,
        bg: "text",
        color: "background",
        boxShadow: "0px 0px 60px rgba(0, 0, 0, 0.08)"
      }}
    >
      <Container>
        <Grid
          columns={[1, null, null, "2fr 1fr 1fr 1fr"]}
          gap={5}
          sx={{
            alignItems: "flex-start",
            justifyContent: "center",
            textAlign: ["center", null, null, "left"]
          }}
        >
          <form onSubmit={handleSubmit}>
            <Logo isDark />
            <Text
              as="label"
              htmlFor="email"
              sx={{
                pb: 3,
                display: "block",
                mt: 4,
                maxWidth: "276px",
                mx: ["auto", null, null, "0"]
              }}
            >
              Join our newsletter to stay up to date on features and new
              releases.
            </Text>
            <Textfield
              label="Enter your email"
              name="email"
              id="email-footer"
              sx={{ width: "100%", maxWidth: "276px" }}
            />
          </form>
          {linksLists.map((list) => (
            <LinksList key={`links-list-${list.heading}`} {...list} />
          ))}
          <ul>
            <li sx={{ fontWeight: 600, mb: 3 }}>Livepeer Inc.</li>
            <li>
              16 Vestry Street, Floor 4<br />
              New York, NY 10013
            </li>
            <li sx={{ mt: 4, mb: 3 }}>
              <Link
                href="mailto:hello@livepeer.com"
                variant="footer"
                sx={{ fontWeight: 600, textDecoration: "underline" }}
                isExternal
              >
                hello@livepeer.com
              </Link>
            </li>
            <li>
              <A
                href="https://www.linkedin.com/company/livepeer"
                rel="noopener noreferrer"
                target="__blank"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  sx={{ display: "inline-block", mr: 2 }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM10.6776 12.2644C11.7243 12.2644 12.3753 11.5386 12.3753 10.6332C12.3564 9.70605 11.7243 8.99934 10.6971 9C9.67116 9 9 9.70605 9 10.6332C9 11.538 9.6504 12.2651 10.6581 12.2644H10.6776ZM12.1778 22.9993H9.17612V13.5548H12.1778V22.9993ZM16.8394 14.8932C17.2401 14.2484 17.9528 13.3337 19.5448 13.3337C21.5187 13.3337 23.0006 14.682 23 17.5852V23H19.999V17.9464C19.999 16.6778 19.5643 15.8098 18.4767 15.8098C17.6502 15.8098 17.1558 16.3974 16.9382 16.9594C16.8577 17.1627 16.8394 17.4411 16.8394 17.7253V23H13.8384C13.8384 23 13.8774 14.4405 13.8384 13.5555H16.8394V14.8932ZM16.8394 14.8932C16.8344 14.9037 16.8275 14.9143 16.8199 14.9235H16.8394V14.8932Z"
                    fill="#fff"
                  />
                </svg>
              </A>
              <A
                href="https://twitter.com/livepeerorg"
                rel="noopener noreferrer"
                target="__blank"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  sx={{ display: "inline-block" }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM21.3503 11.8976C21.9313 11.8243 22.4849 11.6615 23 11.4205C22.6149 12.028 22.1279 12.5616 21.5668 12.9887C21.5723 13.1186 21.5751 13.2493 21.5751 13.3806C21.5751 17.3839 18.6861 22 13.4029 22C11.7809 22 10.2711 21.4985 9 20.639C9.2247 20.667 9.45335 20.6813 9.68517 20.6813C11.0308 20.6813 12.2693 20.197 13.2523 19.3845C11.9955 19.36 10.9347 18.4842 10.5692 17.2806C10.7446 17.316 10.9245 17.3349 11.1096 17.3349C11.3716 17.3349 11.6253 17.2979 11.8664 17.2287C10.5524 16.9504 9.56232 15.726 9.56232 14.2582C9.56232 14.2455 9.56232 14.2328 9.56253 14.2201C9.94982 14.447 10.3927 14.5833 10.8635 14.599C10.0928 14.0558 9.58573 13.1285 9.58573 12.0775C9.58573 11.5223 9.72737 11.002 9.97461 10.5545C11.3913 12.3873 13.5077 13.5934 15.8948 13.7197C15.8459 13.498 15.8204 13.2668 15.8204 13.0294C15.8204 11.3564 17.1065 10 18.6928 10C19.5189 10 20.2653 10.3679 20.7893 10.9567C21.4436 10.8208 22.0583 10.5687 22.6132 10.2216C22.3988 10.9289 21.9434 11.5226 21.3503 11.8976Z"
                    fill="#fff"
                  />
                </svg>
              </A>
            </li>
          </ul>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;
