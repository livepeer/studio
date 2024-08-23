import Link from "next/link";
import { Tooltip } from "react-tooltip";
import {
  Spinner,
  Box,
  Button,
  Flex,
  Heading,
  Container,
  Link as A,
  Label,
  Radio,
  Alert,
  Close,
  Input,
} from "@theme-ui/components";
import Layout from "../../../../layouts/admin";
import useLoggedIn from "../../../../hooks/use-logged-in";
import { User } from "@livepeer.studio/api";
import { useRouter } from "next/router";
import Router from "next/router";
import { useApi } from "../../../../hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import TabbedLayout from "components/Admin/TabbedLayout";
import ConfirmationModal from "components/Admin/ConfirmationModal";
import Modal from "components/Admin/Modal";
import Help from "../../../public/img/help.svg";
import { getTabs as getTabsAdmin } from "..";
import SuspendUserModal from "components/Admin/SuspendUserModal";
import moment from "moment";

const ID = () => {
  useLoggedIn();
  const {
    user,
    logout,
    getUser,
    setUserSuspended,
    setUserDisabled,
    patchUser,
    makeUserEnterprise,
  } = useApi();
  const userIsAdmin = user && user.admin;
  const router = useRouter();
  const { query } = router;
  const id = useMemo(() => query.id?.toString() ?? "", [query.id]);
  const [userInfo, setUserInfo] = useState<User>(null);
  const [suspendModal, setSuspendModal] = useState(false);
  const [unsuspendModal, setUnsuspendModal] = useState(false);
  const [disableModal, setDisableModal] = useState(false);
  const [enableModal, setEnableModal] = useState(false);
  const [updateViewerLimitModal, setUpdateViewerLimitModal] = useState(false);
  const [newViewerLimit, setNewViewerLimit] = useState(
    userInfo?.viewerLimit || 50000
  );
  const [notFound, setNotFound] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    try {
      const [res, info] = await getUser(id);
      if (res.status === 404) {
        return setNotFound(true);
      } else if ("errors" in info) {
        throw new Error(info.errors.toString());
      }
      setUserInfo(info as User);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const close = () => {
    setSuspendModal(false);
    setUnsuspendModal(false);
    setDisableModal(false);
    setEnableModal(false);
    setUpdateViewerLimitModal(false);
  };

  const handleUpdateViewerLimit = async () => {
    try {
      await patchUser(userInfo.id, { viewerLimit: newViewerLimit });
      fetchUser();
      close();
    } catch (err) {
      console.error(err);
    }
  };

  const [confirmEnterpriseModal, setConfirmEnterpriseModal] = useState(false);

  const handleMigrateToEnterprise = async () => {
    try {
      await makeUserEnterprise(userInfo.id);
      fetchUser();
    } catch (err) {
      console.error(err);
    }
    close();
  };

  const openConfirmEnterpriseModal = () => {
    setConfirmEnterpriseModal(true);
  };

  const closeConfirmEnterpriseModal = () => {
    setConfirmEnterpriseModal(false);
  };

  if (!user) {
    return <Layout />;
  }

  const isAdmin = query.admin === "true";
  const tabs = getTabsAdmin(0);
  const backLink = "/app/admin";

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <Container sx={{ maxWidth: "80%" }}>
        <Link href={backLink} passHref legacyBehavior>
          <A
            sx={{
              mt: 4,
              fontWeight: 500,
              mb: 3,
              color: "text",
              display: "block",
            }}>
            {"← user list"}
          </A>
        </Link>
        {userInfo ? (
          <>
            <Flex
              sx={{
                justifyContent: "flex-start",
                alignItems: "baseline",
                flexDirection: "column",
              }}>
              <Heading as="h3" sx={{ mb: "0.5em" }}>
                {userInfo.email}
              </Heading>
              <Flex
                sx={{
                  justifyContent: "flex-end",
                  mb: 3,
                }}>
                <Box
                  sx={{
                    display: "grid",
                    alignItems: "center",
                    gridTemplateColumns: "12em auto",
                    width: "100%",
                    fontSize: 0,
                    position: "relative",
                  }}>
                  <Box sx={{ m: "0.4em" }}>User ID</Box>
                  <Box sx={{ m: "0.4em" }}>{userInfo.id}</Box>
                  <Box sx={{ m: "0.4em" }}>First Name</Box>
                  <Box sx={{ m: "0.4em" }}>{userInfo.firstName}</Box>
                  <Box sx={{ m: "0.4em" }}>Last Name</Box>
                  <Box sx={{ m: "0.4em" }}>{userInfo.lastName}</Box>
                  <Box sx={{ m: "0.4em" }}>Email</Box>
                  <Box sx={{ m: "0.4em" }}>{userInfo.email}</Box>
                  <Box sx={{ m: "0.4em" }}>Is email valid</Box>
                  <Box sx={{ m: "0.4em" }}>
                    {userInfo.emailValid ? "Yes" : "No"}
                  </Box>
                  <Box sx={{ m: "0.4em" }}>Admin</Box>
                  <Box sx={{ m: "0.4em" }}>{userInfo.admin ? "Yes" : "No"}</Box>
                  <Box sx={{ m: "0.4em" }}>Suspended</Box>
                  <Box
                    sx={{
                      m: "0.4em",
                      color: userInfo.suspended ? "red" : "inherit",
                      fontWeight: userInfo.suspended ? "bold" : "normal",
                    }}>
                    {userInfo.suspended ? "Yes" : "No"}
                  </Box>
                  <Box sx={{ m: "0.4em" }}>Disabled</Box>
                  <Box
                    sx={{
                      m: "0.4em",
                      color: userInfo.disabled ? "red" : "inherit",
                      fontWeight: userInfo.disabled ? "bold" : "normal",
                    }}>
                    {userInfo.disabled ? "Yes" : "No"}
                  </Box>
                  <Box sx={{ m: "0.4em" }}>Viewer limit</Box>
                  <Box sx={{ m: "0.4em" }}>
                    {userInfo.viewerLimit ? userInfo.viewerLimit : 50000}
                  </Box>
                  <Box sx={{ m: "0.4em" }}>Product</Box>
                  <Box sx={{ m: "0.4em" }}>{userInfo.stripeProductId}</Box>
                  <Box sx={{ m: "0.4em" }}>Stripe customer</Box>
                  <Box sx={{ m: "0.4em" }}>
                    <A
                      href={`https://dashboard.stripe.com/customers/${userInfo.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "text" }}>
                      {userInfo.stripeCustomerId}
                    </A>
                  </Box>
                  <Box sx={{ m: "0.4em" }}>Created at</Box>
                  <Box sx={{ m: "0.4em" }}>
                    {moment(userInfo.createdAt).fromNow()}
                  </Box>
                  <Box sx={{ m: "0.4em" }}>Last Seen</Box>
                  <Box sx={{ m: "0.4em" }}>
                    {moment(userInfo.lastSeen).fromNow()}
                  </Box>
                </Box>
              </Flex>
              <Flex
                sx={{
                  justifyContent: "flex-end",
                  mb: 3,
                }}>
                {userIsAdmin ? (
                  <>
                    {userInfo.suspended ? (
                      <Button
                        type="button"
                        variant="outlineSmall"
                        onClick={() => setUnsuspendModal(true)}>
                        Unsuspend
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outlineSmall"
                        onClick={() => setSuspendModal(true)}>
                        Suspend
                      </Button>
                    )}
                    {userInfo.disabled ? (
                      <Button
                        type="button"
                        variant="outlineSmall"
                        onClick={() => setEnableModal(true)}
                        sx={{ ml: 2 }}>
                        Enable
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outlineSmall"
                        onClick={() => setDisableModal(true)}
                        sx={{ ml: 2 }}>
                        Disable
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outlineSmall"
                      onClick={() => setUpdateViewerLimitModal(true)}
                      sx={{ ml: 2 }}>
                      Update Viewer Limit
                    </Button>
                    <Button
                      type="button"
                      variant="outlineSmall"
                      onClick={openConfirmEnterpriseModal}
                      sx={{ ml: 2 }}>
                      Make Enterprise
                    </Button>
                  </>
                ) : null}
              </Flex>
            </Flex>
            <SuspendUserModal
              user={userInfo}
              isOpen={suspendModal}
              onClose={close}
              onSuspend={fetchUser}
            />
            {confirmEnterpriseModal && (
              <Modal onClose={closeConfirmEnterpriseModal}>
                <h3>Confirm Enterprise Migration</h3>
                <p>
                  Are you sure you want to apply the enterprise plan to user "
                  {userInfo.email}"?
                </p>
                <Flex sx={{ justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="outlineSmall"
                    onClick={closeConfirmEnterpriseModal}
                    sx={{ mr: 2 }}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primarySmall"
                    onClick={handleMigrateToEnterprise}>
                    Confirm
                  </Button>
                </Flex>
              </Modal>
            )}
            {unsuspendModal && (
              <Modal onClose={close}>
                <h3>Unsuspend user</h3>
                <p>
                  Are you sure you want to <i>unsuspend</i> user "
                  {userInfo.email}"?
                </p>
                <Flex sx={{ justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="outlineSmall"
                    onClick={close}
                    sx={{ mr: 2 }}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primarySmall"
                    onClick={() => {
                      setUserSuspended(userInfo.id, { suspended: false })
                        .then(fetchUser)
                        .finally(close);
                    }}>
                    Unsuspend User
                  </Button>
                </Flex>
              </Modal>
            )}
            {disableModal && (
              <Modal onClose={close}>
                <h3>Disable user</h3>
                <p>
                  Are you sure you want to <i>disable</i> user "{userInfo.email}
                  "?
                </p>
                <Flex sx={{ justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="outlineSmall"
                    onClick={close}
                    sx={{ mr: 2 }}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primarySmall"
                    onClick={() => {
                      setUserDisabled(userInfo.id, { disabled: true })
                        .then(fetchUser)
                        .finally(close);
                    }}>
                    Disable User
                  </Button>
                </Flex>
              </Modal>
            )}
            {enableModal && (
              <Modal onClose={close}>
                <h3>Enable user</h3>
                <p>
                  Are you sure you want to <i>enable</i> user "{userInfo.email}
                  "?
                </p>
                <Flex sx={{ justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="outlineSmall"
                    onClick={close}
                    sx={{ mr: 2 }}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primarySmall"
                    onClick={() => {
                      setUserDisabled(userInfo.id, { disabled: false })
                        .then(fetchUser)
                        .finally(close);
                    }}>
                    Enable User
                  </Button>
                </Flex>
              </Modal>
            )}
            {updateViewerLimitModal && (
              <Modal onClose={close}>
                <h3>Update Viewer Limit</h3>
                <p>Update viewer limit for user "{userInfo.email}".</p>
                <Flex sx={{ flexDirection: "column", mb: 3 }}>
                  <Label htmlFor="viewerLimit">Viewer Limit</Label>
                  <Input
                    id="viewerLimit"
                    name="viewerLimit"
                    type="number"
                    value={newViewerLimit}
                    onChange={(e) => setNewViewerLimit(Number(e.target.value))}
                    sx={{ mb: 3 }}
                  />
                </Flex>
                <Flex sx={{ justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="outlineSmall"
                    onClick={close}
                    sx={{ mr: 2 }}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primarySmall"
                    onClick={handleUpdateViewerLimit}>
                    Update Viewer Limit
                  </Button>
                </Flex>
              </Modal>
            )}
          </>
        ) : notFound ? (
          <Box>Not found</Box>
        ) : (
          <Flex sx={{ justifyContent: "center", alignItems: "center" }}>
            <Spinner sx={{ mr: "1em" }} />
            <Box sx={{ color: "text" }}>Loading</Box>
          </Flex>
        )}
      </Container>
    </TabbedLayout>
  );
};
export default ID;
