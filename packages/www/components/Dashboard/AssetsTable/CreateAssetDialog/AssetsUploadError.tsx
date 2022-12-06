import { FileRejection } from "react-dropzone";
import { Text } from "@livepeer/design-system";

const AssetsUploadError = ({
  fileRejections,
}: {
  fileRejections: FileRejection[];
}) => {
  if (!fileRejections || fileRejections.length === 0) {
    return <></>;
  }
  if (fileRejections[0].errors[0].code === "too-many-files") {
    return (
      <Text variant="red" css={{ mt: "$3", textAlign: "center" }}>
        Error: Too many files selected.
      </Text>
    );
  }
  return (
    <ul>
      {fileRejections.map(({ file, errors }) =>
        errors.map((e) => (
          <li key={`${file.name}-${e.code}`}>
            {file.name}: {e.message}
          </li>
        ))
      )}
    </ul>
  );
};

export default AssetsUploadError;
