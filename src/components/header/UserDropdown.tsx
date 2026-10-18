import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { usePortalData } from "@/context/PortalDataContext";
import ChangePasswordModal from "@/components/teamzero/ChangePasswordModal";
import { KeyIcon, LockIcon } from "@/icons";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { t } = useTranslation();
  const { currentUser, logout } = usePortalData();
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleSignOut = () => {
    logout();
    closeDropdown();
    navigate("/signin");
  };

  const displayName = currentUser ? currentUser.name : "Administrator";
  const displayRole = currentUser ? currentUser.roleName : "Super Admin";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
      >
        <span className="me-3 flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 font-bold text-white shadow-sm">
          {displayName.charAt(0).toUpperCase()}
        </span>

        <div className="me-2 text-start hidden sm:block">
          <span className="block text-theme-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {displayName}
          </span>
          <span className="block text-[11px] font-medium text-brand-600 dark:text-brand-400 leading-tight">
            {displayRole}
          </span>
        </div>
        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute inset-e-0 mt-4.25 flex w-68 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {/* User Identity Info */}
        <div className="border-b border-gray-100 pb-3 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="block text-theme-sm font-bold text-gray-900 dark:text-white">
              {displayName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <LockIcon className="size-2.5" />
              {displayRole}
            </span>
          </div>
          <span className="block font-mono text-xs text-gray-500 dark:text-gray-400">
            @{currentUser?.username || "admin"}
          </span>
          <span className="block text-xs text-gray-400 dark:text-gray-500 truncate">
            {currentUser?.email || "admin@teamzero.solutions"}
          </span>
        </div>

        {/* Action Menu: Only Change Password & Sign Out */}
        <ul className="flex flex-col gap-1 border-b border-gray-200 py-2 dark:border-gray-800">
          <li>
            <button
              type="button"
              onClick={() => {
                closeDropdown();
                setIsPasswordModalOpen(true);
              }}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <KeyIcon className="size-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
              <span>Change Password</span>
            </button>
          </li>
        </ul>

        <button
          type="button"
          onClick={handleSignOut}
          className="group mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
              fill=""
            />
          </svg>
          {t("userDropdown.signOut")}
        </button>
      </Dropdown>
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        mandatory={false}
      />
    </div>
  );
}
