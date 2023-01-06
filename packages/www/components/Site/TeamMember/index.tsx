import { Box, Flex, Heading, Text, Link as A } from "@livepeer/design-system";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "lib/client";
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
        border: "1px solid $colors$neutral5",
        p: 40,
        bc: "$neutral2",
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
          css={{
            position: "relative",
            width: 130,
            height: 130,
            mx: "auto",
            borderRadius: 1000,
            overflow: "hidden",
            img: {
              objectPosition: "center",
            },
          }}>
          <Image
            src={builder.image(image).url()}
            alt={`Photo of ${fullname}`}
            fill
            style={{ objectFit: "cover" }}
          />
        </Box>
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
          <Text size="3" variant="gray" css={{ color: "$primary9" }}>
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
              "&:hover": { color: "$blue9" },
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
              "&:hover": { color: "$blue9" },
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
              "&:hover": { color: "$blue9" },
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
              "&:hover": { color: "$blue9" },
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
