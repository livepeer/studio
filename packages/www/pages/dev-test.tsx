import { getClient } from "lib/sanity.server";
import { groq } from "next-sanity";

export default function TestPage({ props }) {
  console.log("props: ", props);
  return (
    <>
      <div>
        <h1>asd</h1>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const client = getClient();
  const queryForPaths = groq`*[_type=='page' && defined(slug.current)][].slug.current`;
  const data: string[] = (await client.fetch(queryForPaths)) ?? [];
  const paths = data
    .filter((path) => path !== "jobs" && path !== "team")
    .map((path) => ({ params: { slug: path } }));
  console.log("data: ", data, paths);

  return {
    props: {
      // data,
    }, // will be passed to the page component as props
  };
}
