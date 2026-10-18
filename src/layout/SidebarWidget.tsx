import { useSidebar } from "@/context/SidebarContext";
import { usePortalData } from "@/context/PortalDataContext";
import { useNavigate } from "react-router";
import { LogoutIcon } from "../icons";

export default function SidebarWidget() {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { logout, currentUser } = usePortalData();
  const navigate = useNavigate();

  const isWide = isExpanded || isHovered || isMobileOpen;

  const handleSignOut = () => {
    logout();
    navigate("/signin");
  };

  return (
    <div className="mt-auto border-t border-gray-200/80 pt-3 pb-4 dark:border-gray-800/80">
      {isWide ? (
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-bold text-gray-800 dark:text-gray-200">
              TeamZero Portal
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-success-500 animate-pulse"></span>
              <span className="font-mono text-[11px] font-medium text-gray-500 dark:text-gray-400">
                v1.0.0
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="group flex size-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-all hover:border-error-200 hover:bg-error-50 hover:text-error-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-error-500/30 dark:hover:bg-error-500/15 dark:hover:text-error-400"
            title={`Sign out (${currentUser?.username || "admin"})`}
            aria-label="Sign out"
          >
            <LogoutIcon className="size-4.5 rtl:rotate-180 transition-transform group-hover:scale-110" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={handleSignOut}
            className="group flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-all hover:border-error-200 hover:bg-error-50 hover:text-error-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-error-500/30 dark:hover:bg-error-500/15 dark:hover:text-error-400"
            title={`Sign out (${currentUser?.username || "admin"}) - v1.0.0`}
            aria-label="Sign out"
          >
            <LogoutIcon className="size-5 rtl:rotate-180 transition-transform group-hover:scale-110" />
          </button>
          <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">
            v1.0
          </span>
        </div>
      )}
    </div>
  );
}
