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

const Header = ({ breadcrumbs = [] }) => {
  return (
    <Flex
      align="center"
      justify="between"
      css={{
        px: "$6",
        height: 60,
        width: "100%",
        borderBottom: "1px solid",
        borderColor: "$mauve6",
      }}>
      <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbs.map((breadcrumb, i) => {
          if (breadcrumb?.href) {
            return (
              <Link key={i} href={breadcrumb.href} passHref>
                <A variant="violet">{breadcrumb.title}</A>
              </Link>
            );
          }
          return <Text key={i}>{breadcrumb.title}</Text>;
        })}
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
