import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { AlertHexaIcon, TrashBinIcon } from "@/icons";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
          <AlertHexaIcon className="size-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
        {itemName && (
          <div className="mb-6 rounded-lg bg-gray-50 px-3 py-1.5 font-mono text-sm font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {itemName}
          </div>
        )}
        <div className="flex w-full items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full justify-center"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-error-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-error-700"
          >
            <TrashBinIcon className="size-4" />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
