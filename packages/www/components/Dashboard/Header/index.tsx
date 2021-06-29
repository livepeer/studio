import {
  Flex,
  Box,
  Text,
  Link as A,
  styled,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Button,
} from "@livepeer.com/design-system";
import Breadcrumbs from "../Breadcrumbs";
import Link from "next/link";
import HornIcon from "../../../public/img/icons/horn.svg";
import QuestionIcon from "../../../public/img/icons/question.svg";
import SupportIcon from "../../../public/img/icons/support.svg";
import DocumentationIcon from "../../../public/img/icons/documentation.svg";
import HyperlinkIcon from "../../../public/img/icons/hyperlink.svg";
import PolygonIcon from "../../../public/img/icons/polygonWithoutBorderBottom.svg";
import CheckedIcon from "../../../public/img/icons/checked.svg";
import { TextArea } from "@modulz/design-system";
import { useState } from "react";
import { useForm } from "react-hubspot";
import { useApi } from "hooks";

const StyledHornIcon = styled(HornIcon, {
  color: "$hiContrast",
  mr: "$2",
});

const StyledPolygonIcon = styled(PolygonIcon, {
  color: "$loContrast",
});

const StyledCheckedIcon = styled(CheckedIcon, {
  color: "$violet9",
});

const StyledDocumentationIcon = styled(DocumentationIcon, {
  color: "$hiContrast",
});
const StyledSupportIcon = styled(SupportIcon, {
  color: "$hiContrast",
});
const StyledHyperlinkIcon = styled(HyperlinkIcon, {
  color: "$hiContrast",
});

const StyledQuestionMarkIcon = styled(QuestionIcon, {
  color: "$hiContrast",
  cursor: "pointer",
  mr: "$1",
});

const reactions: string[] = ["🤩", "😀", "😕", "😭"];

const Header = ({ breadcrumbs = [] }) => {
  const { user } = useApi();
  const [form, setForm] = useState({
    email: user?.email,
    reaction: "",
    feedback: "",
  });
  const [formSent, setFormSent] = useState(false);
  const { data, handleSubmit } = useForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_FEEDBACK_FORM_ID,
  });

  return (
    <Box
      css={{
        width: "100%",
        borderBottom: "1px solid",
        borderColor: "$mauve6",
      }}>
      <Flex
        align="center"
        justify="between"
        css={{
          px: "$6",
          height: 60,
          width: "100%",
          margin: "0 auto",
          maxWidth: "1520px",
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
          <DropdownMenu>
            <Flex
              as={DropdownMenuTrigger}
              align="center"
              css={{
                cursor: "pointer",
                mr: "$5",
                background: "transparent",
                appearance: "none",
                WebkitAppearance: "none",
                border: "none",
              }}>
              <StyledHornIcon />
              <Box css={{ color: "$hiContrast" }}>Feedback</Box>
            </Flex>
            <DropdownMenuContent
              css={{
                padding: "18px 20px 12px",
                position: "relative",
                width: "313px",
                minHeight: "180px",
                mt: "$4",
                boxShadow:
                  "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                background: "$loContrast",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}>
              <Box css={{ position: "absolute", right: "12px", top: "-12px" }}>
                <StyledPolygonIcon />
              </Box>
              {!formSent ? (
                <>
                  <Text size="2" css={{ mb: "$3" }}>
                    Feedback
                  </Text>
                  <form>
                    <TextArea
                      size="2"
                      name="feedback"
                      id="feedback"
                      placeholder="Your feedback"
                      css={{ width: "calc(100% - 40px)" }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({ ...prev, feedback: value }));
                      }}
                    />
                    <Flex align="center" justify="between" css={{ mt: "$3" }}>
                      <Flex>
                        {reactions.map((reaction, idx) => (
                          <Box
                            key={idx}
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                reaction: reaction,
                              }))
                            }
                            css={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              border:
                                reaction === form.reaction
                                  ? "1px solid $violet9"
                                  : "1px solid $panel",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              marginRight: "$1",
                              cursor: "pointer",
                              ":last-of-type": {
                                marginRight: "0px",
                              },
                            }}>
                            {reaction}
                          </Box>
                        ))}
                        <input
                          name="emoji-input"
                          id="emoji-input"
                          onChange={(e) => {
                            const value = e.target.value;
                            setForm((prev) => ({ ...prev, reaction: value }));
                          }}
                          value={form.reaction}
                          style={{
                            visibility: "hidden",
                            width: "0px",
                            height: "0px",
                          }}
                        />
                        <input
                          name="email"
                          id="email"
                          onChange={(e) => {
                            const value = e.target.value;
                            setForm((prev) => ({ ...prev, email: value }));
                          }}
                          value={form.email}
                          style={{
                            visibility: "hidden",
                            width: "0px",
                            height: "0px",
                          }}
                        />
                      </Flex>
                      <Button
                        onClick={() => {
                          setFormSent(true);
                          handleSubmit();
                        }}
                        disabled={formSent}
                        type="submit">
                        Send
                      </Button>
                    </Flex>
                  </form>
                </>
              ) : (
                <Flex
                  align="center"
                  justify="center"
                  css={{ flexDirection: "column" }}>
                  <StyledCheckedIcon />
                  <Text css={{ textALign: "center", margin: "$3 0 $2" }}>
                    Your feedback has been received!
                  </Text>
                  <Text> Thank you for your help.</Text>
                </Flex>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <Box
              as={DropdownMenuTrigger}
              css={{
                background: "transparent",
                appearance: "none",
                WebkitAppearance: "none",
                border: "none",
              }}>
              <StyledQuestionMarkIcon />
            </Box>
            <DropdownMenuContent
              css={{
                padding: "18px 54px 18px 18px",
                position: "relative",
                mt: "$4",
                boxShadow:
                  "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                background: "$loContrast",
              }}>
              <Box css={{ position: "absolute", right: "4px", top: "-12px" }}>
                <StyledPolygonIcon />
              </Box>
              <Text size="2" css={{ mb: "$3", color: "$mauve9" }}>
                HELP
              </Text>
              <Flex align="center" css={{ mb: "$3", cursor: "pointer" }}>
                <StyledDocumentationIcon />
                <Text css={{ margin: "0 $2" }}>Documentation</Text>
                <StyledHyperlinkIcon />
              </Flex>
              <Flex align="center" css={{ cursor: "pointer" }}>
                <StyledSupportIcon />
                <Text css={{ margin: "0 $2" }}>Contact Support</Text>
              </Flex>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
