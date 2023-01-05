import React from "react";
import { Container, Box } from "@theme-ui/components";
import { Text, Box as LiveBox } from "@livepeer/design-system";
import Image from "next/image";

export const SocialProof = () => {
  return (
    <Container
      sx={{
        paddingX: "15px",
      }}>
      <Box
        sx={{
          padding: "15px",
          textAlign: "center",
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
        <LiveBox
          css={{
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 0.8,
            letterSpacing: "-2px",
            mb: "8px",
            "@bp3": {
              fontSize: 48,
            },
          }}>
          {/* {title} */}
          Trusted by
        </LiveBox>
        <Box
          sx={{
            display: ["block", "flex"],
            flexWrap: "wrap",
            justifyContent: ["unset", "center"],
            width: "100%",
            paddingY: "64px",
            paddingX: "32px",
          }}>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
          <Box sx={{ padding: "1em" }}>
            <Image
              alt="Livepeer"
              // src={urlFor(defaultImage).url()}
              src="https://picsum.photos/200/200?grayscale"
              // placeholder="blur"
              // blurDataURL={urlFor(defaultImage)
              //   .width(24)
              //   .height(24)
              //   .blur(10)
              //   .url()}
              width={200}
              height={200}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
