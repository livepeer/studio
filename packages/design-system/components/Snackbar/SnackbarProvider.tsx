import React, { createContext, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { Box } from "@modulz/design-system";
import transitionStyles from "./transitionStyles";

// Snackbar default values
export const defaultPosition = "bottom-center";
export const defaultDuration = 5000;
export const defaultInterval = 250;
export const positions = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

interface IContextProps {
  openSnackbar: any;
  closeSnackbar: any;
}

// Context used by the hook useSnackbar() and HoC withSnackbar()
export const SnackbarContext = createContext({} as IContextProps);

type Props = {
  children: JSX.Element;
};

export const SnackbarProvider = ({ children }: Props) => {
  // Current open state
  const [open, setOpen] = useState(false);
  // Current timeout ID
  const [timeoutId, setTimeoutId] = useState(null);
  // Snackbar's text
  const [text, setText] = useState("");
  // Snackbar's duration
  const [duration, setDuration] = useState(defaultDuration);
  // Snackbar's position
  const [position, setPosition] = useState(defaultPosition);
  // Custom styles for the snackbar itself
  const [customStyles, setCustomStyles] = useState({});
  // Custom styles for the close button
  const [closeCustomStyles, setCloseCustomStyles] = useState({});

  const triggerSnackbar = (
    text: string,
    duration: number,
    position: string,
    style: object,
    closeStyle: object
  ) => {
    setText(text);
    setDuration(duration);
    setPosition(position);
    setCustomStyles(style);
    setCloseCustomStyles(closeStyle);
    setOpen(true);
  };

  // Manages all the snackbar's opening process
  const openSnackbar = (
    text: string,
    duration: number,
    position: string,
    style: object,
    closeStyle: object
  ) => {
    // Closes the snackbar if it is already open
    if (open === true) {
      setOpen(false);
      setTimeout(() => {
        triggerSnackbar(text, duration, position, style, closeStyle);
      }, defaultInterval);
    } else {
      triggerSnackbar(text, duration, position, style, closeStyle);
    }
  };

  // Closes the snackbar just by setting the "open" state to false
  const closeSnackbar = () => {
    setOpen(false);
  };

  // Returns the Provider that must wrap the application
  return (
    <SnackbarContext.Provider value={{ openSnackbar, closeSnackbar }}>
      {children}

      {/* Renders Snackbar on the end of the page */}
      <Box css={transitionStyles}>
        <CSSTransition
          in={open}
          timeout={150}
          mountOnEnter
          unmountOnExit
          // Sets timeout to close the snackbar
          onEnter={() => {
            // @ts-ignore
            clearTimeout(timeoutId);
            // @ts-ignore
            setTimeoutId(setTimeout(() => setOpen(false), duration));
          }}
          // Sets custom classNames based on "position"
          className={`snackbar-wrapper-${position}`}
          classNames={{
            enter: `snackbar-enter snackbar-enter-${position}`,
            enterActive: `snackbar-enter-active snackbar-enter-active-${position}`,
            exitActive: `snackbar-exit-active snackbar-exit-active-${position}`,
          }}>
          {/* This div will be rendered with CSSTransition classNames */}
          <Box
            css={{
              display: "flex",
              alignItems: "center",
              margin: "8px",
              position: "fixed",
              right: "0",
              left: "0",
              zIndex: "1",
              transition: "opacity 150ms, transform 150ms",
              pointerEvents: "none",
              justifyContent: "center",
              bottom: "8px",
            }}>
            <Box
              css={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                borderRadius: "4px",
                minWidth: "334px",
                maxWidth: "672px",
                backgroundColor: "$panel",
                boxShadow: `0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12)`,
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                fontFamily: "sans-serif",
                fontSize: "14px",
                fontWeight: "400",
                color: "$hiContrast",
                letterSpacing: "0.25px",
                lineHeight: "20px",
                textAlign: "left",
              }}
              style={customStyles}>
              {/* Snackbar's text */}
              <Box
                css={{
                  flexGrow: 1,
                  padding: "14px 16px",
                  margin: "0",
                  pointerEvents: "auto",
                  color: "$hiContrast",
                }}>
                {text}
              </Box>

              {/* Snackbar's close button */}
              <Box
                as="button"
                css={{
                  lexShrink: "0",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  padding: "8px",
                  margin: "0 8px 0 0",
                  cursor: "pointer",
                  position: "relative",
                  pointerEvents: "auto",
                  WebkitTapHighlightColor: "transparent",

                  /* Reset button styles */
                  outline: "none",
                  backgroundColor: "transparent",
                  border: "none",

                  /* SVG icon properties */
                  fontSize: "12px",
                  color: "$hiContrast",
                  "&:hover:before": {
                    opacity: "0.08",
                  },
                  "&:before": {
                    content: '""',
                    backgroundColor: "$hiContrast",
                    borderRadius: "50%",
                    opacity: "0",
                    position: "absolute",
                    transition: "opacity 120ms linear",
                    top: "0%",
                    left: "0%",
                    width: "100%",
                    height: "100%",
                  },
                }}
                onClick={closeSnackbar}
                style={closeCustomStyles}>
                <CloseIcon />
              </Box>
            </Box>
          </Box>
        </CSSTransition>
      </Box>
    </SnackbarContext.Provider>
  );
};

// CloseIcon SVG is styled with font properties
const CloseIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 12 12">
    <path
      fill="currentColor"
      d="M11.73 1.58L7.31 6l4.42 4.42-1.06 1.06-4.42-4.42-4.42 4.42-1.06-1.06L5.19 6 .77 1.58 1.83.52l4.42 4.42L10.67.52z"
      fillRule="evenodd"
    />
  </svg>
);
