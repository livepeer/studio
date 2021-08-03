import {
  Flex,
  Heading,
  Container,
  Box,
  Link as A,
} from "@livepeer.com/design-system";
import Link from "next/link";

const JobsSection = ({ jobs }) => {
  return (
    <Container css={{ maxWidth: 960, margin: "0 auto 80px" }}>
      {jobs.map((j, i) => (
        <Flex
          key={i}
          css={{
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 -1px 0 0 #f7f7f7",
            padding: 35,
            transition: "all 200ms ease-in-out",
            "&:hover": {
              boxShadow: "0 0 30px 0 rgba(0,0,0,0.12)",
              borderRadius: "8px",
            },
          }}>
          <Link href="/jobs/[slug]" as={`/jobs/${j.slug.current}`} passHref>
            <A
              css={{
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "none",
                },
              }}>
              <Heading as="h2" size="1">
                {j.title}
              </Heading>
            </A>
          </Link>
          <Link href="/jobs/[slug]" as={`/jobs/${j.slug.current}`} passHref>
            <A variant="violet">Apply</A>
          </Link>
        </Flex>
      ))}
    </Container>
  );
};

export default JobsSection;
