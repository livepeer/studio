import { Link as A, Box, Flex, styled, Text } from "@livepeer/design-system";
import { useApi, useHubspotForm } from "hooks";
import { events, useJune } from "hooks/use-june";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CheckedIcon from "../../public/img/icons/checked.svg";
import DocumentationIcon from "../../public/img/icons/documentation.svg";
import HornIcon from "../../public/img/icons/horn.svg";
import PolygonIcon from "../../public/img/icons/polygonWithoutBorderBottom.svg";
import Breadcrumbs from "../Breadcrumbs";

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
  const June = useJune();

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

  const trackEvent = useCallback(() => {
    if (June) June.track(events.all.documentation);
  }, [June]);

  const trackFeedbackEvent = useCallback(() => {
    if (June) June.track(events.all.feedback);
  }, [June]);

  return (
    <Box
      id="header"
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
      </Flex>
    </Box>
  );
};

export default Header;
