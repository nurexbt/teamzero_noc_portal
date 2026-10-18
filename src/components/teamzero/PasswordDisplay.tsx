import React, { useState } from "react";
import { EyeCloseIcon, EyeIcon, LockIcon } from "@/icons";
import CopyButton from "./CopyButton";

interface PasswordDisplayProps {
  password: string;
  className?: string;
  canView?: boolean;
}

export const PasswordDisplay: React.FC<PasswordDisplayProps> = ({
  password,
  className = "",
  canView = true,
}) => {
  const [show, setShow] = useState(false);

  if (!canView) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-mono text-xs text-gray-400 dark:text-gray-500 ${className}`}>
        <span>••••••••</span>
        <span
          className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          title="Hidden by permission policy (requires View Passwords permission)"
        >
          <LockIcon className="size-3" />
          Masked
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono text-xs ${className}`}>
      <span className="font-medium text-gray-800 dark:text-gray-200">
        {show ? password : "••••••••"}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShow((prev) => !prev);
        }}
        className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        title={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <EyeCloseIcon className="size-3.5" />
        ) : (
          <EyeIcon className="size-3.5" />
        )}
      </button>
      <CopyButton textToCopy={password} title="Copy password" />
    </div>
  );
};

export default PasswordDisplay;
