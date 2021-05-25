import {
  Heading,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Text,
} from "@livepeer.com/design-system";

const GettingStarted = () => {
  return (
    <>
      <Heading size="2" css={{ letterSpacing: "0", fontWeight: 600, mb: "$4" }}>
        Get started with Livepeer.com, Paige
      </Heading>
      <Accordion type="single">
        <AccordionItem value="accordion-one">
          <AccordionButton css={{ color: "$slate12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your first live stream
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text size="3" css={{ lineHeight: "23px" }}>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quas
              debitis unde nihil, aspernatur maxime est eos at natus ipsum
              repellat sapiente, error accusantium exercitationem? Placeat
              aspernatur aperiam quod repellendus culpa?
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="accordion-two">
          <AccordionButton css={{ color: "$slate12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Integrate with the API
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text size="3" css={{ lineHeight: "23px" }}>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quas
              debitis unde nihil, aspernatur maxime est eos at natus ipsum
              repellat sapiente, error accusantium exercitationem? Placeat
              aspernatur aperiam quod repellendus culpa?
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="accordion-three">
          <AccordionButton css={{ color: "$slate12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your first app
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text size="3" css={{ lineHeight: "23px" }}>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quas
              debitis unde nihil, aspernatur maxime est eos at natus ipsum
              repellat sapiente, error accusantium exercitationem? Placeat
              aspernatur aperiam quod repellendus culpa?
            </Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default GettingStarted;
