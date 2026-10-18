import React, { useState } from "react";
import { CheckSmIcon, CopySmIcon } from "@/icons";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
  title?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label,
  className = "",
  title = "Copy to clipboard",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : title}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white ${className}`}
    >
      {copied ? (
        <>
          <CheckSmIcon className="size-3.5 text-success-500" />
          <span className="text-success-600 dark:text-success-400">Copied</span>
        </>
      ) : (
        <>
          <CopySmIcon className="size-3.5" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

export default CopyButton;
