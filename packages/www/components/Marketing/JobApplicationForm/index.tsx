import {
  TextField,
  Grid,
  Box,
  Container,
  TextArea,
  Button as DesignSystemButton,
} from "@livepeer.com/design-system";
import { useEffect, useState } from "react";
import hash from "@livepeer.com/api/dist/hash";
import { useRouter } from "next/router";
import Button from "@components/Marketing/Button";

const JobApplicationForm = ({
  id,
  questions,
  name,
  resume,
  coverLetter,
  phone,
}) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cover, setCover] = useState("");
  const [email, setEmail] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    if (router?.query?.email) {
      setEmail(router.query.email as string);
    }
  }, [router?.query?.email]);

  const onClick = async () => {
    // onSubmit({
    //   email,
    //   firstName,
    //   lastName,
    //   phone,
    // });
  };

  console.log(phone);

  return (
    <Box
      css={{
        position: "relative",
        width: "100%",
      }}>
      <Box
        as="div"
        css={{
          textAlign: "center",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: "$3",
          ml: "auto",
          mr: "auto",
          maxWidth: 500,
        }}
        id={id}>
        {questions &&
          questions.map((q, index) => (
            <Box key={index} css={{ width: "100%", m: "$0" }}>
              <Box css={{ mb: "$1" }}>{q.title}</Box>
              <TextField
                size="3"
                id={`question-${index}`}
                css={{
                  width: "100%",
                  mb: "$3",
                  mx: "$0",
                }}
                name={`question-${index}`}
                type="text"
                placeholder="Type an answer"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Box>
          ))}
        {name !== "off" && (
          <Grid
            gap={3}
            css={{
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              alignItems: "center",
            }}>
            <TextField
              size="3"
              id="firstName"
              css={{ width: "100%", mb: "$3" }}
              name="firstName"
              type="text"
              placeholder="First name"
              required={name === "required"}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              size="3"
              id="lastName"
              css={{ width: "100%", mb: "$3" }}
              name="lastName"
              type="text"
              placeholder="Last name"
              required={name === "required"}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Grid>
        )}
        {phone !== "off" && (
          <TextField
            size="3"
            id="phone"
            css={{
              width: "100%",
              mb: "$3",
              mx: "$2",
              "@bp1": {
                mx: "$4",
              },
            }}
            name="phone"
            type="phone"
            placeholder="Phone (optional)"
            required={phone === "required"}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        )}

        <TextField
          size="3"
          id="email"
          css={{
            width: "100%",
            mb: "$3",
            mx: "$2",
            "@bp1": {
              mx: "$4",
            },
          }}
          name="email"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {resume !== "off" && (
          <DesignSystemButton
            css={{
              width: "100%",
              cursor: "pointer",
              p: "$1",
              mb: "$3",
              height: "auto",
            }}>
            <Box
              as="div"
              css={{
                width: "100%",
                height: "100%",
                border: "1px dotted $colors$mauve7",
                borderRadius: "$1",
              }}>
              Upload your CV file
            </Box>
          </DesignSystemButton>
        )}
        {coverLetter !== "off" && (
          <TextArea
            size="3"
            id="cover"
            css={{ width: "100%", boxSizing: "border-box", mb: "$3" }}
            name="cover"
            placeholder="Cover Letter"
            value={cover}
            required={coverLetter === "required"}
          />
        )}

        {/* <Box>{errors.join(", ")}&nbsp;</Box> */}
        <Button css={{ mt: "$2", px: "$5" }} onClick={onClick}>
          Submit Application
        </Button>
      </Box>
    </Box>
  );
};

export default JobApplicationForm;
