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
import type { Customer } from "@/context/PortalDataContext";
import ConfirmDeleteModal from "@/components/teamzero/ConfirmDeleteModal";
import CopyButton from "@/components/teamzero/CopyButton";
import {
  CallIcon,
  ChipIcon,
  EditIcon,
  EnvelopeIcon,
  MapIcon,
  MultiUserIcon,
  PlusIcon,
  SearchIcon,
  TrashBinIcon,
} from "@/icons";
import { Link } from "react-router";

const CustomerPage: React.FC = () => {
  const { customers, devices, addCustomer, updateCustomer, deleteCustomer, hasPermission } =
    usePortalData();
  const canManage = hasPermission("Manage Customers");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");

  // Add / Edit Modal state
  const {
    isOpen: isFormModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
  } = useModal();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Modal state
  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
    });
    setFormErrors({});
    openFormModal();
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
      email: customer.email,
    });
    setFormErrors({});
    openFormModal();
  };

  const handleOpenDeleteModal = (customer: Customer) => {
    setCustomerToDelete(customer);
    openDeleteModal();
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Customer name is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.address.trim()) errors.address = "Address is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
    } else {
      addCustomer({
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
    }
    closeFormModal();
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter((cust) => {
    const query = searchTerm.toLowerCase();
    return (
      cust.name.toLowerCase().includes(query) ||
      cust.address.toLowerCase().includes(query) ||
      cust.phone.toLowerCase().includes(query) ||
      cust.email.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <PageMeta
        title="Customer Management | TeamZero Solutions"
        description="Manage TeamZero Solutions customers, contact information, and provisioned network devices."
      />
      <PageBreadCrumb pageTitle="Customers" />

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
            placeholder="Search customers by name, phone, email, or address..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white ps-10 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        {canManage && (
          <Button
            onClick={handleOpenAddModal}
            startIcon={<PlusIcon className="size-4" />}
            className="whitespace-nowrap"
          >
            Add Customer
          </Button>
        )}
      </div>

      {/* Stats Quick Badges */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <MultiUserIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Total Customers
              </span>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {customers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
              <ChipIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Connected Devices
              </span>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {devices.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400">
              <MapIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Active Service Zones
              </span>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {new Set(customers.map((c) => c.address.split(",").pop()?.trim())).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Customer Directory
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredCustomers.length} of {customers.length} customer records
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
                  Customer Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Address
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Phone
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Devices
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
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No customers found matching &quot;{searchTerm}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const customerDevices = devices.filter(
                    (d) => d.customerId === customer.id
                  );
                  return (
                    <TableRow
                      key={customer.id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                    >
                      {/* Name */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-semibold text-gray-900 dark:text-white">
                              {customer.name}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ID: {customer.id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Address */}
                      <TableCell className="px-6 py-4 text-start">
                        <div className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                          <MapIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                          <span className="max-w-xs">{customer.address}</span>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="px-6 py-4 text-start">
                        <div className="flex items-center gap-1.5">
                          <CallIcon className="size-4 shrink-0 text-gray-400" />
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                            {customer.phone}
                          </span>
                          <CopyButton textToCopy={customer.phone} />
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="px-6 py-4 text-start">
                        <div className="flex items-center gap-1.5">
                          <EnvelopeIcon className="size-4 shrink-0 text-gray-400" />
                          <a
                            href={`mailto:${customer.email}`}
                            className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {customer.email}
                          </a>
                          <CopyButton textToCopy={customer.email} />
                        </div>
                      </TableCell>

                      {/* Devices count */}
                      <TableCell className="px-6 py-4 text-center">
                        <Link
                          to={`/devices?customer=${encodeURIComponent(customer.id)}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                          title="View customer devices"
                        >
                          <ChipIcon className="size-3.5" />
                          <span>{customerDevices.length} devices</span>
                        </Link>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-6 py-4 text-end">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(customer)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                              title="Edit Customer"
                            >
                              <EditIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(customer)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-400"
                              title="Delete Customer"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            Read-only
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        className="max-w-lg p-6 sm:p-8"
      >
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <MultiUserIcon className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCustomer ? "Edit Customer Details" : "Add New Customer"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {editingCustomer
                  ? "Update client contact information in TeamZero directory"
                  : "Register a new client profile for network device management"}
              </p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cust-name">
                Customer Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="cust-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Apex Retail Group"
                error={Boolean(formErrors.name)}
                hint={formErrors.name}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cust-phone">
                  Phone Number <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="cust-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+880 1711-000000"
                  error={Boolean(formErrors.phone)}
                  hint={formErrors.phone}
                />
              </div>

              <div>
                <Label htmlFor="cust-email">
                  Email Address <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="contact@customer.com"
                  error={Boolean(formErrors.email)}
                  hint={formErrors.email}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cust-address">
                Office / Site Address <span className="text-error-500">*</span>
              </Label>
              <textarea
                id="cust-address"
                rows={3}
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Enter physical address, branch, or floor details..."
                className={`w-full rounded-xl border p-3 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 ${
                  formErrors.address
                    ? "border-error-500 focus:border-error-300 focus:ring-error-500/20"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700"
                }`}
              />
              {formErrors.address && (
                <p className="mt-1 text-xs text-error-500">{formErrors.address}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={closeFormModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {editingCustomer ? "Save Changes" : "Create Customer"}
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
        title="Delete Customer?"
        message="Deleting this customer will also permanently remove all their associated network devices from the portal."
        itemName={customerToDelete?.name}
      />
    </>
  );
};

export default CustomerPage;
