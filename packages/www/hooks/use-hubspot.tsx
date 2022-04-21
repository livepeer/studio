import { useState, useEffect, useMemo } from "react";

const useHubspotForm = ({ portalId, formId }) => {
  const [data, setData] = useState();
  const [form, setForm] = useState<boolean | HTMLFormElement>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const url = useMemo(
    () =>
      `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
    [portalId, formId]
  );

  const fetchData = async () => {
    setIsError(false);
    setIsLoading(true);
    try {
      const formData = new FormData(form as HTMLFormElement);
      const data = {
        fields: [],
      };
      for (var pair of formData.entries()) {
        if (pair[0] !== "password" && !pair[0].includes("TICKET")) {
          data.fields.push({ name: pair[0], value: pair[1] });
        }
      }

      const result = await fetch(url, {
        method: "post",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const body = await result.json();

      const test = {
        properties: {
          subject: "test-live",
          product: "Streaming Services",
          user_s_plan: "Pro",
          hs_ticket_category: "BILLING_ISSUE",
          content: "postman content",
          hs_pipeline_stage: "1",
        },
      };

      const result1 = await fetch(
        "https://api.hubapi.com/crm/v3/objects/tickets?hapikey=21b15961-0ae0-4e98-b6e0-8c11a962410b",
        {
          method: "post",
          body: JSON.stringify(test),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const testres = await result1.json();
      console.log(testres);
      setData(body);
      setForm(false);
    } catch (e) {
      setIsError(true);
      setForm(false);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (form) {
      fetchData();
    }
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setForm(e.target);
  };

  return { data, isLoading, isError, handleSubmit };
};

export default useHubspotForm;
