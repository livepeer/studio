import { useEffect, useState } from "react";
import casualUid from "lib/utils/casual-id";

const useComponentId = (prefix?: string) => {
  const [id, setId] = useState<string>();

  useEffect(() => {
    setId(`${prefix}${casualUid()}`);
  }, [prefix]);

  return id;
};

export default useComponentId;
