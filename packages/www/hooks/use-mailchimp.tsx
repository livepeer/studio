import jsonp from "jsonp";
import { useState } from "react";

const getURL = (url) => url.replace("/post?", "/post-json?");

const isResponseIsError = (response) => response.result !== "success";

const getDefaultState = () => ({
  error: null,
  loading: false,
  data: null,
});

export default function useMailchimp({ url }) {
  const [state, setState] = useState(getDefaultState);

  const reset = () => {
    setState(getDefaultState());
  };

  const subscribe = (data) => {
    const params = new URLSearchParams(data).toString();
    const requestURL = getURL(url) + "&" + params;
    const requestOpts = {
      param: "c",
      timeout: 4000,
    };

    setState({
      loading: true,
      error: null,
      data: null,
    });

    const process = (error, response) => {
      if (error) {
        setState({
          loading: false,
          error,
          data: response,
        });
        return;
      }
      if (isResponseIsError(response)) {
        setState({
          loading: false,
          error: new Error(response.msg),
          data: response,
        });
        return;
      }
      setState({
        loading: false,
        error: null,
        data: response,
      });
    };

    jsonp(requestURL, requestOpts, process);
  };

  return [state, subscribe, reset];
}
