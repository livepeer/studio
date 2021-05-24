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
      <Heading size="2" css={{ letterSpacing: "0", fontWeight: 600, mb: "$5" }}>
        Get started with Livepeer.com, Paige
      </Heading>
      <Accordion type="single">
        <AccordionItem value="accordion-one">
          <AccordionButton css={{ color: "$blue900" }}>
            <Text size="3" css={{ color: "inherit", fontWeight: 500 }}>
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
          <AccordionButton css={{ color: "$blue900" }}>
            <Text size="3" css={{ color: "inherit", fontWeight: 500 }}>
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
          <AccordionButton css={{ color: "$blue900" }}>
            <Text size="3" css={{ color: "inherit", fontWeight: 500 }}>
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
