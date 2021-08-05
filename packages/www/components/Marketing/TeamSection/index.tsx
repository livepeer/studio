import { Container, Grid } from "@livepeer.com/design-system";
import TeamMember from "@components/Marketing/TeamMember";

const TeamSection = ({ teamMembers }) => {
  return (
    <Grid
      gap={6}
      css={{
        gridTemplateColumns: "repeat(1,1fr)",
        "@bp1": {
          gridTemplateColumns: "repeat(2,1fr)",
        },
        "@bp2": {
          gridTemplateColumns: "repeat(3,1fr)",
        },
        "@bp3": {
          gridTemplateColumns: "repeat(4,1fr)",
        },
      }}>
      {teamMembers.map((t, i) => (
        <TeamMember
          key={i}
          fullname={t.fullname}
          role={t.role}
          image={t.image}
          twitter={t.twitter}
          linkedin={t.linkedin}
          github={t.github}
          medium={t.medium}
          css={{
            flex: "1 1 100%",
            "@bp1": {
              flex: "1 1 50%",
            },
            "@bp2": {
              flex: "1 1 33%",
            },
            "@bp3": {
              flex: "1 1 25%",
            },
          }}
        />
      ))}
    </Grid>
  );
};

export default TeamSection;
