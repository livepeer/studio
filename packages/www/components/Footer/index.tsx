import { Flex, Link as A } from "@livepeer/design-system";
import Link from "next/link";
import { FaTwitter, FaDiscord, FaMedium, FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <Flex direction="column" gap={4}>
      <Flex
        align="center"
        justify="center"
        gap={5}
        css={{
          flexDirection: "column",
          "@bp2": {
            flexDirection: "row",
          },
        }}>
        <Link href="https://livepeer.org" passHref legacyBehavior>
          <A target="_blank" css={{ fontSize: 11 }} variant="subtle">
            Livepeer.org
          </A>
        </Link>
        <Link href="https://docs.livepeer.org" passHref legacyBehavior>
          <A target="_blank" css={{ fontSize: 11 }} variant="subtle">
            Documentation
          </A>
        </Link>
        <Link
          href="https://livepeer.studio/terms-of-service"
          passHref
          legacyBehavior>
          <A target="_blank" css={{ fontSize: 10 }} variant="subtle">
            Terms of Service
          </A>
        </Link>
        <Link
          href="https://livepeer.studio/privacy-policy"
          passHref
          legacyBehavior>
          <A target="_blank" css={{ fontSize: 10 }} variant="subtle">
            Privacy Policy
          </A>
        </Link>
        <Link
          href="https://livepeer.typeform.com/to/McJZ2nMI"
          passHref
          legacyBehavior>
          <A target="_blank" css={{ fontSize: 10 }} variant="subtle">
            Apply for stream credits
          </A>
        </Link>
      </Flex>
      {/* <Flex align="center" justify="center" gap={5}>
        <Link
          href="https://discord.gg/livepeer"
          target="_blank"
          passHref
          legacyBehavior>
          <A css={{ width: 16 }} variant="subtle">
            <FaDiscord />
          </A>
        </Link>
        <Link
          href="https://twitter.com/livepeer"
          target="_blank"
          passHref
          legacyBehavior>
          <A css={{ width: 16 }} variant="subtle">
            <FaTwitter />
          </A>
        </Link>
        <Link
          href="https://github.com/livepeer/studio"
          target="_blank"
          passHref
          legacyBehavior>
          <A css={{ width: 16 }} variant="subtle">
            <FaGithub />
          </A>
        </Link>
        <Link
          href="https://medium.com/livepeer-blog"
          target="_blank"
          passHref
          legacyBehavior>
          <A css={{ width: 16 }} variant="subtle">
            <FaMedium />
          </A>
        </Link>
      </Flex> */}
    </Flex>
  );
};

export default Footer;
