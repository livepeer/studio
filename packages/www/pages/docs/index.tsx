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

const categories: React.ComponentProps<typeof DocsCategoryCard>[] = [
  {
    img: { src: "/img/docs/key.png", alt: "key image", sx: { width: "130px" } },
    title: "API Keys",
    description: "Learn how to use our API key to live transcode.",
    link: { href: "/docs/introduction" }
  },
  {
    img: {
      src: "/img/docs/globe.png",
      alt: "globe image",
      sx: { width: "120px" }
    },
    title: "Broadcasting",
    description: "Learn how to broadcast a stream session.",
    link: { href: "/docs/introduction" }
  },
  {
    img: {
      src: "/img/docs/shield.png",
      alt: "shield image",
      sx: { width: "100px" }
    },
    title: "ETH esentials",
    description: "Learn how we use the Blockchain.",
    link: { href: "/docs/introduction" }
  },
  {
    img: {
      src: "/img/docs/equalizer.png",
      alt: "equalizer image",
      sx: { width: "90px" }
    },
    title: "Specifications",
    description: "Understanding the stream page specifications.",
    link: { href: "/docs/introduction" }
  }
];

const popularTopics: React.ComponentProps<typeof DocsPopularTopicCard>[] = [
  {
    title: "How to create a stream",
    excerpt:
      "Before live streaming via the Livepeer API, you will need to create a Livepeer account and be...",
    href: "/docs/introduction"
  },
  {
    title: "How to create a stream 2",
    excerpt:
      "Before live streaming via the Livepeer API, you will need to create a Livepeer account and be...",
    href: "/docs/introduction"
  }
];

const DocsIndex = () => {
  return (
    <Layout
      title={`Docs - Livepeer.com`}
      description={`TODO`}
      url={`https://livepeer.com/docs`}
      withGradientBackground
    >
      <div sx={{ overflowX: "hidden" }}>
        <Container sx={{ textAlign: "center", maxWidth: "1056px", mb: 6 }}>
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
              alignItems: "center",
              justifyContent: "space-between",
              mt: "160px"
            }}
          >
            <h2>Popular topics</h2>
            <Button>Go to guides</Button>
          </Flex>
          <Grid>
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
};

export default DocsIndex;
