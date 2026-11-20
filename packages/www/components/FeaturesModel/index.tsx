import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "components/ui/alert-dialog";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { featuresList } from "content/ftux-model";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineSparkles } from "react-icons/hi";

export default function FeaturesModel() {
  const [shouldShowFeature, setShouldShowFeature] = useState(false);

  const renderDescriptionWithLineBreaks = (text) => {
    return text.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const feature = featuresList.filter((feature) => feature.isActive)[0];

  if (!feature) return null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasShownFeature = localStorage.getItem(
        `hasShownFeature-${feature.id}`
      );
      if (!hasShownFeature) {
        setShouldShowFeature(true);
        localStorage.setItem(`hasShownFeature-${feature.id}`, "true");
      }
    }
  }, []);

  return (
    <AlertDialog open={shouldShowFeature}>
      <AlertDialogContent className="p-0 border-0 max-w-3xl">
        <div className="flex flex-row gap-3">
          <div className="flex flex-col flex-1 justify-center p-5">
            <Badge className="w-fit py-1">
              <HiOutlineSparkles className="mr-2" />
              New Feature
            </Badge>
            <AlertDialogTitle className="mt-4">
              {feature.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="my-2">
              {renderDescriptionWithLineBreaks(feature.description)}
            </AlertDialogDescription>
            <div className="flex flex-row gap-3 mt-2">
              <Button
                className="px-10"
                onClick={() => {
                  setShouldShowFeature(false);
                }}>
                Got it
              </Button>
              <Button
                variant="link"
                onClick={() => {
                  setShouldShowFeature(false);
                }}>
                <Link href={feature.learnMoreUrl} target="_blank">
                  Learn more
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col flex-1 relative">
            <Image
              fill
              src={feature.imageUrl}
              alt="Projects"
              className="object-cover"
            />
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
