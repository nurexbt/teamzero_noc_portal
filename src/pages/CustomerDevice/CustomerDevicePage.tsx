import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Radio from "@/components/form/input/Radio";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/hooks/useModal";
import { usePortalData } from "@/context/PortalDataContext";
import type {
  CustomerDevice,
  LoginMethod,
} from "@/context/PortalDataContext";
import ConfirmDeleteModal from "@/components/teamzero/ConfirmDeleteModal";
import CopyButton from "@/components/teamzero/CopyButton";
import PasswordDisplay from "@/components/teamzero/PasswordDisplay";
import WinboxLaunchModal from "@/components/teamzero/WinboxLaunchModal";
import {
  BoltIcon,
  ChipIcon,
  EditIcon,
  GlobeIcon,
  LockIcon,
  PlugInIcon,
  PlusIcon,
  SearchIcon,
  TrashBinIcon,
} from "@/icons";

const LOGIN_METHOD_CONFIG: Record<
  LoginMethod,
  {
    label: string;
    port: string;
    badgeClass: string;
    borderClass: string;
    icon: React.ReactNode;
  }
> = {
  winbox: {
    label: "Winbox",
    port: "8291",
    badgeClass:
      "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    borderClass: "border-brand-500",
    icon: <BoltIcon className="size-3.5" />,
  },
  telnet: {
    label: "Telnet",
    port: "23",
    badgeClass:
      "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400",
    borderClass: "border-warning-500",
    icon: <PlugInIcon className="size-3.5" />,
  },
  web: {
    label: "Web",
    port: "80",
    badgeClass:
      "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
    borderClass: "border-blue-light-500",
    icon: <GlobeIcon className="size-3.5" />,
  },
  web_ssl: {
    label: "Web SSL",
    port: "443",
    badgeClass:
      "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
    borderClass: "border-success-500",
    icon: <LockIcon className="size-3.5" />,
  },
};

const CustomerDevicePage: React.FC = () => {
  const { customers, devices, addDevice, updateDevice, deleteDevice, hasPermission } =
    usePortalData();
  const canManage = hasPermission("Manage Devices");
  const canLaunch = hasPermission("Launch Winbox/Telnet");
  const canViewPasswords = hasPermission("View Passwords");
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const selectedCustomerFilter = searchParams.get("customer") || "all";
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<
    "all" | LoginMethod
  >("all");

  // Add / Edit Modal
  const {
    isOpen: isFormModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
  } = useModal();
  const [editingDevice, setEditingDevice] = useState<CustomerDevice | null>(
    null
  );

  // Form State
  const [formData, setFormData] = useState<{
    customerId: string;
    deviceName: string;
    deviceIp: string;
    username: string;
    password: string;
    loginMethod: LoginMethod;
    notes: string;
  }>({
    customerId: customers[0]?.id || "",
    deviceName: "",
    deviceIp: "",
    username: "admin",
    password: "",
    loginMethod: "winbox",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Winbox / Telnet Launch Modal
  const {
    isOpen: isWinboxModalOpen,
    openModal: openWinboxModal,
    closeModal: closeWinboxModal,
  } = useModal();
  const [activeLaunchDevice, setActiveLaunchDevice] =
    useState<CustomerDevice | null>(null);

  // Delete Modal
  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal();
  const [deviceToDelete, setDeviceToDelete] = useState<CustomerDevice | null>(
    null
  );

  const handleOpenAddModal = () => {
    setEditingDevice(null);
    setFormData({
      customerId:
        selectedCustomerFilter !== "all"
          ? selectedCustomerFilter
          : customers[0]?.id || "",
      deviceName: "",
      deviceIp: "",
      username: "admin",
      password: "",
      loginMethod: "winbox",
      notes: "",
    });
    setFormErrors({});
    openFormModal();
  };

  const handleOpenEditModal = (device: CustomerDevice) => {
    setEditingDevice(device);
    setFormData({
      customerId: device.customerId,
      deviceName: device.deviceName,
      deviceIp: device.deviceIp,
      username: device.username,
      password: device.password,
      loginMethod: device.loginMethod,
      notes: device.notes || "",
    });
    setFormErrors({});
    openFormModal();
  };

  const handleOpenDeleteModal = (device: CustomerDevice) => {
    setDeviceToDelete(device);
    openDeleteModal();
  };

  const handleConfirmDelete = () => {
    if (deviceToDelete) {
      deleteDevice(deviceToDelete.id);
      setDeviceToDelete(null);
    }
  };

  const handleOpenAction = (device: CustomerDevice) => {
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
      // winbox or telnet
      setActiveLaunchDevice(device);
      openWinboxModal();
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.customerId) errors.customerId = "Please select a customer";
    if (!formData.deviceName.trim())
      errors.deviceName = "Device name is required (e.g. Router1)";
    if (!formData.deviceIp.trim())
      errors.deviceIp = "Device IP is required (e.g. 10.0.0.1:8291)";
    if (!formData.username.trim())
      errors.username = "Username is required";
    if (!formData.password)
      errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const matchedCustomer = customers.find((c) => c.id === formData.customerId);
    const customerName = matchedCustomer ? matchedCustomer.name : "Unknown Customer";

    if (editingDevice) {
      updateDevice(editingDevice.id, {
        customerId: formData.customerId,
        customerName,
        deviceName: formData.deviceName.trim(),
        deviceIp: formData.deviceIp.trim(),
        username: formData.username.trim(),
        password: formData.password,
        loginMethod: formData.loginMethod,
        notes: formData.notes.trim(),
      });
    } else {
      addDevice({
        customerId: formData.customerId,
        customerName,
        deviceName: formData.deviceName.trim(),
        deviceIp: formData.deviceIp.trim(),
        username: formData.username.trim(),
        password: formData.password,
        loginMethod: formData.loginMethod,
        notes: formData.notes.trim(),
      });
    }
    closeFormModal();
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        device.deviceName.toLowerCase().includes(query) ||
        device.deviceIp.toLowerCase().includes(query) ||
        device.username.toLowerCase().includes(query) ||
        device.customerName.toLowerCase().includes(query);

      const matchesCustomer =
        selectedCustomerFilter === "all" ||
        device.customerId === selectedCustomerFilter;

      const matchesMethod =
        selectedMethodFilter === "all" ||
        device.loginMethod === selectedMethodFilter;

      return matchesSearch && matchesCustomer && matchesMethod;
    });
  }, [devices, searchTerm, selectedCustomerFilter, selectedMethodFilter]);

  return (
    <>
      <PageMeta
        title="Customer Device Info | TeamZero Solutions"
        description="Monitor and access customer network devices with Winbox, Telnet, Web, and Web SSL login methods."
      />
      <PageBreadCrumb pageTitle="Customer Devices" />

      {/* Top Bar: Search, Filters & Add Button */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
              <SearchIcon className="size-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search devices, IP, customer..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white ps-10 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Customer Dropdown Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedCustomerFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") {
                  searchParams.delete("customer");
                } else {
                  searchParams.set("customer", val);
                }
                setSearchParams(searchParams);
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <option value="all">All Customers ({customers.length})</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canManage && (
          <Button
            onClick={handleOpenAddModal}
            startIcon={<PlusIcon className="size-4" />}
            className="whitespace-nowrap"
          >
            Add Device
          </Button>
        )}
      </div>

      {/* Login Method Filter Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setSelectedMethodFilter("all")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            selectedMethodFilter === "all"
              ? "bg-brand-500 text-white shadow-theme-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          All Methods ({devices.length})
        </button>

        {(["winbox", "telnet", "web", "web_ssl"] as LoginMethod[]).map(
          (method) => {
            const count = devices.filter((d) => d.loginMethod === method).length;
            const config = LOGIN_METHOD_CONFIG[method];
            const isSelected = selectedMethodFilter === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethodFilter(method)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-brand-500 text-white shadow-theme-xs"
                    : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {config.icon}
                <span>{config.label}</span>
                <span
                  className={`ms-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Main Devices Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-1 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Customer Device Inventory
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredDevices.length} of {devices.length} registered network devices
            </p>
          </div>
          {selectedCustomerFilter !== "all" && (
            <button
              onClick={() => {
                searchParams.delete("customer");
                setSearchParams(searchParams);
              }}
              className="text-xs font-medium text-brand-500 hover:underline"
            >
              Clear customer filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Device Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Customer
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Device IP &amp; Port
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Username
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Password
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Login Method
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-end text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No devices match the selected filters or search terms.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => {
                  const config = LOGIN_METHOD_CONFIG[device.loginMethod];
                  return (
                    <TableRow
                      key={device.id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                    >
                      {/* Device Name */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            <ChipIcon className="size-5" />
                          </div>
                          <div>
                            <span className="block font-semibold text-gray-900 dark:text-white">
                              {device.deviceName}
                            </span>
                            {device.notes && (
                              <span className="block max-w-xs truncate text-xs text-gray-400 dark:text-gray-500">
                                {device.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="px-6 py-4 text-start">
                        <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {device.customerName}
                        </span>
                      </TableCell>

                      {/* Device IP */}
                      <TableCell className="px-6 py-4 text-start">
                        <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                          <span>{device.deviceIp}</span>
                          <CopyButton textToCopy={device.deviceIp} />
                        </div>
                      </TableCell>

                      {/* Username */}
                      <TableCell className="px-6 py-4 text-start">
                        <div className="flex items-center gap-1.5 font-mono text-sm text-gray-700 dark:text-gray-300">
                          <span>{device.username}</span>
                          <CopyButton textToCopy={device.username} />
                        </div>
                      </TableCell>

                      {/* Password */}
                      <TableCell className="px-6 py-4 text-start">
                        <PasswordDisplay
                          password={device.password}
                          canView={canViewPasswords}
                        />
                      </TableCell>

                      {/* Login Method */}
                      <TableCell className="px-6 py-4 text-start">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      </TableCell>

                      {/* Actions: Open, Edit, Delete */}
                      <TableCell className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open Button */}
                          {canLaunch ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(device)}
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                              title={`Open via ${config.label}`}
                            >
                              <PlugInIcon className="size-3.5" />
                              <span>Open</span>
                            </button>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                              title="Protocol launch restricted by permission"
                            >
                              <LockIcon className="size-3" />
                              Locked
                            </span>
                          )}

                          {/* Edit Button */}
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(device)}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                                title="Edit Device"
                              >
                                <EditIcon className="size-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(device)}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-400"
                                title="Delete Device"
                              >
                                <TrashBinIcon className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Device Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        className="max-w-lg p-6 sm:p-8"
      >
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <ChipIcon className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingDevice ? "Edit Customer Device" : "Add Customer Device"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure connection credentials and login protocol
              </p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Customer Selector */}
            <div>
              <Label htmlFor="device-customer">
                Customer <span className="text-error-500">*</span>
              </Label>
              <select
                id="device-customer"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerId: e.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {formErrors.customerId && (
                <p className="mt-1 text-xs text-error-500">
                  {formErrors.customerId}
                </p>
              )}
            </div>

            {/* Device Name */}
            <div>
              <Label htmlFor="device-name">
                Device Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="device-name"
                type="text"
                value={formData.deviceName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deviceName: e.target.value,
                  }))
                }
                placeholder="e.g. Router1, Core-CCR2004, Office-AP"
                error={Boolean(formErrors.deviceName)}
                hint={formErrors.deviceName}
              />
            </div>

            {/* Device IP + Port */}
            <div>
              <Label htmlFor="device-ip">
                Device IP &amp; Port <span className="text-error-500">*</span>
              </Label>
              <Input
                id="device-ip"
                type="text"
                value={formData.deviceIp}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deviceIp: e.target.value,
                  }))
                }
                placeholder="e.g. 10.0.0.1:8291 or 192.168.1.1:80"
                error={Boolean(formErrors.deviceIp)}
                hint={formErrors.deviceIp}
              />
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="device-username">
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="device-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="admin"
                  error={Boolean(formErrors.username)}
                  hint={formErrors.username}
                />
              </div>

              <div>
                <Label htmlFor="device-password">
                  Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="device-password"
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter device password"
                  error={Boolean(formErrors.password)}
                  hint={formErrors.password}
                />
              </div>
            </div>

            {/* Login Method Radio Selector */}
            <div className="pt-2">
              <Label>
                Login Method <span className="text-error-500">*</span> (Radio
                selector)
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    {
                      value: "winbox",
                      label: "Winbox",
                      sub: "Port 8291",
                      icon: <BoltIcon className="size-4" />,
                    },
                    {
                      value: "telnet",
                      label: "Telnet",
                      sub: "Port 23",
                      icon: <PlugInIcon className="size-4" />,
                    },
                    {
                      value: "web",
                      label: "Web",
                      sub: "HTTP :80",
                      icon: <GlobeIcon className="size-4" />,
                    },
                    {
                      value: "web_ssl",
                      label: "Web SSL",
                      sub: "HTTPS :443",
                      icon: <LockIcon className="size-4" />,
                    },
                  ] as {
                    value: LoginMethod;
                    label: string;
                    sub: string;
                    icon: React.ReactNode;
                  }[]
                ).map((method) => {
                  const isChecked = formData.loginMethod === method.value;
                  return (
                    <label
                      key={method.value}
                      className={`relative flex cursor-pointer flex-col rounded-xl border p-3 transition ${
                        isChecked
                          ? "border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10"
                          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex size-7 items-center justify-center rounded-lg ${
                            isChecked
                              ? "bg-brand-500 text-white"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {method.icon}
                        </div>
                        <Radio
                          id={`method-${method.value}`}
                          name="loginMethod"
                          value={method.value}
                          checked={isChecked}
                          onChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              loginMethod: val as LoginMethod,
                            }))
                          }
                          label=""
                        />
                      </div>
                      <span className="mt-2 text-xs font-bold text-gray-900 dark:text-white">
                        {method.label}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {method.sub}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <Label htmlFor="device-notes">Notes / Purpose (Optional)</Label>
              <Input
                id="device-notes"
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="e.g. Main Gateway Mikrotik CCR1009 - Office Uplink"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={closeFormModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {editingDevice ? "Save Changes" : "Create Device"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Winbox / Telnet Interactive Launcher Modal */}
      <WinboxLaunchModal
        isOpen={isWinboxModalOpen}
        onClose={closeWinboxModal}
        device={activeLaunchDevice}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Device?"
        message="Are you sure you want to remove this device record from the customer's portal?"
        itemName={
          deviceToDelete
            ? `${deviceToDelete.deviceName} (${deviceToDelete.deviceIp})`
            : undefined
        }
      />
    </>
  );
};

export default CustomerDevicePage;
