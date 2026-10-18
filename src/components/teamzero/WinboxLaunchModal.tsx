import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import CopyButton from "./CopyButton";
import { BoltIcon, PlugInIcon } from "@/icons";
import type { CustomerDevice } from "@/context/PortalDataContext";

interface WinboxLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: CustomerDevice | null;
}

export const WinboxLaunchModal: React.FC<WinboxLaunchModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  if (!device) return null;

  const isWinbox = device.loginMethod === "winbox";
  const [ipOnly, port] = device.deviceIp.split(":");
  const resolvedPort = port || (isWinbox ? "8291" : "23");

  const winboxCommand = `winbox.exe ${device.deviceIp} ${device.username} ${device.password}`;
  const telnetCommand = `telnet ${ipOnly} ${resolvedPort}`;
  const protocolUrl = isWinbox
    ? `winbox://${device.username}:${encodeURIComponent(device.password)}@${device.deviceIp}`
    : `telnet://${device.deviceIp}`;

  const handleLaunch = async () => {
    setIsLaunching(true);
    setFeedback({ type: "info", text: isWinbox ? "Starting Winbox with credentials..." : "Opening Telnet terminal..." });

    try {
      if (isWinbox) {
        const res = await fetch("/api/launch/winbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip: device.deviceIp,
            username: device.username,
            password: device.password,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setFeedback({
            type: "success",
            text: `Winbox launched! Connecting to ${device.deviceIp} as ${device.username}...`,
          });
          setTimeout(() => setIsLaunching(false), 2500);
          return;
        }
      } else {
        const res = await fetch("/api/launch/telnet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip: ipOnly,
            port: resolvedPort,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setFeedback({
            type: "success",
            text: `Terminal launched for ${device.deviceIp}!`,
          });
          setTimeout(() => setIsLaunching(false), 2500);
          return;
        }
      }
    } catch (err) {
      console.warn("Direct launcher fallback to protocol handler:", err);
    }

    // Secondary fallback: trigger Windows URL protocol
    try {
      window.location.href = protocolUrl;
      setFeedback({
        type: "success",
        text: `Protocol dispatched! Opening Winbox for ${device.deviceIp}...`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Could not launch automatically. Please copy the CLI command below.",
      });
    }

    setTimeout(() => setIsLaunching(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setFeedback(null);
        setIsLaunching(false);
        onClose();
      }}
      className="max-w-lg p-6 sm:p-8"
    >
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {isWinbox ? <BoltIcon className="size-6" /> : <PlugInIcon className="size-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isWinbox ? "Connect via Mikrotik Winbox" : "Connect via Telnet Terminal"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {device.deviceName} • {device.customerName}
            </p>
          </div>
        </div>

        {/* Credentials Card */}
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Target IP / Port
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-white">
                {device.deviceIp}
              </span>
              <CopyButton textToCopy={device.deviceIp} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Username
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-gray-800 dark:text-white">
                {device.username}
              </span>
              <CopyButton textToCopy={device.username} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Password
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-gray-800 dark:text-white">
                {device.password}
              </span>
              <CopyButton textToCopy={device.password} />
            </div>
          </div>

          {/* Command Copy Area */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {isWinbox ? "Winbox CLI Command" : "Terminal Command"}
              </span>
              <CopyButton
                textToCopy={isWinbox ? winboxCommand : telnetCommand}
                label="Copy Command"
              />
            </div>
            <pre className="overflow-x-auto rounded-xl bg-gray-900 p-3 font-mono text-xs text-brand-300 shadow-inner dark:bg-black/60">
              {isWinbox ? winboxCommand : telnetCommand}
            </pre>
          </div>
        </div>

        {/* System Integration Indicator */}
        <div className="mt-3 flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <span className="size-2 rounded-full bg-success-500 animate-pulse"></span>
            <span className="font-medium">
              {isWinbox ? "1-Click Auto-Login Enabled (WinBox 4.0)" : "Direct Console Integration Active"}
            </span>
          </div>
          <span className="font-mono text-[11px] text-gray-400">
            {isWinbox ? "Port 8291" : "Port 23"}
          </span>
        </div>

        {/* Dynamic Status Feedback */}
        {feedback && (
          <div
            className={`mt-3 flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
              feedback.type === "success"
                ? "border-success-200 bg-success-50 text-success-800 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-400"
                : feedback.type === "info"
                ? "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-400"
                : "border-error-200 bg-error-50 text-error-800 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400"
            }`}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-current"></span>
            </span>
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFeedback(null);
              setIsLaunching(false);
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleLaunch}
            disabled={isLaunching}
            startIcon={isWinbox ? <BoltIcon className="size-4" /> : <PlugInIcon className="size-4" />}
            className="w-full sm:w-auto font-semibold shadow-md shadow-brand-500/20"
          >
            {isLaunching
              ? "Opening Winbox..."
              : isWinbox
              ? "Launch Winbox & Connect"
              : "Launch Telnet Terminal"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WinboxLaunchModal;
