import { Box, Text, Link as A } from "@livepeer.com/design-system";
import Breadcrumbs from "../Breadcrumbs";
import Link from "next/link";

const Header = () => {
  return (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        px: "$6",
        height: 60,
        width: "100%",
        borderBottom: "1px solid",
        borderColor: "$slate500",
      }}>
      <Breadcrumbs aria-label="breadcrumb">
        {/* <Link href="/" passHref>
          <A variant="blue">Streams</A>
        </Link>
        <Link href="/" passHref>
          <A variant="blue">Banana</A>
        </Link> */}
        <Text>Home</Text>
      </Breadcrumbs>
    </Box>
  );
};

export default Header;
