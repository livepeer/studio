import { useSnackbar } from "../components/Snackbar";
import { Button } from "../";

export default function Snackbar() {
  const [openSnackbar] = useSnackbar();

  return (
    <Button onClick={() => openSnackbar("hi I am a snackbar")}>
      Click me to open the Snackbar!
    </Button>
  );
}
