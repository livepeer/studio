import { FileRejection } from "react-dropzone";
import { Box, Text } from "@livepeer/design-system";

const TooManyFilesError = () => (
  <Text variant="red" css={{ mt: "$3", textAlign: "center" }}>
    Error: Too many files selected.
  </Text>
);

const GenericErrorListItem = ({
  fileName,
  errorMessage,
}: {
  fileName: string;
  errorMessage: string;
}) => (
  <li style={{ paddingLeft: "0.8em" }}>
    {fileName}: {errorMessage}
  </li>
);

const InvalidTypeErrorListItem = ({ file }: { file: File }) => (
  <GenericErrorListItem
    fileName={file.name}
    errorMessage={"File type not supported."}
  />
);

const AssetsUploadError = ({
  fileRejections,
}: {
  fileRejections: FileRejection[];
}) => {
  if (!fileRejections || fileRejections.length === 0) {
    return <></>;
  }
  if (fileRejections[0].errors[0].code === "too-many-files") {
    return <TooManyFilesError />;
  }
  return (
    <Box css={{ fontSize: "$1", color: "$red11" }}>
      <ul style={{ paddingLeft: "1.8em", marginBottom: "0.65em" }}>
        {fileRejections.map(({ file, errors }) =>
          errors.map((e) => {
            const key = `${file.name}-${e.code}`;
            if (e.code === "file-invalid-type") {
              return <InvalidTypeErrorListItem key={key} file={file} />;
            }
            return (
              <GenericErrorListItem
                key={key}
                fileName={file.name}
                errorMessage={e.message}
              />
            );
          }),
        )}
      </ul>
    </Box>
  );
};

export default AssetsUploadError;
