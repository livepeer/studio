import Layout from "layouts/main";
import { useRouter } from "next/router";
import { useEffect } from "react";

const HomePage = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, []);
  return <Layout />;
};

HomePage.theme = "light-theme-green";
export default HomePage;
