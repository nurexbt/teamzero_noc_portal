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
import {
  usePortalData,
} from "@/context/PortalDataContext";
import type {
  PortalRole,
  PortalUser,
} from "@/context/PortalDataContext";
import ConfirmDeleteModal from "@/components/teamzero/ConfirmDeleteModal";
import CopyButton from "@/components/teamzero/CopyButton";
import {
  EditIcon,
  EnvelopeIcon,
  KeyIcon,
  LockIcon,
  MultiUserIcon,
  PlusIcon,
  SearchIcon,
  TrashBinIcon,
  UserCircleIcon,
} from "@/icons";

const AVAILABLE_PERMISSIONS = [
  "Manage Customers",
  "View Customers",
  "Manage Devices",
  "View Devices",
  "View Passwords",
  "Launch Winbox/Telnet",
  "Manage NMS Portals",
  "Access NMS Portals",
  "User Management",
];

const UserManagerPage: React.FC = () => {
  const {
    users,
    roles,
    currentUser,
    hasPermission,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    addRole,
    updateRole,
    deleteRole,
  } = usePortalData();

  // Switcher: "users" | "roles"
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // ============ USER MODALS & STATE ============
  const {
    isOpen: isUserModalOpen,
    openModal: openUserModal,
    closeModal: closeUserModal,
  } = useModal();
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    roleId: roles[0]?.id || "",
    status: "active" as "active" | "inactive",
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});

  const {
    isOpen: isDeleteUserModalOpen,
    openModal: openDeleteUserModal,
    closeModal: closeDeleteUserModal,
  } = useModal();
  const [userToDelete, setUserToDelete] = useState<PortalUser | null>(null);

  // ============ ROLE MODALS & STATE ============
  const {
    isOpen: isRoleModalOpen,
    openModal: openRoleModal,
    closeModal: closeRoleModal,
  } = useModal();
  const [editingRole, setEditingRole] = useState<PortalRole | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [roleFormErrors, setRoleFormErrors] = useState<Record<string, string>>({});

  const {
    isOpen: isDeleteRoleModalOpen,
    openModal: openDeleteRoleModal,
    closeModal: closeDeleteRoleModal,
  } = useModal();
  const [roleToDelete, setRoleToDelete] = useState<PortalRole | null>(null);

  // User Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      roleId: roles[0]?.id || "",
      status: "active",
    });
    setUserFormErrors({});
    openUserModal();
  };

  const handleOpenEditUser = (user: PortalUser) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "",
      roleId: user.roleId,
      status: user.status,
    });
    setUserFormErrors({});
    openUserModal();
  };

  const handleOpenDeleteUser = (user: PortalUser) => {
    if (user.isSuperUser) return;
    setUserToDelete(user);
    openDeleteUserModal();
  };

  const handleConfirmDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const validateUserForm = () => {
    const errors: Record<string, string> = {};
    if (!userFormData.name.trim()) errors.name = "Full name is required";
    if (!userFormData.username.trim()) errors.username = "Username is required";
    if (!userFormData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!editingUser && !userFormData.password) {
      errors.password = "Initial password is required";
    }
    if (!userFormData.roleId) errors.roleId = "Role is required";
    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    const matchedRole = roles.find((r) => r.id === userFormData.roleId);
    const roleName = matchedRole ? matchedRole.name : "Custom";

    if (editingUser) {
      updateUser(editingUser.id, {
        name: userFormData.name.trim(),
        username: userFormData.username.trim(),
        email: userFormData.email.trim(),
        roleId: userFormData.roleId,
        roleName,
        status: userFormData.status,
      });
    } else {
      addUser({
        name: userFormData.name.trim(),
        username: userFormData.username.trim(),
        email: userFormData.email.trim(),
        roleId: userFormData.roleId,
        roleName,
        status: userFormData.status,
      });
    }
    closeUserModal();
  };

  // Role Handlers
  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleFormData({
      name: "",
      description: "",
      permissions: ["View Customers", "View Devices"],
    });
    setRoleFormErrors({});
    openRoleModal();
  };

  const handleOpenEditRole = (role: PortalRole) => {
    if (role.isSystem) return;
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
    setRoleFormErrors({});
    openRoleModal();
  };

  const handleOpenDeleteRole = (role: PortalRole) => {
    if (role.isSystem) return;
    setRoleToDelete(role);
    openDeleteRoleModal();
  };

  const handleConfirmDeleteRole = () => {
    if (roleToDelete) {
      deleteRole(roleToDelete.id);
      setRoleToDelete(null);
    }
  };

  const togglePermission = (perm: string) => {
    setRoleFormData((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm],
      };
    });
  };

  const validateRoleForm = () => {
    const errors: Record<string, string> = {};
    if (!roleFormData.name.trim()) errors.name = "Role name is required";
    if (!roleFormData.description.trim())
      errors.description = "Role description is required";
    if (roleFormData.permissions.length === 0)
      errors.permissions = "Select at least one permission";
    setRoleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRoleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRoleForm()) return;

    if (editingRole) {
      updateRole(editingRole.id, {
        name: roleFormData.name.trim(),
        description: roleFormData.description.trim(),
        permissions: roleFormData.permissions,
      });
    } else {
      addRole({
        name: roleFormData.name.trim(),
        description: roleFormData.description.trim(),
        permissions: roleFormData.permissions,
      });
    }
    closeRoleModal();
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roleName.toLowerCase().includes(q)
    );
  });

  // Filtered Roles
  const filteredRoles = roles.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.permissions.some((p) => p.toLowerCase().includes(q))
    );
  });

  if (!hasPermission("User Management")) {
    return (
      <>
        <PageMeta
          title="Access Restricted | TeamZero Solutions"
          description="User management restricted to authorized administrators."
        />
        <PageBreadCrumb pageTitle="User Manager" />
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
            <LockIcon className="size-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Access Restricted
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-gray-500 dark:text-gray-400">
            Your assigned role ({currentUser?.roleName || "Operator"}) does not have the <strong>User Management</strong> capability required to view or modify accounts and security roles.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="User Manager | TeamZero Solutions"
        description="Manage TeamZero Solutions portal users, authentication accounts, security roles, and permissions."
      />
      <PageBreadCrumb pageTitle="User Manager" />

      {/* Switcher & Action Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Switcher (Users / Role) */}
        <div className="inline-flex rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("users");
              setSearchQuery("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "users"
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <UserCircleIcon className="size-4" />
            <span>Users</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "users"
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("roles");
              setSearchQuery("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "roles"
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <LockIcon className="size-4" />
            <span>Role</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "roles"
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {roles.length}
            </span>
          </button>
        </div>

        {/* Right side: Search & Add button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
              <SearchIcon className="size-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "users"
                  ? "Search users, role, email..."
                  : "Search roles & permissions..."
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white ps-10 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {activeTab === "users" ? (
            <Button
              onClick={handleOpenAddUser}
              startIcon={<PlusIcon className="size-4" />}
              className="whitespace-nowrap"
            >
              Add User
            </Button>
          ) : (
            <Button
              onClick={handleOpenAddRole}
              startIcon={<PlusIcon className="size-4" />}
              className="whitespace-nowrap"
            >
              Add Role
            </Button>
          )}
        </div>
      </div>

      {/* ================= TABLE 1: USERS TABLE ================= */}
      {activeTab === "users" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              User Accounts Directory
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Authorized team members and portal operator logins
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
                    User Name
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
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Assigned Role
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Last Active
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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No user accounts found matching &quot;{searchQuery}&quot;
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                    >
                      {/* Name with initials avatar */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Username */}
                      <TableCell className="px-6 py-4 text-start font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                        <div className="flex items-center gap-1.5">
                          <span>@{user.username}</span>
                          <CopyButton textToCopy={user.username} />
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="px-6 py-4 text-start">
                        <div className="flex items-center gap-1.5">
                          <EnvelopeIcon className="size-4 shrink-0 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>

                      {/* Role badge */}
                      <TableCell className="px-6 py-4 text-start">
                        {user.isSuperUser ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                            <KeyIcon className="size-3 text-brand-600" />
                            <span>{user.roleName}</span>
                            <span className="rounded bg-brand-200/60 px-1 py-0.5 text-[9px] font-extrabold uppercase text-brand-800 dark:bg-brand-500/30 dark:text-brand-200">
                              Root
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <KeyIcon className="size-3 text-gray-500" />
                            {user.roleName}
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-6 py-4 text-start">
                        {user.isSuperUser ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-400 cursor-default"
                            title="Root Super Admin account cannot be deactivated"
                          >
                            <span className="size-1.5 rounded-full bg-success-500"></span>
                            <span className="capitalize">Active (Locked)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              user.status === "active"
                                ? "bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                            title="Click to toggle status"
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                user.status === "active"
                                  ? "bg-success-500 animate-pulse"
                                  : "bg-gray-400"
                              }`}
                            ></span>
                            <span className="capitalize">{user.status}</span>
                          </button>
                        )}
                      </TableCell>

                      {/* Last Active */}
                      <TableCell className="px-6 py-4 text-start text-xs text-gray-500 dark:text-gray-400">
                        {user.lastActive}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(user)}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                            title="Edit User"
                          >
                            <EditIcon className="size-4" />
                          </button>
                          {user.isSuperUser ? (
                            <span
                              className="inline-flex size-8 items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              title="Protected: Super Admin account cannot be deleted"
                            >
                              <LockIcon className="size-4" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteUser(user)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-400"
                              title="Delete User"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
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
      )}

      {/* ================= TABLE 2: ROLE TABLE ================= */}
      {activeTab === "roles" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              System Roles &amp; Permissions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Access control roles for customers, devices, credentials, and monitoring
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
                    Role Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Description
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Permissions &amp; Capabilities
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Users
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
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No roles found matching &quot;{searchQuery}&quot;
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => {
                    const assignedUsersCount = users.filter(
                      (u) => u.roleId === role.id
                    ).length;

                    return (
                      <TableRow
                        key={role.id}
                        className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                      >
                        {/* Role Name */}
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                                role.isSystem
                                  ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400"
                                  : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                              }`}
                            >
                              <LockIcon className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="block font-semibold text-gray-900 dark:text-white">
                                  {role.name}
                                </span>
                                {role.isSystem && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-warning-50 px-2 py-0.5 text-[10px] font-bold uppercase text-warning-700 dark:bg-warning-500/15 dark:text-orange-300">
                                    Read-only System Role
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                ID: {role.id}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Description */}
                        <TableCell className="px-6 py-4 text-start">
                          <p className="max-w-xs text-xs text-gray-600 dark:text-gray-300">
                            {role.description}
                          </p>
                        </TableCell>

                        {/* Permissions Tags */}
                        <TableCell className="px-6 py-4 text-start">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {role.permissions.map((perm) => (
                              <span
                                key={perm}
                                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        {/* Users count badge */}
                        <TableCell className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-light-50 px-2.5 py-1 text-xs font-semibold text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400">
                            <MultiUserIcon className="size-3.5" />
                            {assignedUsersCount} users
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-6 py-4 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            {role.isSystem ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
                                title="System Super Admin role is read-only and permanent"
                              >
                                <LockIcon className="size-3" />
                                Protected
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRole(role)}
                                  className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                                  title="Edit Role"
                                >
                                  <EditIcon className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteRole(role)}
                                  className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-400"
                                  title="Delete Role"
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
      )}

      {/* ================= USER FORM MODAL ================= */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        className="max-w-lg p-6 sm:p-8"
      >
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <UserCircleIcon className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? "Edit User Account" : "Add New User Account"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure operator credentials and access level
              </p>
            </div>
          </div>

          <form onSubmit={handleUserFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="usr-name">
                Full Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="usr-name"
                type="text"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Musharof Chowdhury"
                error={Boolean(userFormErrors.name)}
                hint={userFormErrors.name}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="usr-username">
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="usr-username"
                  type="text"
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="e.g. musharof_noc"
                  error={Boolean(userFormErrors.username)}
                  hint={userFormErrors.username}
                />
              </div>

              <div>
                <Label htmlFor="usr-email">
                  Email Address <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="usr-email"
                  type="email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="admin@teamzero.solutions"
                  error={Boolean(userFormErrors.email)}
                  hint={userFormErrors.email}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="usr-password">
                {editingUser
                  ? "Reset Password (leave empty to keep current)"
                  : "Password *"}
              </Label>
              <Input
                id="usr-password"
                type="password"
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder={
                  editingUser
                    ? "Enter new password to reset"
                    : "Enter account password"
                }
                error={Boolean(userFormErrors.password)}
                hint={userFormErrors.password}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="usr-role">
                  Assigned Role <span className="text-error-500">*</span>
                </Label>
                {editingUser?.isSuperUser ? (
                  <div>
                    <div className="flex h-11 items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <LockIcon className="size-3.5 text-brand-500" />
                        Super Admin
                      </span>
                      <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                        Permanent
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Root Super Admin role cannot be demoted or changed.
                    </p>
                  </div>
                ) : (
                  <select
                    id="usr-role"
                    value={userFormData.roleId}
                    onChange={(e) =>
                      setUserFormData((prev) => ({
                        ...prev,
                        roleId: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
                {userFormErrors.roleId && (
                  <p className="mt-1 text-xs text-error-500">
                    {userFormErrors.roleId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="usr-status">Account Status</Label>
                {editingUser?.isSuperUser ? (
                  <div>
                    <div className="flex h-11 items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      <span className="flex items-center gap-1.5 text-success-600 dark:text-success-400">
                        <span className="size-2 rounded-full bg-success-500"></span>
                        Active
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Locked</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Root account cannot be deactivated.
                    </p>
                  </div>
                ) : (
                  <select
                    id="usr-status"
                    value={userFormData.status}
                    onChange={(e) =>
                      setUserFormData((prev) => ({
                        ...prev,
                        status: e.target.value as "active" | "inactive",
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={closeUserModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {editingUser ? "Save Changes" : "Create User"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDeleteModal
        isOpen={isDeleteUserModalOpen}
        onClose={closeDeleteUserModal}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User Account?"
        message="This user will immediately lose access to the TeamZero Solutions NOC Portal."
        itemName={
          userToDelete ? `${userToDelete.name} (@${userToDelete.username})` : undefined
        }
      />

      {/* ================= ROLE FORM MODAL ================= */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={closeRoleModal}
        className="max-w-lg p-6 sm:p-8"
      >
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <LockIcon className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRole ? "Edit Role & Permissions" : "Add Security Role"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Define role name, description, and operational capabilities
              </p>
            </div>
          </div>

          <form onSubmit={handleRoleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="role-name">
                Role Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="role-name"
                type="text"
                value={roleFormData.name}
                onChange={(e) =>
                  setRoleFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. NOC Supervisor, Senior Engineer"
                error={Boolean(roleFormErrors.name)}
                hint={roleFormErrors.name}
              />
            </div>

            <div>
              <Label htmlFor="role-desc">
                Role Description <span className="text-error-500">*</span>
              </Label>
              <textarea
                id="role-desc"
                rows={2}
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief summary of what this role is authorized to perform..."
                className="w-full rounded-xl border border-gray-300 p-3 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {roleFormErrors.description && (
                <p className="mt-1 text-xs text-error-500">
                  {roleFormErrors.description}
                </p>
              )}
            </div>

            <div>
              <Label>
                Permissions <span className="text-error-500">*</span>
              </Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = roleFormData.permissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-xs transition ${
                        isChecked
                          ? "border-brand-500 bg-brand-50/50 font-semibold text-brand-700 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-300"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>{perm}</span>
                    </label>
                  );
                })}
              </div>
              {roleFormErrors.permissions && (
                <p className="mt-1 text-xs text-error-500">
                  {roleFormErrors.permissions}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={closeRoleModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Role Confirmation */}
      <ConfirmDeleteModal
        isOpen={isDeleteRoleModalOpen}
        onClose={closeDeleteRoleModal}
        onConfirm={handleConfirmDeleteRole}
        title="Delete Role?"
        message="Any user assigned to this role may lose access to portal functions."
        itemName={roleToDelete?.name}
      />
    </>
  );
};

export default UserManagerPage;
