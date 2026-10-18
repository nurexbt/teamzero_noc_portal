import React from "react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import { usePortalData } from "@/context/PortalDataContext";
import type { CustomerDevice, LoginMethod } from "@/context/PortalDataContext";
import CopyButton from "@/components/teamzero/CopyButton";
import PasswordDisplay from "@/components/teamzero/PasswordDisplay";
import WinboxLaunchModal from "@/components/teamzero/WinboxLaunchModal";
import { useModal } from "@/hooks/useModal";
import {
  BoltIcon,
  ChipIcon,
  GlobeIcon,
  IntegrationAltIcon,
  LockIcon,
  MultiUserIcon,
  PlugInIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@/icons";

const METHOD_ICONS: Record<LoginMethod, React.ReactNode> = {
  winbox: <BoltIcon className="size-3.5 text-brand-500" />,
  telnet: <PlugInIcon className="size-3.5 text-warning-500" />,
  web: <GlobeIcon className="size-3.5 text-blue-light-500" />,
  web_ssl: <LockIcon className="size-3.5 text-success-500" />,
};

const TeamZeroDashboard: React.FC = () => {
  const { customers, devices, nmsPortals } = usePortalData();

  const {
    isOpen: isWinboxModalOpen,
    openModal: openWinboxModal,
    closeModal: closeWinboxModal,
  } = useModal();
  const [activeDevice, setActiveDevice] = React.useState<CustomerDevice | null>(null);

  const handleOpenDevice = (device: CustomerDevice) => {
    if (device.loginMethod === "web") {
      let target = device.deviceIp;
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = `http://${target}`;
      }
      window.open(target, "_blank", "noopener,noreferrer");
    } else if (device.loginMethod === "web_ssl") {
      let target = device.deviceIp;
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = `https://${target}`;
      }
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      setActiveDevice(device);
      openWinboxModal();
    }
  };

  const handleOpenNms = (url: string) => {
    let target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `http://${target}`;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const winboxCount = devices.filter((d) => d.loginMethod === "winbox").length;
  const webSslCount = devices.filter((d) => d.loginMethod === "web_ssl").length;
  const webCount = devices.filter((d) => d.loginMethod === "web").length;
  const telnetCount = devices.filter((d) => d.loginMethod === "telnet").length;

  return (
    <>
      <PageMeta
        title="NOC Portal | TeamZero Solutions"
        description="TeamZero Solutions Network Operations Center, Customer Directory, Device Inventory, and NMS Portal."
      />

      {/* Hero Welcome Banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-r from-brand-600 via-brand-500 to-brand-700 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <span className="size-2 rounded-full bg-success-400 animate-pulse"></span>
              <span>TeamZero Solutions NOC Live</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              TeamZero Solutions Portal
            </h1>
            <p className="mt-1 text-sm text-white/80 sm:text-base">
              Unified management for client profiles, Mikrotik Winbox routers, switches, and monitoring systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/devices"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-md transition hover:bg-gray-50"
            >
              <ChipIcon className="size-4" />
              <span>Manage Devices</span>
            </Link>
            <Link
              to="/customers"
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/30"
            >
              <PlusIcon className="size-4" />
              <span>Add Customer</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Customers */}
        <Link
          to="/customers"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <MultiUserIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {customers.length}
            </p>
            <span className="flex items-center text-xs font-medium text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
              View All <ArrowRightIcon className="ms-1 size-3" />
            </span>
          </div>
        </Link>

        {/* Customer Devices */}
        <Link
          to="/devices"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Customer Devices
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
              <ChipIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {devices.length}
            </p>
            <span className="flex items-center text-xs font-medium text-success-600 dark:text-success-400 group-hover:translate-x-1 transition-transform">
              Winbox ({winboxCount}) <ArrowRightIcon className="ms-1 size-3" />
            </span>
          </div>
        </Link>

        {/* NMS Portals */}
        <Link
          to="/nms"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              NMS Portals
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400">
              <IntegrationAltIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {nmsPortals.length}
            </p>
            <span className="flex items-center text-xs font-medium text-blue-light-600 dark:text-blue-light-400 group-hover:translate-x-1 transition-transform">
              Active NOC <ArrowRightIcon className="ms-1 size-3" />
            </span>
          </div>
        </Link>

        {/* Protocol Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Access Breakdown
          </span>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
              <BoltIcon className="size-3 text-brand-500" />
              <span>Winbox: {winboxCount}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
              <LockIcon className="size-3 text-success-500" />
              <span>SSL: {webSslCount}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
              <GlobeIcon className="size-3 text-blue-light-500" />
              <span>Web: {webCount}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
              <PlugInIcon className="size-3 text-warning-500" />
              <span>Telnet: {telnetCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: NMS Portals Quick Launch + Recent Devices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* NMS Quick Launch Cards (1 col) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              NMS Portals Quick Launch
            </h3>
            <Link
              to="/nms"
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              All Portals
            </Link>
          </div>

          <div className="space-y-3">
            {nmsPortals.map((portal) => (
              <div
                key={portal.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition hover:bg-gray-100/70 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-gray-800"
              >
                <div className="min-w-0 pr-2">
                  <span className="block truncate font-semibold text-sm text-gray-900 dark:text-white">
                    {portal.name}
                  </span>
                  <span className="block truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                    {portal.url}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenNms(portal.url)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
                >
                  <PlugInIcon className="size-3.5" />
                  <span>Open</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Devices Quick Access Table (2 cols) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Customer Devices Quick Connect
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                1-click access to Winbox, Web, and Telnet endpoints
              </p>
            </div>
            <Link
              to="/devices"
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Manage All Devices →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 text-start">Device</th>
                  <th className="px-6 py-3 text-start">Customer</th>
                  <th className="px-6 py-3 text-start">IP / Port</th>
                  <th className="px-6 py-3 text-start">Password</th>
                  <th className="px-6 py-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {devices.slice(0, 5).map((device) => (
                  <tr
                    key={device.id}
                    className="transition hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {METHOD_ICONS[device.loginMethod]}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {device.deviceName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 dark:text-gray-300">
                      {device.customerName}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <span>{device.deviceIp}</span>
                        <CopyButton textToCopy={device.deviceIp} />
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <PasswordDisplay password={device.password} />
                    </td>
                    <td className="px-6 py-3.5 text-end">
                      <button
                        type="button"
                        onClick={() => handleOpenDevice(device)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                      >
                        <PlugInIcon className="size-3.5" />
                        <span>Open</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <WinboxLaunchModal
        isOpen={isWinboxModalOpen}
        onClose={closeWinboxModal}
        device={activeDevice}
      />
    </>
  );
};

export default TeamZeroDashboard;
