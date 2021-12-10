import { useCallback, useMemo, useEffect, useState } from "react";
import Fade from "react-reveal/Fade";
import { Element } from "react-scroll";
import { Box } from "@livepeer.com/design-system";
import Hero from "components/Marketing/Hero";
import Layout from "layouts/main";
import { getJobs } from "hooks";

import { Jobs as Content } from "content";
import JobsSection from "@components/Marketing/JobsSection";

type jobState = {
  id: string;
  title: string;
  slug: string;
};

const JobsPage = () => {
  const [jobs, setJobs] = useState<jobState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getJobs()
      .then((res) => {
        setJobs(res);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout {...Content.metaData}>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          Loading...
        </Box>
      </Layout>
    );
  }

  return (
    <Layout {...Content.metaData}>
      <Fade>
        <Element offset={-20} key="hero" id="hero" name="hero">
          <Hero
            heading="Work @ Livepeer, Inc."
            centered={true}
            skinny={true}
            description={null}
            ctas={[]}
            image={null}
            tagline={null}
          />
        </Element>
      </Fade>
      <Fade>
        <Element offset={-20} key="hero" id="hero" name="hero">
          <JobsSection jobs={jobs} />
        </Element>
      </Fade>
    </Layout>
  );
};

export default JobsPage;
