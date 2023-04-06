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
  TextArea,
} from "@livepeer/design-system";
import Breadcrumbs from "../Breadcrumbs";
import Link from "next/link";
import HornIcon from "../../../public/img/icons/horn.svg";
import QuestionIcon from "../../../public/img/icons/question.svg";
import SupportIcon from "../../../public/img/icons/support.svg";
import DocumentationIcon from "../../../public/img/icons/documentation.svg";
import PolygonIcon from "../../../public/img/icons/polygonWithoutBorderBottom.svg";
import CheckedIcon from "../../../public/img/icons/checked.svg";
import { useEffect, useState, useRef } from "react";
import { useApi, useHubspotForm } from "hooks";

const StyledHornIcon = styled(HornIcon, {
  color: "$hiContrast",
});

const StyledPolygonIcon = styled(PolygonIcon, {
  color: "$panel",
});

const StyledCheckedIcon = styled(CheckedIcon, {
  color: "$green9",
});

const StyledDocumentationIcon = styled(DocumentationIcon, {
  color: "$hiContrast",
});

const StyledSupportIcon = styled(SupportIcon, {
  color: "$hiContrast",
});

const StyledQuestionMarkIcon = styled(QuestionIcon, {
  color: "$hiContrast",
});

const reactions: string[] = ["🤩", "😀", "😕", "😭"];

const Header = ({ breadcrumbs = [] }) => {
  const formEl = useRef(null);
  const { user } = useApi();
  const [form, setForm] = useState({
    email: user?.email,
    reaction: "",
    feedback: "",
  });
  const [formSent, setFormSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { data, handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_FEEDBACK_FORM_ID,
  });

  useEffect(() => {
    if (data) {
      setFormSent(true);
      formEl.current.reset();
    }
  }, [data]);

  useEffect(() => {
    if (user) {
      setForm({ ...form, email: user.email });
    }
  }, [user]);

  return (
    <Box
      css={{
        width: "100%",
        borderBottom: "1px solid",
        borderColor: "$neutral6",
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
                <Link key={i} href={breadcrumb.href} passHref legacyBehavior>
                  <A css={{ textDecoration: "none" }}>{breadcrumb.title}</A>
                </Link>
              );
            }
            return <Text key={i}>{breadcrumb.title}</Text>;
          })}
        </Breadcrumbs>
        <Flex align="center" css={{ fontSize: "$3" }}>
          <Flex
            align="center"
            css={{
              background: "transparent",
              appearance: "none",
              border: "none",
            }}>
            <Link href="https://docs.livepeer.studio" passHref legacyBehavior>
              <Button
                ghost
                as={A}
                target="_blank"
                size={2}
                css={{
                  cursor: "default",
                  color: "$hiContrast",
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "flex",
                  gap: "$2",
                  "&:hover": {
                    textDecoration: "none",
                  },
                }}>
                <StyledDocumentationIcon />
                <Box>Documentation</Box>
              </Button>
            </Link>
          </Flex>
          <DropdownMenu>
            <Button
              ghost
              as={DropdownMenuTrigger}
              size={2}
              css={{
                mr: "$2",
                display: "flex",
                gap: "$2",
                color: "$hiContrast",
                textDecoration: "none",
                fontWeight: 500,
                "&:hover": {
                  textDecoration: "none",
                },
              }}>
              <StyledHornIcon />
              <Box>Feedback</Box>
            </Button>
            <DropdownMenuContent
              css={{
                padding: "18px 0 12px",
                position: "relative",
                width: "313px",
                minHeight: "180px",
                mt: "$4",
                boxShadow:
                  "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                background: "$panel",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}>
              <Box css={{ position: "absolute", right: "12px", top: "-12px" }}>
                <StyledPolygonIcon />
              </Box>
              {!formSent ? (
                <>
                  <Text
                    size="2"
                    css={{
                      mb: "$3",
                      display: "flex",
                      ai: "center",
                      jc: "space-between",
                    }}>
                    Feedback
                    {errorMessage && (
                      <Text variant="red" size="2">
                        {errorMessage}
                      </Text>
                    )}
                  </Text>
                  <Box ref={formEl} as="form" onSubmit={handleSubmit}>
                    <TextArea
                      size="2"
                      required
                      name="feedback"
                      id="feedback"
                      placeholder="Your feedback"
                      css={{ px: "$2", width: "100%", boxSizing: "border-box" }}
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
                            onClick={() => {
                              setErrorMessage("");
                              setForm((prev) => ({
                                ...prev,
                                reaction: reaction,
                              }));
                            }}
                            css={{
                              cursor: "default",
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              border:
                                reaction === form.reaction
                                  ? "1px solid $primary9"
                                  : "1px solid $primary7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              marginRight: "$1",
                              "&:hover": {
                                borderColor: "$primary9",
                              },
                              ":last-of-type": {
                                marginRight: "0px",
                              },
                            }}>
                            {reaction}
                          </Box>
                        ))}
                        <input
                          name="emoji"
                          id="emoji"
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
                        <input name="email" type="hidden" value={form.email} />
                      </Flex>
                      <Button disabled={formSent} type="submit">
                        Send
                      </Button>
                    </Flex>
                  </Box>
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
                p: 0,
              }}>
              <StyledQuestionMarkIcon />
            </Box>
            <DropdownMenuContent
              css={{
                mr: "$6",
                pt: "$4",
                pb: "$3",
                px: "$3",
                position: "relative",
                mt: "$4",
                boxShadow:
                  "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                background: "$panel",
                right: "-13px",
              }}>
              <Box css={{ position: "absolute", right: "6px", top: "-12px" }}>
                <StyledPolygonIcon />
              </Box>
              <Text
                size="2"
                css={{
                  ml: "$2",
                  fontWeight: 600,
                  mb: "$3",
                  color: "$hiContrast",
                }}>
                HELP
              </Text>
              <Box>
                <Link
                  href="https://docs.livepeer.studio"
                  passHref
                  legacyBehavior>
                  <Button
                    as={A}
                    ghost
                    size={1}
                    target="_blank"
                    css={{
                      cursor: "default",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "$2",
                      mb: "$2",
                      "&:hover": {
                        textDecoration: "none",
                      },
                    }}>
                    <StyledDocumentationIcon />
                    <Text>Documentation</Text>
                  </Button>
                </Link>
                <Link href="/contact" passHref legacyBehavior>
                  <Button
                    as={A}
                    ghost
                    size={1}
                    target="_blank"
                    css={{
                      cursor: "default",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "$2",
                      "&:hover": {
                        textDecoration: "none",
                      },
                    }}>
                    <StyledSupportIcon />
                    <Text>Contact</Text>
                  </Button>
                </Link>
              </Box>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
