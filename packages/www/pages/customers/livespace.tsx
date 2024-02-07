import Layout from "layouts/main";
import { Box, Container } from "@livepeer/design-system";
import { Customers as Content } from "content";
import Image from "next/image";
import csHeroImage from "../../../www/assets/images/cs-hero.png";
import csEvolutionImage from "../../../www/assets/images/cs-evolution.png";
import csReason1Image from "../../../www/assets/images/cs-reason-a.png";
import csReason2Image from "../../../www/assets/images/cs-reason-b.png";
import csLivepeerImage from "../../../www/assets/images/livepeer.png";
import csFooterImage from "../../../www/assets/images/cs-footer.png";
import Prefooter from "components/Site/Prefooter";

const CaseStudyLivespace = () => {
  return (
    <Layout {...Content.metaData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="4"
          css={{
            maxWidth: "1245px",
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <section className="cs-hero cs-section">
            <div className="cs-hero-info">
              <div className="cs-main-title">Case Study</div>
              <div className="cs-title">
                LiveSpace & Livepeer Studio: A Story of Live Streaming
                Innovation
              </div>
              <div className="cs-description">
                In the dynamic world of live streaming, LiveSpace has carved out
                a unique niche for itself, thanks in large part to its
                partnership with Livepeer. This collaboration has been a
                game-changer for LiveSpace, enabling it to emerge as a serious
                contender in a domain dominated by giants like Twitch. With a
                focus on serving a diverse range of content creators, from
                gamers to musicians and artists, LiveSpace has leveraged
                Livepeer's advanced, cost-effective streaming solutions to
                redefine the creator experience.
              </div>
            </div>
            <div className="cs-hero-image">
              <div
                style={{ width: "100%", height: "100%", position: "relative" }}>
                <Image
                  alt="hero image"
                  src={csHeroImage}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </div>
          </section>
        </Container>
      </Box>

      <section style={{ position: "relative" }}>
        <div className="cs-evolution">
          <div style={{ position: "relative" }}>
            <div className="cs-evolution-image">
              <Image
                alt="evolution image"
                src={csEvolutionImage}
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>
          <div className="cs-evolution-info">
            <div className="cs-title">The Evolution of LiveSpace</div>
            <div className="cs-description">
              LiveSpace started as an ambitious venture, aiming to challenge
              established platforms by offering a more inclusive and versatile
              space for content creators. Unlike its competitors, LiveSpace
              ventured beyond the mainstream, catering to a wide array of
              talents, including unique creators like "ninepointfive," a crochet
              artist with nine and a half fingers. However, the journey wasn't
              without its challenges. Early on, LiveSpace grappled with issues
              of scalability, cost, and inadequate features from traditional
              service providers, which hampered its growth and ability to serve
              its creative community effectively.
            </div>
          </div>
        </div>
      </section>

      <Box css={{ position: "relative" }}>
        <Container
          size="4"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <section className="cs-why">
            <div className="cs-why-info">
              <div className="cs-icon">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 448 512"
                  height="20px"
                  width="20px"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M105.6 83.2v86.177a115.52 115.52 0 0 0-22.4-2.176c-47.914 0-83.2 35.072-83.2 92 0 45.314 48.537 57.002 78.784 75.707 12.413 7.735 23.317 16.994 33.253 25.851l.146.131.148.129C129.807 376.338 136 384.236 136 391.2v2.679c-4.952 5.747-8 13.536-8 22.12v64c0 17.673 12.894 32 28.8 32h230.4c15.906 0 28.8-14.327 28.8-32v-64c0-8.584-3.048-16.373-8-22.12V391.2c0-28.688 40-67.137 40-127.2v-21.299c0-62.542-38.658-98.8-91.145-99.94-17.813-12.482-40.785-18.491-62.791-15.985A93.148 93.148 0 0 0 272 118.847V83.2C272 37.765 234.416 0 188.8 0c-45.099 0-83.2 38.101-83.2 83.2zm118.4 0v91.026c14.669-12.837 42.825-14.415 61.05 4.95 19.646-11.227 45.624-1.687 53.625 12.925 39.128-6.524 61.325 10.076 61.325 50.6V264c0 45.491-35.913 77.21-39.676 120H183.571c-2.964-25.239-21.222-42.966-39.596-59.075-12.65-11.275-25.3-21.725-39.875-30.799C80.712 279.645 48 267.994 48 259.2c0-23.375 8.8-44 35.2-44 35.2 0 53.075 26.4 70.4 26.4V83.2c0-18.425 16.5-35.2 35.2-35.2 18.975 0 35.2 16.225 35.2 35.2zM352 424c13.255 0 24 10.745 24 24s-10.745 24-24 24-24-10.745-24-24 10.745-24 24-24z"></path>
                </svg>
              </div>
              <div className="cs-title">
                Choosing Livepeer Studio: A Strategic Move
              </div>
              <div className="cs-description">
                In the dynamic world of live streaming, LiveSpace has carved out
                a unique niche for itself, thanks in large part to its
                partnership with Livepeer. This collaboration has been a
                game-changer for LiveSpace, enabling it to emerge as a serious
                contender in a domain dominated by giants like Twitch. With a
                focus on serving a diverse range of content creators, from
                gamers to musicians and artists, LiveSpace has leveraged
                Livepeer's advanced, cost-effective streaming solutions to
                redefine the creator experience.
              </div>
            </div>
            <div className="cs-why-image cs-image1">
              <div className="cs-why-image-wrapper">
                <Image
                  alt="chooing livepeer"
                  src={csReason1Image}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </div>
          </section>

          <section className="cs-why">
            <div className="cs-why-image cs-image2">
              <div className="cs-why-image-wrapper">
                <Image
                  alt="chooing livepeer"
                  src={csReason2Image}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </div>
            <div className="cs-why-info">
              <div className="cs-icon">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="20px"
                  width="20px"
                  xmlns="http://www.w3.org/2000/svg">
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24a5.98 5.98 0 010 7.52c.42.14.86.24 1.33.24zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM9 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H3v-.99C3.2 16.29 6.3 15 9 15s5.8 1.29 6 2v1z"></path>
                </svg>
              </div>
              <div className="cs-title">Collaborative Growth & Innovation</div>
              <div className="cs-description">
                What set this partnership apart was the collaborative spirit
                between LiveSpace and Livepeer. This synergy enabled the
                development of features tailored to the unique needs of
                LiveSpace’s creators. Livepeer's comprehensive streaming
                solution significantly reduced the need for LiveSpace to invest
                heavily in its own engineering resources, allowing them to focus
                more on content and community building.
              </div>
            </div>
          </section>
        </Container>
      </Box>

      <section className="cs-transform">
        <div className="cs-transform-image">
          <div className="cs-transform-info">
            <div className="cs-icon">
              <svg
                stroke="currentColor"
                fill="currentColor"
                stroke-width="0"
                viewBox="0 0 24 24"
                height="20px"
                width="20px"
                xmlns="http://www.w3.org/2000/svg">
                <path fill="none" d="M0 0h24v24H0V0zm0 0h24v24H0V0z"></path>
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"></path>
              </svg>
            </div>
            <div className="cs-title">Transforming Streaming Experiences</div>
            <div className="cs-description">
              The switch to Livepeer brought about a significant transformation
              in LiveSpace's performance and cost structure. Notably, the
              platform achieved substantial cost savings, a crucial factor for
              its growth as a startup. Furthermore, features like immediate
              transcoding provided LiveSpace with a competitive edge in user
              experience. Feedback from creators highlighted the improved
              streaming quality and innovative features, enhancing overall user
              satisfaction and engagement.
            </div>
          </div>
        </div>
      </section>

      <section style={{ position: "relative" }}>
        <div className="cs-innovation cs-section">
          <div className="cs-innovation-image-wrapper">
            <div className="cs-innovation-image">
              <Image
                alt="evolution image"
                src={csFooterImage}
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>
          <div className="cs-innovation-info">
            <div className="cs-main-title">Looking Ahead:</div>
            <div className="cs-title">Continuous Innovation</div>
            <div className="cs-description">
              The future looks bright for LiveSpace with ongoing projects and
              enhancements in the pipeline. The partnership with Livepeer
              continues to be a cornerstone of their strategy, with both parties
              committed to bringing new advancements in streaming technology and
              improving user experiences. Features like clipping and enhanced
              thumbnail generation are just a few of the exciting developments
              on the horizon.
            </div>
          </div>
        </div>
      </section>

      <section className="cs-footer">
        <div className="cs-footer-title">
          <div
            style={{ width: "50px", height: "50px", position: "relative" }}
            className="cs-image">
            <Image
              alt="evolution image"
              src={csLivepeerImage}
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div>Lessons for the Future</div>
        </div>
        <div className="cs-footer-description">
          LiveSpace's journey offers valuable insights for other companies
          working with creators. Their success underscores the importance of
          being adaptable, taking creator feedback to heart, and prioritizing
          rapid feature development. By staying attuned to the needs and
          preferences of their community, LiveSpace is thriving.
        </div>
      </section>

      <Prefooter />
    </Layout>
  );
};

export default CaseStudyLivespace;
