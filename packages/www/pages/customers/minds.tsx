import Layout from "layouts/main";
import { Box, Container } from "@livepeer/design-system";
import { Customers as Content } from "content";
import Image from "next/image";
import csHeroImage from "../../../www/assets/images/cs-minds-hero.png";
import csChallengeImage from "../../../www/assets/images/cs-minds-challenge.png";
import csSolutionImage from "../../../www/assets/images/cs-minds-solution.png";
import Prefooter from "components/Site/Prefooter";

const CaseStudyMinds = () => {
  return (
    <Layout {...Content.metaData}>
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
          <section className="cs-hero cs-section">
            <div className="cs-hero-info">
              <div className="cs-main-title">Case Study</div>
              <div className="cs-title">
                Minds finds Livepeer Studio to be the perfect tech partner for
                live streaming
              </div>
              <div className="cs-subtitle">
                The Minds social network uses Livepeer Studio live streaming to
                empower its social media creators
              </div>
              <div className="cs-description">
                Minds is an open source social network dedicated to freedom of
                speech. In 2023, Minds reached out to Livepeer Studio for help
                with its live streaming technology to support the company's
                video sharing capabilities. Livepeer Studio worked with Minds to
                develop live streaming offerings for the Minds target customer
                base.
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

      <section style={{ position: "relative" }} className="cs-minds-challenge">
        <div className="cs-evolution">
          <div style={{ position: "relative" }}>
            <div className="cs-evolution-image">
              <Image
                alt="evolution image"
                src={csChallengeImage}
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>
          <div className="cs-evolution-info">
            <div className="cs-why-info">
              <div className="cs-icon">
                <svg
                  stroke="currentColor"
                  fill="none"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="20px"
                  width="20px"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
                </svg>
              </div>
            </div>
            <div className="cs-title">The Challenge</div>
            <div className="cs-description">
              Setting up and maintaining a live streaming platform requires
              investment on the part of the company, whereas customers expect
              the service for free. Deciding how to spend resources is a
              delicate balance. Another challenge is using the technology to
              increase user engagement, which is more important than just
              growing the number of followers.
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
                  viewBox="0 0 352 512"
                  height="20px"
                  width="20px"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M176 80c-52.94 0-96 43.06-96 96 0 8.84 7.16 16 16 16s16-7.16 16-16c0-35.3 28.72-64 64-64 8.84 0 16-7.16 16-16s-7.16-16-16-16zM96.06 459.17c0 3.15.93 6.22 2.68 8.84l24.51 36.84c2.97 4.46 7.97 7.14 13.32 7.14h78.85c5.36 0 10.36-2.68 13.32-7.14l24.51-36.84c1.74-2.62 2.67-5.7 2.68-8.84l.05-43.18H96.02l.04 43.18zM176 0C73.72 0 0 82.97 0 176c0 44.37 16.45 84.85 43.56 115.78 16.64 18.99 42.74 58.8 52.42 92.16v.06h48v-.12c-.01-4.77-.72-9.51-2.15-14.07-5.59-17.81-22.82-64.77-62.17-109.67-20.54-23.43-31.52-53.15-31.61-84.14-.2-73.64 59.67-128 127.95-128 70.58 0 128 57.42 128 128 0 30.97-11.24 60.85-31.65 84.14-39.11 44.61-56.42 91.47-62.1 109.46a47.507 47.507 0 0 0-2.22 14.3v.1h48v-.05c9.68-33.37 35.78-73.18 52.42-92.16C335.55 260.85 352 220.37 352 176 352 78.8 273.2 0 176 0z"></path>
                </svg>
              </div>
              <div className="cs-title">The Solution</div>
              <div className="cs-description">
                Minds found that Livepeer Studio was willing to develop the
                technology to solve its challenges. Livepeer Studio Studio was
                able to develop and rollout the technology in record time, a
                testament to Livepeer Studio's developer experience. Livepeer
                Studio Studio has given Minds users the platform to livestream
                video posts within the Minds social communities. Minds creators
                can now share real-time video content in an intimate, loosely
                moderated space that feels safe. Livepeer Studio also enabled
                access keys, so that users can control who views their videos.
              </div>
            </div>
            <div className="cs-why-image cs-image1">
              <div className="cs-why-image-wrapper">
                <Image
                  alt="chooing livepeer"
                  src={csSolutionImage}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </div>
          </section>
        </Container>
      </Box>

      <section className="cs-success-metrics">
        <div className="cs-success-metrics-title">Success Metrics</div>
        <div className="cs-success-metrics-stats">
          <div className="cs-success-metrics-item item1">
            <div className="cs-success-metrics-item-count">
              <div className="number">2</div>
              <div className="description">WEEKS</div>
            </div>
            <div className="cs-success-metrics-item-description">
              From start to launch
            </div>
          </div>
          <div className="cs-success-metrics-item item2">
            <div className="cs-success-metrics-item-count">
              <div className="number">0.09%</div>
            </div>
            <div className="cs-success-metrics-item-description">
              Rebuffer rate
            </div>
          </div>
          <div className="cs-success-metrics-item item3">
            <div className="cs-success-metrics-item-count">
              <div className="number">55%</div>
            </div>
            <div className="cs-success-metrics-item-description">
              Cost savings
            </div>
          </div>
        </div>
      </section>

      <section className="cs-transform cs-minds-results">
        <div className="cs-minds-results-image">
          <div className="cs-transform-info">
            <div className="cs-icon">
              <svg
                stroke="currentColor"
                fill="none"
                stroke-width="2"
                viewBox="0 0 24 24"
                stroke-linecap="round"
                stroke-linejoin="round"
                height="20px"
                width="20px"
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <div className="cs-title">The Results</div>
            <div className="cs-description">
              The use of Livepeer Studio's video streaming platform was a
              next-level enhancement for the Minds social network. By providing
              world-class live streaming capabilities, Livepeer Studio caters to
              Minds' target audience of users who expect to see live video in
              social posts. The upgrade in technology fits right into Minds's
              open source social media platform and further empowers Minds
              creators to post content that is authentic and engaging.
            </div>
          </div>
        </div>
      </section>

      <Prefooter />
    </Layout>
  );
};

export default CaseStudyMinds;
