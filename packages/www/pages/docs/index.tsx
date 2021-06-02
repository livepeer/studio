import { Grid } from "@theme-ui/components";
import { Container, Box } from "@theme-ui/components";
import DocsNav from "components/DocsLayout/nav";
import SideNav from "components/DocsLayout/sideNav";
import { useState } from "react";
import { NavigationCard, SimpleCard } from "components/DocsLayout/helpers";

const DocsIndex = () => {
  const [hideTopNav, setHideTopNav] = useState(false);
  const [hideSideBar, setHideSideBar] = useState(false);

  return (
    <Box
      sx={{ display: "flex", position: "relative", flexDirection: "column" }}>
      <DocsNav hideTopNav={hideTopNav} setHideTopNav={setHideTopNav} />
      <div sx={{ display: "flex" }}>
        <div
          sx={{
            position: "absolute",
            transition: "all 0.2s",
            top: hideTopNav ? "76px" : "136px",
          }}>
          <SideNav
            hideTopNav={hideTopNav}
            hideSideBar={hideSideBar}
            setHideSideBar={setHideSideBar}
          />
        </div>
        <Container
          sx={{
            ml: hideSideBar ? "70px" : "272px",
            mt: hideTopNav ? "-12px" : "48px",
            mr: 0,
            transition: "all 0.2s",
            display: "flex",
            justifyContent: "center",
          }}>
          <div
            sx={{
              display: "flex",
              flexDirection: "column",
              alignSelf: "center",
              maxWidth: "768px",
            }}>
            <Grid sx={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <SimpleCard
                title="How to live stream with the Livepeer.com API"
                description="How to set up your integration with the Livepeer.com API."
                href="/"
              />
              <SimpleCard
                title="How to live stream with the Livepeer.com API"
                description="How to set up your integration with the Livepeer.com API. "
                href="/"
                label="Read here"
              />
            </Grid>
            <Grid sx={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
              <NavigationCard
                title="How to live stream with the Livepeer.com API"
                href="/"
              />
              <NavigationCard
                title="How to live stream with the Livepeer.com API"
                href="/"
                label="Read here"
              />
              <NavigationCard
                title="How to live stream with the Livepeer.com API"
                href="/"
                label="Read here"
              />
            </Grid>
          </div>
        </Container>
      </div>
    </Box>
  );
};

export default DocsIndex;
