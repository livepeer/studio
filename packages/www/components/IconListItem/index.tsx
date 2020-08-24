import { Text } from "@theme-ui/components";
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
  pushSx
}: IconListItemProps) => (
  <div
    sx={{
      display: "flex",
      alignItems: "flex-start",
      flexDirection: ["column", "row"],
      ...pushSx
    }}
  >
    <i
      sx={{
        fontSize: [20, 22],
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "primary",
        mr: 3
      }}
    >
      {icon}
    </i>
    <div>
      <Text sx={{ fontSize: [18, 20], fontWeight: "bold", mb: 2 }}>
        {title}
      </Text>
      <Text sx={{ fontSize: [16, 18], color: "gray" }}>{description}</Text>
    </div>
  </div>
);

export default IconListItem;
