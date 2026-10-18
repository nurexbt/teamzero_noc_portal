import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon, KeyIcon, LockIcon } from "@/icons";
import { usePortalData } from "@/context/PortalDataContext";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
  mandatory?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  mandatory = false,
}) => {
  const { currentUser, changePassword } = usePortalData();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate current password
    if (currentUser.password && currentPassword !== currentUser.password) {
      setError("Current password does not match.");
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setError("New password must be at least 4 characters long.");
      return;
    }

    if (newPassword === "admin") {
      setError("Please choose a secure password different from the default 'admin'.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const res = await changePassword(currentUser.id, newPassword);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onClose) onClose();
      }, 1200);
    } else {
      setError(res.message || "Failed to update password.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={mandatory ? () => {} : onClose || (() => {})}
      showCloseButton={!mandatory}
      className="max-w-md p-6 sm:p-8"
    >
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <KeyIcon className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {mandatory ? "Change Password Required" : "Change Password"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mandatory
                ? "First login detected. Update your default password to continue."
                : `Update password for @${currentUser.username}`}
            </p>
          </div>
        </div>

        {mandatory && (
          <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
            <span className="font-bold">Security Notice: </span>
            The default password <span className="font-mono font-bold">admin</span> must be changed to secure the TeamZero portal.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-error-50 p-3 text-xs font-semibold text-error-600 dark:bg-error-500/15 dark:text-error-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-success-50 p-3 text-xs font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-400">
            ✓ Password updated successfully! Loading portal...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <Label htmlFor="cp-current">
              Current Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cp-current"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (default: admin)"
                className="ps-10 pe-11"
              />
              <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
                <LockIcon className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showCurrent ? <EyeCloseIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <Label htmlFor="cp-new">
              New Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cp-new"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="ps-10 pe-11"
              />
              <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
                <LockIcon className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showNew ? <EyeCloseIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <Label htmlFor="cp-confirm">
              Confirm New Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cp-confirm"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="ps-10 pe-11"
              />
              <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
                <LockIcon className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showConfirm ? <EyeCloseIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            {!mandatory && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button size="sm" type="submit" className={mandatory ? "w-full" : ""}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
