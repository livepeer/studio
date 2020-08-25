import Fade from "react-reveal/Fade";
import Layout from "../components/Layout";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../queries/allPages.gql";
import { getComponent } from "../lib/utils";
import SectionLayout from "../components/SectionLayout";
import IconListItem, { IconListItemProps } from "../components/IconListItem";
import { Grid } from "@theme-ui/components";
import {
  FiUserCheck,
  FiPlay,
  FiZap,
  FiMaximize2,
  FiCode,
  FiPlayCircle,
  FiCheckSquare,
  FiGlobe
} from "react-icons/fi";

const benefitsListItems: IconListItemProps[] = [
  {
    icon: <FiUserCheck />,
    title: "Easy to use",
    description:
      "Our straight forward API’s make integrating Livepeer into your UGC platform a quick and easy task."
  },
  {
    icon: <FiPlay />,
    title: "Reliable",
    description:
      "Ensure content creator audiences remain engaged by delivering high quality streams with 99.99% reliability."
  },
  {
    icon: <FiMaximize2 />,
    title: "Scalable",
    description:
      "Freedom to scale up or down so you can manage content creator demand without over investing in infrastructure."
  },
  {
    icon: <FiZap />,
    title: "Affordable",
    description:
      "Live Streaming at a fraction of the cost of comparable services."
  }
];

const featuresListItems: IconListItemProps[] = [
  {
    icon: <FiCode />,
    title: "Transcoding",
    description:
      "High quality, reliable transcoding at a cost that makes running a video centric UGC platform with millions of content creators viable."
  },
  {
    icon: <FiPlayCircle />,
    title: "Smart video",
    description:
      "Livepeer.com leverages the GPU processing pipeline in our infrastructure to support content moderation necessary in running UGC platforms."
  },
  {
    icon: <FiCheckSquare />,
    title: "Interactivity",
    description:
      "Key features to enable interactive use cases that drive engagement on UGC platforms including low latency and object detection."
  },
  {
    icon: <FiGlobe />,
    title: "Integration API",
    description:
      "Simple and easy to implement API’s that support seamless integration with your UGC platform."
  }
];

const HomePage = ({ content, preview }) => {
  return (
    <Layout
      title={`Home - Livepeer`}
      description={`Scalable, secure live transcoding at a fraction of the cost`}
      url={`https://livepeer.com`}
      preview={preview}
      withGradientBackground
    >
      {content.map((component, i) => (
        <Fade key={i}>{getComponent(component)}</Fade>
      ))}
      <SectionLayout
        heading={{
          title:
            "A platform uniquely tailored to address the needs of today’s video-centric UGC platforms",
          tag: "Benefits",
          cta: { children: "Sign up for free" }
        }}
        gradient="colorful"
      >
        <Grid columns={[1, 2]} sx={{ columnGap: 4, rowGap: 5 }}>
          {benefitsListItems.map((item) => (
            <IconListItem key={`benefits-list-item-${item.title}`} {...item} />
          ))}
        </Grid>
      </SectionLayout>
      <SectionLayout
        heading={{
          title:
            "Feature-rich, high quality streaming and on-demand video for your project",
          tag: "Features",
          cta: { children: "Sign up for free" }
        }}
      >
        <Grid columns={[1, 2]} sx={{ columnGap: 4, rowGap: 5 }}>
          {featuresListItems.map((item) => (
            <IconListItem key={`features-list-item-${item.title}`} {...item} />
          ))}
        </Grid>
      </SectionLayout>
    </Layout>
  );
};

export async function getStaticProps({ preview = false }) {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    {
      ...(preview && {
        headers: {
          authorization: `Bearer ${process.env.SANITY_API_TOKEN}`
        }
      })
    }
  );

  let data: any = await graphQLClient.request(print(allPages), {
    where: {
      _: { is_draft: preview },
      slug: { current: { eq: "home" } }
    }
  });

  // if in preview mode but no draft exists, then return published post
  if (preview && !data.allPage.length) {
    data = await graphQLClient.request(print(allPages), {
      where: {
        _: { is_draft: false },
        slug: { current: { eq: "home" } }
      }
    });
  }

  return {
    props: {
      ...data.allPage[0],
      preview
    },
    revalidate: 1
  };
}

export default HomePage;
