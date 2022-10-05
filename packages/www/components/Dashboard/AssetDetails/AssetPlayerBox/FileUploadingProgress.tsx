import { Flex, Text } from "@livepeer/design-system";
import { useEffect, useState } from "react";
import Spinner from "components/Dashboard/Spinner";
import useApi from "hooks/use-api";
import { fileUploadProgressForAsset } from "@components/Dashboard/AssetsTable/helpers";
import { Asset } from "@livepeer.studio/api";

const FileUploadingProgress = ({ asset }: { asset?: Asset }) => {
  const { getFilteredFileUploads } = useApi();
  const [fileUploadProgress, setFileUploadProgress] = useState<
    number | undefined
  >();
  const percentage = Math.floor(fileUploadProgress * 100);

  useEffect(() => {
    const fileUploads = getFilteredFileUploads();
    const newProgress = fileUploadProgressForAsset(asset, fileUploads);
    if (JSON.stringify(newProgress) !== JSON.stringify(fileUploadProgress)) {
      setFileUploadProgress(newProgress);
    }
  });

  return (
    <Flex
      direction="column"
      gap={1}
      align="center"
      justify="center"
      css={{
        width: "100%",
        height: 265,
        borderRadius: "$2",
        overflow: "hidden",
        bc: "#28282c",
      }}>
      <Spinner
        css={{
          color: "$loContrast",
          width: "$9",
          height: "$9",
        }}
      />
      <Text size="2" css={{ color: "$loContrast" }}>
        Uploading {percentage}%
      </Text>
    </Flex>
  );
};

export default FileUploadingProgress;
