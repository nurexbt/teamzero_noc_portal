import React, { useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
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
import type { NmsPortal } from "@/context/PortalDataContext";
import ConfirmDeleteModal from "@/components/teamzero/ConfirmDeleteModal";
import CopyButton from "@/components/teamzero/CopyButton";
import PasswordDisplay from "@/components/teamzero/PasswordDisplay";
import {
  EditIcon,
  GlobeIcon,
  IntegrationAltIcon,
  LockIcon,
  PlugInIcon,
  PlusIcon,
  SearchIcon,
  TrashBinIcon,
} from "@/icons";

const NmsPortalPage: React.FC = () => {
  const { nmsPortals, addNmsPortal, updateNmsPortal, deleteNmsPortal, hasPermission } =
    usePortalData();
  const canManage = hasPermission("Manage NMS Portals");
  const canAccess = hasPermission("Access NMS Portals");
  const canViewPasswords = hasPermission("View Passwords");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Add / Edit Modal
  const {
    isOpen: isFormModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
  } = useModal();
  const [editingPortal, setEditingPortal] = useState<NmsPortal | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    url: string;
    username: string;
    password: string;
    category: string;
  }>({
    name: "",
    url: "",
    username: "",
    password: "",
    category: "Monitoring & Analytics",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Modal
  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal();
  const [portalToDelete, setPortalToDelete] = useState<NmsPortal | null>(null);

  const handleOpenAddModal = () => {
    setEditingPortal(null);
    setFormData({
      name: "",
      url: "",
      username: "admin",
      password: "",
      category: "Monitoring & Analytics",
    });
    setFormErrors({});
    openFormModal();
  };

  const handleOpenEditModal = (portal: NmsPortal) => {
    setEditingPortal(portal);
    setFormData({
      name: portal.name,
      url: portal.url,
      username: portal.username,
      password: portal.password,
      category: portal.category || "Monitoring & Analytics",
    });
    setFormErrors({});
    openFormModal();
  };

  const handleOpenDeleteModal = (portal: NmsPortal) => {
    setPortalToDelete(portal);
    openDeleteModal();
  };

  const handleConfirmDelete = () => {
    if (portalToDelete) {
      deleteNmsPortal(portalToDelete.id);
      setPortalToDelete(null);
    }
  };

  const handleOpenPortalUrl = (portal: NmsPortal) => {
    let target = portal.url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `http://${target}`;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Portal name is required";
    if (!formData.url.trim()) errors.url = "IP+Port or URL is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.password) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingPortal) {
      updateNmsPortal(editingPortal.id, {
        name: formData.name.trim(),
        url: formData.url.trim(),
        username: formData.username.trim(),
        password: formData.password,
        category: formData.category.trim(),
      });
    } else {
      addNmsPortal({
        name: formData.name.trim(),
        url: formData.url.trim(),
        username: formData.username.trim(),
        password: formData.password,
        category: formData.category.trim(),
        status: "online",
      });
    }
    closeFormModal();
  };

  const filteredPortals = nmsPortals.filter((p) => {
    const query = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.url.toLowerCase().includes(query) ||
      p.username.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <PageMeta
        title="NMS Portals | TeamZero Solutions"
        description="Centralized access to Network Management Systems, Zabbix, LibreNMS, and telemetry monitoring portals."
      />
      <PageBreadCrumb pageTitle="NMS Portals" />

      {/* Top Action Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
            <SearchIcon className="size-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search NMS portals, IP, URL, or category..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white ps-10 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        {canManage && (
          <Button
            onClick={handleOpenAddModal}
            startIcon={<PlusIcon className="size-4" />}
            className="whitespace-nowrap"
          >
            Add NMS Portal
          </Button>
        )}
      </div>

      {/* NMS Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Configured NMS Infrastructure
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Direct web console links and authentication credentials for TeamZero NOC
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Portal Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  IP+Port / URL
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
                  Status
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
              {filteredPortals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No NMS portals found matching &quot;{searchTerm}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filteredPortals.map((portal) => (
                  <TableRow
                    key={portal.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                  >
                    {/* Portal Name */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                          <IntegrationAltIcon className="size-5" />
                        </div>
                        <div>
                          <span className="block font-semibold text-gray-900 dark:text-white">
                            {portal.name}
                          </span>
                          {portal.category && (
                            <span className="block text-xs text-gray-400 dark:text-gray-500">
                              {portal.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* IP+Port / URL */}
                    <TableCell className="px-6 py-4 text-start">
                      <div className="flex items-center gap-1.5 font-mono text-sm">
                        <button
                          type="button"
                          onClick={() => handleOpenPortalUrl(portal)}
                          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                          title="Open URL in new tab"
                        >
                          {portal.url}
                        </button>
                        <CopyButton textToCopy={portal.url} />
                      </div>
                    </TableCell>

                    {/* Username */}
                    <TableCell className="px-6 py-4 text-start">
                      <div className="flex items-center gap-1.5 font-mono text-sm text-gray-700 dark:text-gray-300">
                        <span>{portal.username}</span>
                        <CopyButton textToCopy={portal.username} />
                      </div>
                    </TableCell>

                    {/* Password */}
                    <TableCell className="px-6 py-4 text-start">
                      <PasswordDisplay
                        password={portal.password}
                        canView={canViewPasswords}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-6 py-4 text-start">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-400">
                        <span className="size-1.5 rounded-full bg-success-500 animate-pulse"></span>
                        Active
                      </span>
                    </TableCell>

                    {/* Actions: Open, Edit, Delete */}
                    <TableCell className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open Button */}
                        {canAccess ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPortalUrl(portal)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                            title="Open Portal in New Tab"
                          >
                            <PlugInIcon className="size-3.5" />
                            <span>Open</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                            title="Portal access restricted by permission"
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
                              onClick={() => handleOpenEditModal(portal)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                              title="Edit Portal"
                            >
                              <EditIcon className="size-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(portal)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-400"
                              title="Delete Portal"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit NMS Portal Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        className="max-w-lg p-6 sm:p-8"
      >
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <GlobeIcon className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPortal ? "Edit NMS Portal" : "Add NMS Portal"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Register network monitoring system URL and credentials
              </p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nms-name">
                Portal Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="nms-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Zabbix NOC Monitor, LibreNMS Core"
                error={Boolean(formErrors.name)}
                hint={formErrors.name}
              />
            </div>

            <div>
              <Label htmlFor="nms-url">
                IP+Port or Web URL <span className="text-error-500">*</span>
              </Label>
              <Input
                id="nms-url"
                type="text"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="e.g. http://10.0.0.250:8080 or https://nms.teamzero.solutions"
                error={Boolean(formErrors.url)}
                hint={formErrors.url}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nms-username">
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="nms-username"
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
                <Label htmlFor="nms-password">
                  Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="nms-password"
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter login password"
                  error={Boolean(formErrors.password)}
                  hint={formErrors.password}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nms-category">Category / Role (Optional)</Label>
              <Input
                id="nms-category"
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="e.g. Infrastructure Monitoring, SNMP Graphs"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={closeFormModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {editingPortal ? "Save Changes" : "Create NMS Portal"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete NMS Portal?"
        message="Are you sure you want to remove this monitoring portal from the directory?"
        itemName={portalToDelete?.name}
      />
    </>
  );
};

export default NmsPortalPage;
