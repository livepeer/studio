import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Text,
} from "@livepeer/design-system";
import { featuresList } from "content/ftux-model";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HiOutlineSparkles } from "react-icons/hi";

export default function FeaturesModel() {
  const [features, setFeatures] = useState(featuresList);
  const [shouldShowFeature, setShouldShowFeature] = useState(false);

  const renderDescriptionWithLineBreaks = (text) => {
    return text.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const feature = features.filter((feature) => feature.isActive)[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasShownFeature = localStorage.getItem(
        `hasShownFeature-${feature.id}`,
      );
      if (!hasShownFeature) {
        setShouldShowFeature(true);
        localStorage.setItem(`hasShownFeature-${feature.id}`, "true");
      }
    }
  }, []);

  return (
    <AlertDialog open={shouldShowFeature}>
      <AlertDialogContent css={{ p: "0", borderRadius: 0 }}>
        <Flex className="flex flex-row gap-3">
          <Box className="flex flex-col flex-1 justify-center p-5">
            <Badge
              variant="green"
              size={"2"}
              css={{
                padding: "12px 15px",
                width: "fit-content",
                gap: "4px",
                fontWeight: 600,
                mb: "$3",
              }}>
              <HiOutlineSparkles />
              New Feature
            </Badge>
            <AlertDialogTitle asChild>
              <Heading size="2">{feature.title}</Heading>
            </AlertDialogTitle>
            <Box css={{ mb: "$4", mt: "$4" }}>
              <Text
                variant="neutral"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                {renderDescriptionWithLineBreaks(feature.description)}
              </Text>
            </Box>
            <Flex className="flex flex-row gap-3 mt-2">
              <AlertDialogCancel asChild>
                <Button
                  onClick={() => {
                    setShouldShowFeature(false);
                  }}
                  size="2"
                  type="submit"
                  variant="primary">
                  Got it
                </Button>
              </AlertDialogCancel>
              <Button
                onClick={() => {
                  setShouldShowFeature(false);
                }}
                size="2"
                variant={"gray"}>
                <Link href={feature.learnMoreUrl} target="_blank">
                  Learn more
                </Link>
              </Button>
            </Flex>
          </Box>
          <Box className="flex flex-col flex-1 relative">
            <Image
              fill
              src={feature.imageUrl}
              alt="Projects"
              className="object-cover"
            />
          </Box>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
}
