import {
  Flex,
  Box,
  Text,
  Link as A,
  styled,
} from "@livepeer.com/design-system";
import Breadcrumbs from "../Breadcrumbs";
import Link from "next/link";
import HornIcon from "../../../public/img/icons/horn.svg";
import QuestionIcon from "../../../public/img/icons/question.svg";

const StyledHornIcon = styled(HornIcon, {
  color: "$hiContrast",
  mr: "$2",
});

const StyledQuestionMarkIcon = styled(QuestionIcon, {
  color: "$hiContrast",
  cursor: "pointer",
  mr: "$1",
});

const Header = () => {
  return (
    <Flex
      align="center"
      justify="between"
      css={{
        px: "$6",
        height: 60,
        width: "100%",
        borderBottom: "1px solid",
        borderColor: "$slate500",
      }}>
      <Breadcrumbs aria-label="breadcrumb">
        {/* <Link href="/" passHref>
          <A variant="indigo">Streams</A>
        </Link>
        <Link href="/" passHref>
          <A variant="indigo">Banana</A>
        </Link> */}
        <Text>Home</Text>
      </Breadcrumbs>
      <Flex align="center" css={{ fontSize: "$3" }}>
        <Flex align="center" css={{ cursor: "pointer", mr: "$4" }}>
          <StyledHornIcon />
          <Box css={{ color: "$hiContrast" }}>Feedback</Box>
        </Flex>
        <StyledQuestionMarkIcon />
      </Flex>
    </Flex>
  );
};

export default Header;
