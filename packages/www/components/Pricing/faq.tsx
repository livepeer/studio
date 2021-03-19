import { useState } from "react";
import Collapsible from "react-collapsible";

type TriggerProps = {
  question: string;
};

const faq = [
  {
    trigger: "Question 1",
    answer:
      "This is the answer to the question. It has a length enough to complete two lines of text so the card doesn’t look empty.",
  },
  {
    trigger: "Question 2",
    answer:
      "This is the answer to the question. It has a length enough to complete two lines of text so the card doesn’t look empty.",
  },
  {
    trigger: "Question 3",
    answer:
      "This is the answer to the question. It has a length enough to complete two lines of text so the card doesn’t look empty.",
  },
  {
    trigger: "Question 4",
    answer:
      "This is the answer to the question. It has a length enough to complete two lines of text so the card doesn’t look empty.",
  },
  {
    trigger: "Question 5",
    answer:
      "This is the answer to the question. It has a length enough to complete two lines of text so the card doesn’t look empty.",
  },
  {
    trigger: "Question 6",
    answer:
      "This is the answer to the question. It has a length enough to complete two lines of text so the card doesn’t look empty.",
  },
  {
    trigger: "Question 7",
    answer:
      "This is the answer to the question. It has a length enough to complete two lines of text so the card doesn’t look empty.",
  },
];

const PlusIcon = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 5V19"
        stroke="black"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M5 12H19"
        stroke="black"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const Trigger = ({ question }: TriggerProps) => {
  return (
    <div
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
      }}>
      <p sx={{ fontSize: "20px", fontWeight: "600" }}>{question}</p>
      <i>
        <PlusIcon />
      </i>
    </div>
  );
};

const PricingFaq = () => {
  const [questionOpen, setQuestionOpen] = useState(null);
  return (
    <div
      sx={{
        alignSelf: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "790px",
        mt: "144px",
        mb: '112px'
      }}>
      <h1
        sx={{ fontSize: [5, 5, 6], mb: ["42px", "64px"], textAlign: "center" }}>
        Frequently asked questions
      </h1>
      {faq.map((question, idx) => (
        <Collapsible
          key={idx}
          handleTriggerClick={() =>
            questionOpen === idx ? setQuestionOpen(null) : setQuestionOpen(idx)
          }
          open={questionOpen === idx}
          transitionTime={200}
          trigger={<Trigger question={question.trigger} />}>
          <p
            sx={{
              color: "#525252",
              fontSize: "18px",
              lineHeight: "1.6",
              mt: "16px",
            }}>
            {question.answer}
          </p>
        </Collapsible>
      ))}
    </div>
  );
};

export default PricingFaq;
