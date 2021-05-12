import { Grid } from "@theme-ui/components";
import { Container, Box } from "@theme-ui/components";
import DocsNav from "components/DocsLayout/nav";
import SideNav from "components/DocsLayout/sideNav";
import { useState } from "react";
import {
  NavigationCard,
  DocsPost,
  SimpleCard,
  DocsGrid,
} from "components/DocsLayout/helpers";
import {
  IconApiReference,
  IconHouse,
  IconVideoGuides,
} from "components/DocsLayout/icons";

const mobileCategories = [
  {
    name: 'Homepage',
    icon: <IconHouse id='mobileHouse' />
  },
  {
    name: 'Video Guides',
    icon: <IconVideoGuides id='mobileVideoGuides' />
  },
  {
    name: 'API Reference',
    icon: <IconApiReference id='mobileApiReference' />
  },
]

const categories = [
  {
    name: 'Homepage',
    icon: <IconHouse />
  },
  {
    name: 'Video Guides',
    icon: <IconVideoGuides />
  },
  {
    name: 'API Reference',
    icon: <IconApiReference />
  },
]

const DocsIndex = () => {
  const [hideTopNav, setHideTopNav] = useState(false);
  const [hideSideBar, setHideSideBar] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(categories[0]);

  return (
    <Box
      sx={{ display: "flex", position: "relative", flexDirection: "column" }}>
      <DocsNav
        hideTopNav={hideTopNav}
        setHideTopNav={setHideTopNav}
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        categories={categories}
        mobileCategories={mobileCategories}
      />
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
            ml: ['0', hideSideBar ? "70px" : "272px"],
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
            <DocsGrid cols={2}>
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
            </DocsGrid>
            <DocsGrid cols={3}>
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
            </DocsGrid>
            <DocsGrid cols={2}>
              <DocsPost
                image="/img/thumbnail.png"
                title="Start Live Streaming (no code required)"
                description="Start to livestream with Livepeer.com"
                href="/"
              />
              <DocsPost
                image="/img/thumbnail.png"
                title="Start Live Streaming (no code required)"
                description="Start to livestream with Livepeer.com"
                href="/"
              />
            </DocsGrid>
          </div>
        </Container>
      </div>
    </Box>
  );
};

export default DocsIndex;
