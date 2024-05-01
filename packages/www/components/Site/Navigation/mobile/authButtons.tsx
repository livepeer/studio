import { Link as A } from "@livepeer/design-system";
import Link from "next/link";
import Button from "components/Site/Button";

const AuthButtons = ({
  isTokenDefined,
  isAdminUser,
  setMobileMenuIsOpen,
}: {
  isTokenDefined: boolean;
  isAdminUser: boolean;
  setMobileMenuIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  if (!isTokenDefined) {
    return (
      <Link href="/login" passHref legacyBehavior>
        <Button
          onClick={() => setMobileMenuIsOpen(false)}
          arrow
          css={{ mt: "$7", mr: "$3" }}>
          Get Started
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/" passHref legacyBehavior>
        <Button arrow>Dashboard</Button>
      </Link>
      {isAdminUser && (
        <Link href="/app/admin" passHref legacyBehavior>
          <A css={{ ml: "$3" }}>Admin</A>
        </Link>
      )}
    </>
  );
};

export default AuthButtons;
