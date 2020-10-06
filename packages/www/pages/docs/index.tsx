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
    img: {
      src: "/img/docs/flag.png",
      alt: "flag",
      sx: { width: "140px" }
    },
    title: "Getting started",
    description: "Start live streaming now!",
    link: { href: "/docs/guides" }
  },
  {
    img: {
      src: "/img/docs/puzzle.png",
      alt: "puzzle",
      sx: { width: "140px" }
    },
    title: "Feature support matrix",
    description: "Learn about compatible video formats and workflows.",
    link: { href: "/docs/guides/support-matrix" }
  },
  {
    img: {
      src: "/img/docs/stopwatch.png",
      alt: "stopwatch",
      sx: { width: "120px" }
    },
    title: "Your first stream in under 5 minutes",
    description: "Read the Livepeer.com blog post.",
    link: { href: "/blog/first-livepeer-stream-in-five-minutes" }
  }
];

const popularTopics: React.ComponentProps<typeof DocsPopularTopicCard>[] = [
  {
    title: "How to create a stream with the Livepeer.com API",
    excerpt:
      "To create a stream, send a POST request to https://livepeer.com/api/stream.",
    href: "/docs/guides/api/create-a-stream"
  },
  {
    title: "How to verify stream status with the Livepeer.com API",
    excerpt:
      "To verify a stream is running, you can fetch the stream status by sending a `GET` request to `https://livepeer.com/api/stream/` with the stream object `id` appended.",
    href: "/docs/guides/api/verify-stream-status"
  },
  {
    title: "How to create a stream in the Livepeer.com dashboard",
    excerpt:
      "Open your Livepeer.com account and navigate to the streams list page, https://livepeer.com/app/user.",
    href: "/docs/guides/dashboard/create-a-stream"
  },
  {
    title:
      "How to use the Livepeer.com API to list all streams created by a Livepeer.com user",
    excerpt:
      "To list all the streams created by a user, you will need the `userId` from the API key object.",
    href: "/docs/guides/api/list-all-streams"
  },
  {
    title: "How to create a Livepeer.com account",
    excerpt:
      "Whether you are integrating your streaming application directly with the Livepeer.com API or creating individual streams in the Livepeer.com dashboard, you’ll need to create a Livepeer.com account.",
    href: "/docs/guides/account/create-an-account"
  },
  {
    title: "When do you need an Livepeer.com API key?",
    excerpt:
      "You need an API key to live stream with the Livepeer.com API. You do not need to create an API key for the Livepeer.com dashboard-only workflow.",
    href: "/docs/guides/api-keys/when-do-you-need-an-api-key"
  }
];

const DocsIndex = () => {
  return (
    <Layout
      title={`Docs - Livepeer.com`}
      description={`Everything you need to build powerful video applications with Livepeer.com`}
      url={`https://livepeer.com/docs`}
      customNav={<DocsNav />}
      withGradientBackground
    >
      <div sx={{ overflowX: "hidden" }}>
        <Container variant="hero" sx={{ maxWidth: "1220px" }}>
          <h1 sx={{ variant: "text.heading.hero" }}>Documentation</h1>
          <p sx={{ variant: "text.heroDescription", mb: [4, 5] }}>
            Welcome to the Livepeer.com documentation!
          </p>
          <Fade fraction={0.05}>
            <KeenSliderGrid
              breakpoints={[
                { value: "320px", slidesPerView: 1 },
                { value: "604px", slidesPerView: 2 },
                { value: "832px", slidesPerView: 3 }
              ]}
            >
              {categories.map((category) => (
                <DocsCategoryCard {...category} key={category.title} />
              ))}
            </KeenSliderGrid>
          </Fade>
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
              Popular guides
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
      <Fade>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export default DocsIndex;
