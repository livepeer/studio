import {
  Box,
  Flex,
  Heading,
  Text,
  Link as A,
} from "@livepeer.com/design-system";
import imageUrlBuilder from "@sanity/image-url";
import client from "lib/client";
import { FaTwitter, FaMedium, FaGithub, FaLinkedin } from "react-icons/fa";
import Image from "next/image";

const TeamMember = ({
  fullname,
  image,
  role,
  twitter,
  github,
  linkedin,
  medium,
  css = {},
  ...props
}) => {
  const builder = imageUrlBuilder(client as any);

  return (
    <Box
      css={{
        textAlign: "center",
        borderRadius: 24,
        border: "1px solid $colors$mauve5",
        p: 40,
        bc: "$mauve2",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "box-shadow .15s",
        "&:hover": {
          boxShadow:
            "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
        },
        ...css,
      }}
      {...props}>
      <Box>
        <Box
          as={Image}
          css={{
            borderRadius: 1000,
            objectFit: "cover",
          }}
          width={130}
          height={130}
          src={builder.image(image).url()}
        />
        <Box css={{ mb: "$4" }}>
          <Heading
            as="h3"
            css={{
              mb: "$1",
              mt: "$3",
              fontWeight: 500,
              fontSize: "20px",
            }}>
            {fullname}
          </Heading>
          <Text size="3" variant="gray" css={{ color: "$mauve9" }}>
            {role}
          </Text>
        </Box>
      </Box>
      <Flex
        css={{
          maxWidth: 120,
          mx: "auto",
          justifyContent: "center",
          alignItems: "center",
        }}>
        {twitter && (
          <A
            css={{
              "&:not(:last-of-type)": { mr: "$3" },
              color: "$hiContrast",
              fontSize: "$3",
              transition: "color .15s",
              "&:hover": { color: "$violet9" },
            }}
            href={twitter}
            target="_blank"
            rel="noopener noreferrer">
            <FaTwitter />
          </A>
        )}
        {linkedin && (
          <A
            css={{
              "&:not(:last-of-type)": { mr: "$3" },
              color: "$hiContrast",
              fontSize: "$3",
              transition: "color .15s",
              "&:hover": { color: "$violet9" },
            }}
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer">
            <FaLinkedin />
          </A>
        )}
        {medium && (
          <A
            css={{
              "&:not(:last-of-type)": { mr: "$3" },
              color: "$hiContrast",
              fontSize: "$3",
              transition: "color .15s",
              "&:hover": { color: "$violet9" },
            }}
            href={medium}
            target="_blank"
            rel="noopener noreferrer">
            <FaMedium />
          </A>
        )}
        {github && (
          <A
            css={{
              "&:not(:last-of-type)": { mr: "$3" },
              color: "$hiContrast",
              fontSize: "$3",
              transition: "color .15s",
              "&:hover": { color: "$violet9" },
            }}
            href={github}
            target="_blank"
            rel="noopener noreferrer">
            <FaGithub />
          </A>
        )}
      </Flex>
    </Box>
  );
};

export default TeamMember;
