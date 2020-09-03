import Fade from "react-reveal/Fade";
import Layout from "../../components/Layout";
import { Container } from "@theme-ui/components";
import DocsCategoryCard from "../../components/cards/cards/category";
import KeenSliderGrid from "../../components/KeenSliderGrid";
import { Flex } from "@theme-ui/components";
import Button from "../../components/Button";
import Prefooter from "../../components/Prefooter";
import { Grid } from "@theme-ui/components";
import DocsPopularTopicCard from "../../components/cards/cards/popular-topic";
import { DocsNav } from "../../components/Navigation";

const categories: React.ComponentProps<typeof DocsCategoryCard>[] = [
  {
    img: { src: "/img/docs/key.png", alt: "key image", sx: { width: "130px" } },
    title: "API Keys",
    description: "Learn how to use our API key to live transcode.",
    link: { href: "/docs/guides/api/create-api-key" }
  },
  {
    img: {
      src: "/img/docs/globe.png",
      alt: "globe image",
      sx: { width: "120px" }
    },
    title: "Broadcasting",
    description: "Learn how to broadcast a stream session.",
    link: { href: "/docs/guides/dashboard/broadcast-a-stream-session" }
  },
  {
    img: {
      src: "/img/docs/shield.png",
      alt: "shield image",
      sx: { width: "100px" }
    },
    title: "ETH esentials",
    description: "Learn how we use the Blockchain.",
    link: { href: "/docs/guides" }
  },
  {
    img: {
      src: "/img/docs/equalizer.png",
      alt: "equalizer image",
      sx: { width: "90px" }
    },
    title: "Specifications",
    description: "Understanding the stream page specifications.",
    link: { href: "/docs/guides" }
  }
];

const popularTopics: React.ComponentProps<typeof DocsPopularTopicCard>[] = [
  {
    title: "How to create a stream",
    excerpt:
      "Before live streaming via the Livepeer.com API, you will need to create a Livepeer.com account and be able to create a RTMP stream. You do not need to create an API key.",
    href: "/docs/guides/dashboard/create-a-stream"
  },
  {
    title: "How to broadcast a stream session",
    excerpt:
      "Your users or your application will need to be able to push an RTMP stream. When configuring the software to push streams, use the secret stream key and RTMP ingest URL from the stream page.",
    href: "/docs/guides/dashboard/broadcast-a-stream-session"
  },
  {
    title: "How to get base URLs",
    excerpt:
      "There are 2 types of base URLs: The ingest base URL is a part of the (rtmp) ingest URL, used for the broadcaster to ingest the video stream. The playback base URL is a part of the playback URL, used for the viewers to watch the stream.",
    href: "/docs/guides/api/base-urls"
  },
  {
    title: "How to create a stream",
    excerpt:
      "To create a stream, We'll send a POST requst to https://livepeer.com/api/stream.",
    href: "/docs/guides/api/create-a-stream"
  },
  {
    title: "How to delete a stream",
    excerpt: `You can delete a stream by sending the DELETE request with a specific "streamId".`,
    href: "/docs/guides/api/delete-a-stream"
  },
  {
    title: "How to create an API key",
    excerpt:
      "Open your Livepeer.com account and navigate to the API key list page, https://livepeer.com/app/user/keys.",
    href: "/docs/guides/api-keys/create-an-api-key"
  }
];

const DocsIndex = () => (
  <Layout
    title={`Docs - Livepeer.com`}
    description={`TODO`}
    url={`https://livepeer.com/docs`}
    customNav={<DocsNav />}
    withGradientBackground
  >
    <div sx={{ overflowX: "hidden" }}>
      <Container variant="hero" sx={{ maxWidth: "1056px" }}>
        <h1 sx={{ variant: "text.heading.hero" }}>Documentation</h1>
        <p sx={{ variant: "text.heroDescription", mb: [4, 5] }}>
          Here you could find all the information needed in order to take your
          product to a whole new level.
        </p>
        <KeenSliderGrid
          breakpoints={[
            { value: "320px", slidesPerView: 1 },
            { value: "604px", slidesPerView: 2 },
            { value: "832px", slidesPerView: 3 },
            { value: "1440px", slidesPerView: 4 }
          ]}
        >
          {categories.map((category) => (
            <DocsCategoryCard {...category} key={category.title} />
          ))}
        </KeenSliderGrid>
        <Flex
          sx={{
            alignItems: ["flex-start", "center"],
            justifyContent: "space-between",
            mt: ["80px", "160px"],
            mb: 4,
            flexDirection: ["column", "row"]
          }}
        >
          <h2
            sx={{
              mb: [3, 0],
              fontSize: ["32px", "48px"],
              lineHeight: ["40px", "56px"]
            }}
          >
            Popular topics
          </h2>
          <Button href="/docs/guides" isLink>
            Go to guides
          </Button>
        </Flex>
        <Grid columns={[1, 2]} gap={3}>
          {popularTopics.map((topic) => (
            <DocsPopularTopicCard {...topic} key={`topic-${topic.title}`} />
          ))}
        </Grid>
      </Container>
    </div>
    <Fade key={0}>
      <Prefooter />
    </Fade>
  </Layout>
);

export default DocsIndex;
