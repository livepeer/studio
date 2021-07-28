import { Text, Box, Badge } from "@livepeer.com/design-system";
import { FiEye, FiHeart } from "react-icons/fi";
import { forwardRef, useRef, useCallback, useEffect, useState } from "react";
import Image from "next/image";

const videos = [
  {
    src: "https://cdn.sanity.io/files/dp4k3mpw/production/637be3e2106acb746559af41d5f57fae1edb535d.mp4",
    views: Math.round(100 + Math.random() * 500),
  },
  {
    src: "https://cdn.sanity.io/files/dp4k3mpw/production/24a650d65020ffb01beaa6c06bb79427ec5431b5.mp4",
    views: Math.round(100 + Math.random() * 500),
  },
  {
    src: "https://cdn.sanity.io/files/dp4k3mpw/production/bc7f603cf9e28c8545ce6394a6d1118e88293211.mp4",
    views: Math.round(100 + Math.random() * 500),
  },
];

const randomIntFromInterval = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const HeroVideo = forwardRef((_props, ref: React.Ref<HTMLDivElement>) => {
  const videosRef = useRef<HTMLVideoElement[]>([]);

  const [currentVideo, setCurrentVideo] = useState<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized || !videosRef.current) return;
    setIsInitialized(true);
    const currentVideo = randomIntFromInterval(0, 2);
    videosRef.current[currentVideo].play();
    setCurrentVideo(currentVideo);
  }, [isInitialized]);

  const onVideoEnded = useCallback(
    (i) => {
      if (!videosRef.current) return;
      const newCurrentVideo = i + 1 < videosRef.current.length ? i + 1 : 0;
      videosRef.current[newCurrentVideo].play();
      setCurrentVideo(newCurrentVideo);
    },
    [videosRef]
  );

  return (
    <Box
      ref={ref}
      css={{
        width: "100%",
        mx: "auto",
        overflow: "hidden",
        borderRadius: "4vw",
        "@bp3": {
          borderRadius: "36px",
        },
      }}>
      <Box as="figure" css={{ margin: 0, width: "100%", position: "relative" }}>
        <Box
          css={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            height: "100%",
            width: "100%",
          }}>
          <Image
            layout="fill"
            objectFit="cover"
            src="/hero-videos/poster.png"
            alt="video poster"
          />
        </Box>
        {videos.map(({ src }, i) => (
          <Box
            as="video"
            onEnded={() => onVideoEnded(i)}
            key={`video-swapper-item-${i}`}
            ref={(el) => (videosRef.current[i] = el)}
            css={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              objectFit: "cover",
              height: "100%",
              width: "100%",
              opacity: i === currentVideo ? 1 : 0,
              transition: "opacity 1s ease-out",
            }}
            src={src}
            muted
            playsInline
          />
        ))}
        <Box
          css={{
            position: "absolute",
            top: "$3",
            left: "$3",
            display: "flex",
            alignItems: "center",
            width: "fit-content",
          }}>
          <Badge variant="red" size="2" css={{ fontWeight: 700, mr: "$2" }}>
            Live
          </Badge>
          <Badge variant="violet" size="2" css={{ fontWeight: 700 }}>
            <Box
              as="i"
              css={{ display: "flex", alignItems: "center", mr: "$1" }}>
              <FiEye />
            </Box>
            {currentVideo !== undefined ? videos[currentVideo].views : "..."}
          </Badge>
        </Box>
        <Box
          css={{
            position: "absolute",
            bottom: "$3",
            left: "$3",
            right: "$3",
            display: "flex",
            alignItems: "center",
          }}>
          <Box
            as="input"
            placeholder="Write a comment..."
            css={{
              borderRadius: 24,
              width: "100%",
              border: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              mr: "$5",
              px: "$5",
              height: "42px",
              color: "$panel",
              fontSize: "14px",
              "&:placeholder": {
                color: "#CDCDCD",
              },
              "&:focus": {
                outline: "none",
                boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
                borderColor: "$violet9",
              },
            }}
          />
          <Box
            css={{
              background: "linear-gradient(180deg, #BD90F2 0%, #6e56cf 100%)",
              borderRadius: "50%",
              color: "$mauve7",
              height: "42px",
              width: "42px",
              minWidth: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <FiHeart />
          </Box>
        </Box>
      </Box>
      <Box
        id="background-gradient"
        css={{
          width: "100%",
          position: "absolute",
          background:
            "linear-gradient(180deg, $colors$loContrast 0%, rgba(255, 255, 255, 0) 100%)",
          height: "100%",
          top: 0,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
});

export default HeroVideo;
