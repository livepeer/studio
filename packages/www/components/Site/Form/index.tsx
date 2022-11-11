import React, { useEffect } from "react";
import { Container, Box } from "@theme-ui/components";
import { Box as LiveBox } from "@livepeer/design-system";

interface Error {
  message: string;
  status: "warning" | "error";
}

export default function HubSpot({ title, subtitle, region, portalId, formId }) {
  const [errors, setErrors] = React.useState<Error[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.hsforms.net/forms/v2.js";
    document.body.appendChild(script);

    setLoading(true);

    const e: Error[] = [];

    if (portalId === undefined) {
      e.push({
        message: "The portal ID is missing.",
        status: "error",
      });
    }

    if (formId === undefined) {
      e.push({
        message: "The form ID is missing.",
        status: "error",
      });
    }

    setErrors(e);

    if (e.length == 0) {
      try {
        script.addEventListener("load", () => {
          if ((window as any).hbspt) {
            // This is a workaround for the onFormReady function requiring jQuery
            (window as any).jQuery = () => ({
              // these are all methods required by HubSpot
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              change: () => {},
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              trigger: () => {},
            });

            (window as any).hbspt.forms.create({
              portalId: portalId,
              formId: formId,
              region: region,
              target: "#hsForm",
              onFormReady: function ($form: any) {
                setLoading(false);
              },
            });
          }
        });
      } catch (error) {
        setLoading(false);
      }
    }
  }, []);

  return (
    <Box sx={{ position: "relative", py: "64px" }}>
      <Container sx={{ borderTop: "1px solid #666774" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
          }}>
          <Box sx={{ px: "32px", py: "48px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginBottom: "32px",
              }}>
              <Box
                sx={{
                  width: "16px",
                  height: "16px",
                  background: "white",
                  display: "inline-block",
                  borderRadius: "100%",
                  marginRight: "8px",
                }}
              />
              CONTACT US
            </Box>
            <LiveBox
              css={{
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 1,
                mb: 32,
              }}>
              {title}
            </LiveBox>
            <LiveBox
              css={{
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 1,
                mb: 32,
              }}>
              {subtitle}
            </LiveBox>
          </Box>
          <Box
            sx={{
              borderLeft: "1px solid #666774",
              py: "48px",
            }}>
            {errors.map((error) => {
              return (
                <div key={Math.random() + error.message}>{error.message}</div>
              );
            })}
            {loading && <div>LOADING</div>}
            <div>
              <div id="hsForm"></div>
            </div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
