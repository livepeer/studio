import { useCallback } from "react";
import { useState } from "react";

export type ToggleState = {
  on: boolean;
  onOn(): void;
  onOff(): void;
  onToggle(): void;
};

export const useToggleState = (initialState = false): ToggleState => {
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
