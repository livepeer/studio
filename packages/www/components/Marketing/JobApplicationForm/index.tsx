import Fade from "react-reveal/Fade";
import {
  TextField,
  Grid,
  Box,
  Text,
  TextArea,
} from "@livepeer.com/design-system";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Button from "@components/Marketing/Button";
import { useDropzone } from "react-dropzone";

const activeStyle = {
  borderColor: "white",
};

const acceptStyle = {
  borderColor: "#5842c3",
};

const rejectStyle = {
  borderColor: "red",
};

type ResumeFileData = {
  name: string;
  url: string;
};

type AnswerData = {
  title: string;
  questionId: string;
  questionType: string;
  value: string | string[];
};

const JobApplicationForm = ({
  id,
  questions,
  name,
  resume,
  coverLetter,
  phone,
}) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [cover, setCover] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<ResumeFileData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const initSetAnswers = () => {
    const data = questions.map((q) => ({
      questionId: q.id,
      title: q.title,
      questionType: q.questionType.toLowerCase(),
      value: "",
    }));
    setAnswers(data);
  };

  useEffect(() => {
    if (router?.query?.email) {
      setEmail(router.query.email as string);
    }
  }, [router?.query?.email]);

  useEffect(() => {
    initSetAnswers();
  }, [questions]);

  const reSet = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setCover("");
    setEmail("");
    setResumeFile(null);
    setError(null);
    initSetAnswers();
  };

  const onClick = async () => {
    if (resumeFile) {
      setLoading(true);
      try {
        const candidate = await fetch(
          `https://livepeer.org/api/teamtailor/candidates`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              "first-name": firstName,
              "last-name": lastName,
              email: email,
              phone: phoneNumber,
              resume: resumeFile.url,
            }),
          }
        ).then((response) => response.json());

        for (const answer of answers) {
          await fetch(`https://livepeer.org/api/teamtailor/answers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...answer,
              candidateId: candidate.data.id,
            }),
          }).then((response) => response.json());
        }

        await fetch(`https://livepeer.org/api/teamtailor/job-applications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            candidateId: candidate.data.id,
            jobId: id,
            "cover-letter": cover,
          }),
        }).then((response) => response.json());

        setSubmitted(true);
        reSet();
        let timer = setTimeout(() => {
          setSubmitted(false);
        }, 4500);
        return () => {
          clearTimeout(timer);
        };
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please upload your CV");
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!!acceptedFiles[0]) {
      setLoadingPdf(true);
      setError(null);
      let form = new FormData();
      form.append("file", acceptedFiles[0]);
      form.append("file_name", acceptedFiles[0].name);
      await fetch("https://livepeer.org/api/upload", {
        method: "POST",
        body: form,
      })
        .then((response) => response.json())
        .then((res) => {
          setResumeFile({
            name: res.originalFilename,
            url: res.url,
          });
        })
        .catch((error) => {
          setError("Your CV upload failed! Please try it again.");
        });

      setLoadingPdf(false);
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: "application/pdf",
    maxFiles: 1,
    onDrop,
  });

  const onChangeAnswer = (questionId, value) => {
    const updatedA = answers.map((answer) => {
      if (answer.questionId === questionId) {
        return {
          ...answer,
          value,
        };
      }
      return answer;
    });
    setAnswers(updatedA);
  };

  const style = useMemo(
    () => ({
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  return (
    <Box>
      <Box
        css={{
          px: "$6",
          py: "$5",
          borderRadius: 24,
          border: "1px solid",
          borderColor: "$mauve5",
          bc: "$mauve2",
          transition: "box-shadow .2s",
          "&:hover": {
            textDecoration: "none",
            boxShadow:
              "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
          },
          "@bp2": {
            width: 380,
          },
        }}>
        <Text
          size="5"
          css={{ mb: "$2", textAlign: "center", fontWeight: "bold" }}>
          Apply for this job
        </Text>
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
            {answers &&
              answers.map((a, index) => (
                <Box key={index} css={{ width: "100%", m: "$0" }}>
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
                    placeholder={a.title}
                    required
                    value={a.value}
                    onChange={(e) =>
                      onChangeAnswer(a.questionId, e.target.value)
                    }
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
              <Box
                css={{
                  mb: "$3",
                  width: "100%",
                }}>
                <Box
                  css={{
                    width: "100%",
                    cursor: "pointer",
                    p: "$1",
                    mb: "$0",
                    height: "auto",
                    border: "1px solid $colors$mauve7",
                    borderRadius: "$1",
                  }}
                  {...getRootProps({ style })}>
                  <Box as="input" {...getInputProps()} />
                  <Box
                    as="p"
                    css={{
                      width: "100%",
                      height: "100%",
                      border: "1px dotted $colors$mauve7",
                      borderRadius: "$1",
                      m: 0,
                      fontSize: "$3",
                      p: "$3",
                      transition: "border .24s ease-in-out",
                      minWidth: "296px",
                      minHeight: "70px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    {loadingPdf
                      ? "Uploading..."
                      : "Drag and Drop your CV file or upload files here"}
                  </Box>
                </Box>
                {resumeFile && (
                  <Box
                    as="li"
                    css={{ width: "100%", textAlign: "left", fontSize: "$2" }}>
                    {resumeFile.name}
                  </Box>
                )}
              </Box>
            )}

            {coverLetter !== "off" && (
              <TextArea
                size="3"
                id="cover"
                css={{ width: "100%", boxSizing: "border-box", mb: "$3" }}
                name="cover"
                placeholder="Cover Letter"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                required={coverLetter === "required"}
              />
            )}

            <Box>{error}</Box>
            <Button
              css={{ mt: "$2", px: "$5" }}
              onClick={onClick}
              disabled={loading}>
              Submit Application
            </Button>
          </Box>
        </Box>
      </Box>
      <Box>
        <Fade in={submitted}>
          <Text variant="gray" css={{ mt: "$3" }}>
            Thanks for reaching out! We'll get back to you shortly.
          </Text>
        </Fade>
      </Box>
    </Box>
  );
};

export default JobApplicationForm;
