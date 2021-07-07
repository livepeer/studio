/** @jsx jsx */
import { jsx } from "theme-ui";
import { Text, Box } from "@theme-ui/components";
import { SxStyleProp } from "theme-ui";

export type IconListItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  pushSx?: SxStyleProp;
};

const IconListItem = ({
  icon,
  title,
  description,
  pushSx,
}: IconListItemProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      flexDirection: ["column", "row"],
      ...pushSx,
    }}>
    <Box
      as="i"
      sx={{
        fontSize: [20, 22],
        height: 30,
        minHeight: 30,
        width: 30,
        minWidth: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "primary",
        mr: 3,
      }}>
      {icon}
    </Box>
    <Box>
      <Text sx={{ fontSize: [18, 20], fontWeight: "bold", mb: 2 }}>
        {title}
      </Text>
      <Text sx={{ fontSize: [16, 18], color: "gray" }}>{description}</Text>
    </Box>
  </Box>
);

export default IconListItem;
