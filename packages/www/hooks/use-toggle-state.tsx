import { useCallback } from "react";
import { useState } from "react";

export const useToggleState = (initialState = false) => {
  const [on, setOn] = useState(initialState);

  const onOn = useCallback(() => {
    setOn(true);
  }, []);

  const onOff = useCallback(() => {
    setOn(false);
  }, []);

  const onToggle = useCallback(() => {
    setOn((p) => !p);
  }, []);

  return { on, onOn, onOff, onToggle };
};
