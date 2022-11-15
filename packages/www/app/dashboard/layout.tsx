// "use client"; // TODO: review

// import Layout from "../../layouts/dashboard";
// import { useLoggedIn, useApi } from "hooks";
// import { Dashboard as Content } from "content";

// const DashboardLayout = ({ children }) => {
//   useLoggedIn();
//   const { user } = useApi();

//   if (!user) {
//     return <Layout />;
//   }

//   return (
//     <Layout id="home" breadcrumbs={[{ title: "Home" }]} {...Content.metaData}>
//       {children}
//     </Layout>
//   );
// };

// export default DashboardLayout;

export default function Component({ children }) {
  return (
    <div>
      <h1>Dashboard layout</h1>
      <div>{children}</div>
    </div>
  );
}
