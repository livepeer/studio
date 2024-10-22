import { useState, useEffect, useMemo } from "react";

const useHubspotForm = ({ portalId, formId }) => {
  const [data, setData] = useState();
  const [form, setForm] = useState<boolean | HTMLFormElement>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const url = useMemo(
    () =>
      `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
    [portalId, formId],
  );

  console.log("useMemo URL: " + url);

  const fetchData = async () => {
    console.log("fetchData");
    setIsError(false);
    setIsLoading(true);
    try {
      const formData = new FormData(form as HTMLFormElement);
      const data = {
        fields: [],
      };
      for (var pair of formData.entries()) {
        if (pair[0] !== "password") {
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
      console.log("body");
      console.log(body);
      setData(body);
      setForm(false);
    } catch (e) {
      console.log("error");
      console.log(e);
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
