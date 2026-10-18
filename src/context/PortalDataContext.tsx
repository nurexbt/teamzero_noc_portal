import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type LoginMethod = "winbox" | "telnet" | "web" | "web_ssl";

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface CustomerDevice {
  id: string;
  customerId: string;
  customerName: string;
  deviceName: string;
  deviceIp: string;
  username: string;
  password: string;
  loginMethod: LoginMethod;
  notes?: string;
  createdAt: string;
}

export interface NmsPortal {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  category?: string;
  status?: "online" | "warning" | "offline";
  createdAt: string;
}

export interface PortalRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean; // Super Admin role is protected and read-only
  createdAt: string;
}

export interface PortalUser {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  roleId: string;
  roleName: string;
  status: "active" | "inactive";
  lastActive: string;
  mustChangePassword?: boolean;
  isSuperUser?: boolean; // Primary super admin cannot be deleted or demoted
  createdAt: string;
}

interface PortalDataContextType {
  customers: Customer[];
  devices: CustomerDevice[];
  nmsPortals: NmsPortal[];
  users: PortalUser[];
  roles: PortalRole[];
  currentUser: PortalUser | null;
  dbConnected: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; mustChangePassword?: boolean }>;
  logout: () => void;
  changePassword: (userId: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  hasPermission: (permission: string) => boolean;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, customer: Partial<Omit<Customer, "id" | "createdAt">>) => void;
  deleteCustomer: (id: string) => void;
  addDevice: (device: Omit<CustomerDevice, "id" | "createdAt">) => CustomerDevice;
  updateDevice: (id: string, device: Partial<Omit<CustomerDevice, "id" | "createdAt">>) => void;
  deleteDevice: (id: string) => void;
  addNmsPortal: (portal: Omit<NmsPortal, "id" | "createdAt">) => NmsPortal;
  updateNmsPortal: (id: string, portal: Partial<Omit<NmsPortal, "id" | "createdAt">>) => void;
  deleteNmsPortal: (id: string) => void;
  addUser: (user: Omit<PortalUser, "id" | "createdAt" | "lastActive">) => PortalUser;
  updateUser: (id: string, user: Partial<Omit<PortalUser, "id" | "createdAt">>) => void;
  deleteUser: (id: string) => boolean;
  toggleUserStatus: (id: string) => void;
  addRole: (role: Omit<PortalRole, "id" | "createdAt">) => PortalRole;
  updateRole: (id: string, role: Partial<Omit<PortalRole, "id" | "createdAt">>) => boolean;
  deleteRole: (id: string) => boolean;
  resetToDefaults: () => void;
  refreshFromDatabase: () => Promise<void>;
}

const defaultCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Apex Retail Group",
    address: "House 42, Road 11, Banani, Dhaka-1213",
    phone: "+880 1711-234567",
    email: "noc@apexretail.com",
    createdAt: "2025-01-15 10:00:00",
  },
  {
    id: "cust-2",
    name: "Metro Fiber Net",
    address: "Plot 15, Sector 4, Uttara Commercial Area, Dhaka",
    phone: "+880 1819-876543",
    email: "admin@metrofiber.net",
    createdAt: "2025-02-01 11:30:00",
  },
  {
    id: "cust-3",
    name: "CloudTech Enterprise Hub",
    address: "Level 8, Concord Tower, Gulshan-2, Dhaka",
    phone: "+880 1912-345678",
    email: "sysadmin@cloudtech.com.bd",
    createdAt: "2025-02-18 09:15:00",
  },
  {
    id: "cust-4",
    name: "Horizon Logistics Ltd",
    address: "EPZ Road, South Port Zone, Chittagong",
    phone: "+880 1610-998877",
    email: "it-support@horizonlogistics.com",
    createdAt: "2025-03-05 14:20:00",
  },
];

const defaultDevices: CustomerDevice[] = [
  {
    id: "dev-1",
    customerId: "cust-1",
    customerName: "Apex Retail Group",
    deviceName: "Router1",
    deviceIp: "10.0.0.1:8291",
    username: "admin",
    password: "P@ssw0rd!Router1",
    loginMethod: "winbox",
    notes: "Main Gateway Mikrotik CCR1009 - Office Uplink",
    createdAt: "2025-01-16 12:00:00",
  },
  {
    id: "dev-2",
    customerId: "cust-2",
    customerName: "Metro Fiber Net",
    deviceName: "Core-CCR2004",
    deviceIp: "192.168.10.1:8291",
    username: "noc_team",
    password: "M3tro#CCR2024!",
    loginMethod: "winbox",
    notes: "Core BGP Router - Dual 10G SFP+ Uplink",
    createdAt: "2025-02-02 10:15:00",
  },
  {
    id: "dev-3",
    customerId: "cust-3",
    customerName: "CloudTech Enterprise Hub",
    deviceName: "Edge-Gateway-01",
    deviceIp: "172.16.20.1:443",
    username: "admin",
    password: "Cloud#GatewaySecure2024",
    loginMethod: "web_ssl",
    notes: "FortiGate 100F HA Cluster Web GUI",
    createdAt: "2025-02-20 16:45:00",
  },
  {
    id: "dev-4",
    customerId: "cust-4",
    customerName: "Horizon Logistics Ltd",
    deviceName: "Distribution-Switch",
    deviceIp: "192.168.1.254:80",
    username: "operator",
    password: "Switch$Horizon88",
    loginMethod: "web",
    notes: "Cisco Catalyst 3850 PoE Switch Web UI",
    createdAt: "2025-03-06 08:30:00",
  },
  {
    id: "dev-5",
    customerId: "cust-2",
    customerName: "Metro Fiber Net",
    deviceName: "Access-Switch-L2",
    deviceIp: "10.50.100.2:23",
    username: "cisco",
    password: "Telnet#Console99",
    loginMethod: "telnet",
    notes: "Edge Distribution Telnet CLI Access",
    createdAt: "2025-03-10 11:00:00",
  },
];

const defaultNmsPortals: NmsPortal[] = [
  {
    id: "nms-1",
    name: "Zabbix NOC Monitor",
    url: "http://10.0.0.250:8080",
    username: "Admin",
    password: "zabbix_teamzero_2024",
    category: "Infrastructure Monitoring",
    status: "online",
    createdAt: "2025-01-10 08:00:00",
  },
  {
    id: "nms-2",
    name: "LibreNMS Enterprise Core",
    url: "https://nms.teamzero.solutions",
    username: "nocadmin",
    password: "LibreNMS#P0rtal2024",
    category: "SNMP & Traffic Graphs",
    status: "online",
    createdAt: "2025-01-12 09:30:00",
  },
  {
    id: "nms-3",
    name: "Mikrotik The Dude Server",
    url: "http://192.168.10.250:8291",
    username: "admin",
    password: "DudeServerPass99!",
    category: "RouterOS Topology",
    status: "online",
    createdAt: "2025-02-05 14:00:00",
  },
  {
    id: "nms-4",
    name: "Grafana NOC Telemetry",
    url: "http://10.0.0.251:3000",
    username: "viewer_noc",
    password: "Grafana#TeamZero!",
    category: "Real-time Metrics",
    status: "online",
    createdAt: "2025-02-15 15:20:00",
  },
];

const defaultRoles: PortalRole[] = [
  {
    id: "role-super-admin",
    name: "Super Admin",
    description: "System Root Administrator. Full unrestricted access to all customers, devices, Winbox credentials, NMS portals, roles, and users.",
    permissions: [
      "Manage Customers",
      "View Customers",
      "Manage Devices",
      "View Devices",
      "View Passwords",
      "Launch Winbox/Telnet",
      "Manage NMS Portals",
      "Access NMS Portals",
      "User Management",
    ],
    isSystem: true,
    createdAt: "2025-01-01 00:00:00",
  },
  {
    id: "role-noc",
    name: "NOC Engineer",
    description: "Operational engineering access for device maintenance, Winbox protocol launch, and NMS telemetry analysis.",
    permissions: [
      "View Customers",
      "Manage Devices",
      "View Passwords",
      "Launch Winbox/Telnet",
      "Access NMS Portals",
    ],
    isSystem: false,
    createdAt: "2025-01-05 00:00:00",
  },
  {
    id: "role-operator",
    name: "Network Operator",
    description: "Read-only monitoring access to client directories, ping status, and telemetry dashboards.",
    permissions: [
      "View Customers",
      "View Devices",
      "Access NMS Portals",
    ],
    isSystem: false,
    createdAt: "2025-01-10 00:00:00",
  },
];

const defaultUsers: PortalUser[] = [
  {
    id: "usr-admin",
    name: "Super Administrator",
    username: "admin",
    email: "admin@teamzero.solutions",
    password: "admin",
    roleId: "role-super-admin",
    roleName: "Super Admin",
    status: "active",
    lastActive: "Just now",
    mustChangePassword: true,
    isSuperUser: true,
    createdAt: "2025-01-01 00:00:00",
  },
  {
    id: "usr-2",
    name: "Fahim Rahman",
    username: "fahim_noc",
    email: "fahim@teamzero.solutions",
    password: "password123",
    roleId: "role-noc",
    roleName: "NOC Engineer",
    status: "active",
    lastActive: "15 mins ago",
    mustChangePassword: false,
    createdAt: "2025-01-15 11:00:00",
  },
  {
    id: "usr-3",
    name: "Sabbir Hossain",
    username: "sabbir_net",
    email: "sabbir@teamzero.solutions",
    password: "password123",
    roleId: "role-operator",
    roleName: "Network Operator",
    status: "active",
    lastActive: "2 hours ago",
    mustChangePassword: false,
    createdAt: "2025-02-01 09:30:00",
  },
];

const STORAGE_KEYS = {
  CUSTOMERS: "teamzero_portal_customers_v1",
  DEVICES: "teamzero_portal_devices_v1",
  NMS: "teamzero_portal_nms_v1",
  USERS: "teamzero_portal_users_v3",
  ROLES: "teamzero_portal_roles_v3",
  CURRENT_USER: "teamzero_current_user_v3",
};

const PortalDataContext = createContext<PortalDataContextType | undefined>(undefined);

export const PortalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load customers from cache", e);
    }
    return defaultCustomers;
  });

  const [devices, setDevices] = useState<CustomerDevice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEVICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load devices from cache", e);
    }
    return defaultDevices;
  });

  const [nmsPortals, setNmsPortals] = useState<NmsPortal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load NMS portals from cache", e);
    }
    return defaultNmsPortals;
  });

  const [roles, setRoles] = useState<PortalRole[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load roles from cache", e);
    }
    return defaultRoles;
  });

  const [users, setUsers] = useState<PortalUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load users from cache", e);
    }
    return defaultUsers;
  });

  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load current user", e);
    }
    return defaultUsers[0];
  });

  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all initial data from MySQL database
  const refreshFromDatabase = useCallback(async () => {
    try {
      setLoading(true);
      const [custRes, devRes, nmsRes, rolesRes, usersRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/devices"),
        fetch("/api/nms"),
        fetch("/api/roles"),
        fetch("/api/users"),
      ]);

      if (custRes.ok) {
        const custData = await custRes.json();
        if (Array.isArray(custData)) {
          setCustomers(custData);
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(custData));
        }
      }

      if (devRes.ok) {
        const devData = await devRes.json();
        if (Array.isArray(devData)) {
          setDevices(devData);
          localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devData));
        }
      }

      if (nmsRes.ok) {
        const nmsData = await nmsRes.json();
        if (Array.isArray(nmsData)) {
          setNmsPortals(nmsData);
          localStorage.setItem(STORAGE_KEYS.NMS, JSON.stringify(nmsData));
        }
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        if (Array.isArray(rolesData)) {
          setRoles(rolesData);
          localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(rolesData));
        }
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) {
          setUsers(usersData);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersData));

          // Also update currentUser with fresh DB state if logged in
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const updated = usersData.find((u: PortalUser) => u.id === prev.id);
            if (updated) {
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      }

      setDbConnected(true);
    } catch (err) {
      console.warn("MySQL backend unreachable, operating with cached data:", err);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDatabase();
  }, [refreshFromDatabase]);

  // Auth Functions
  const login = async (usernameInput: string, passwordInput: string) => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || "Invalid username or password" };
      }

      const activeUser: PortalUser = data.user;
      setCurrentUser(activeUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(activeUser));
      setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? activeUser : u)));

      return {
        success: true,
        mustChangePassword: Boolean(data.mustChangePassword),
      };
    } catch (err) {
      console.warn("Backend auth failed, fallback to local:", err);

      const found = users.find(
        (u) =>
          (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
          (u.password === cleanPass || (!u.password && cleanPass === "admin"))
      );

      if (!found) {
        return { success: false, message: "Invalid username or password" };
      }

      if (found.status === "inactive") {
        return { success: false, message: "This account has been deactivated. Contact an administrator." };
      }

      const updatedUser = {
        ...found,
        lastActive: "Just now",
      };

      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

      return {
        success: true,
        mustChangePassword: Boolean(found.mustChangePassword),
      };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const changePassword = async (userId: string, newPass: string) => {
    if (!newPass.trim() || newPass.length < 4) {
      return { success: false, message: "Password must be at least 4 characters long." };
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: newPass.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || "Failed to update password." };
      }
    } catch (err) {
      console.error("API error during change password:", err);
    }

    // Update state locally
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, password: newPass.trim(), mustChangePassword: false }
          : u
      )
    );

    if (currentUser && currentUser.id === userId) {
      const updated = { ...currentUser, password: newPass.trim(), mustChangePassword: false };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    }

    return { success: true };
  };

  // Permission Check
  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.isSuperUser || currentUser.roleName === "Super Admin" || currentUser.roleId === "role-super-admin") {
      return true;
    }
    const userRole = roles.find((r) => r.id === currentUser.roleId);
    if (!userRole) return false;
    return userRole.permissions.includes(permission);
  };

  // Customers CRUD
  const addCustomer = (customerData: Omit<Customer, "id" | "createdAt">): Customer => {
    const tempId = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...customerData,
      id: tempId,
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    })
      .then((res) => res.json())
      .then((saved) => {
        if (saved && saved.id) {
          setCustomers((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: saved.id, createdAt: saved.createdAt } : c))
          );
        }
      })
      .catch((err) => console.error("Error saving customer to MySQL:", err));

    return newCustomer;
  };

  const updateCustomer = (id: string, customerData: Partial<Omit<Customer, "id" | "createdAt">>) => {
    setCustomers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...customerData } : item))
    );

    if (customerData.name) {
      setDevices((prev) =>
        prev.map((dev) =>
          dev.customerId === id ? { ...dev, customerName: customerData.name! } : dev
        )
      );
    }

    fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    }).catch((err) => console.error("Error updating customer in MySQL:", err));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((item) => item.id !== id));
    setDevices((prev) => prev.filter((dev) => dev.customerId !== id));

    fetch(`/api/customers/${id}`, {
      method: "DELETE",
    }).catch((err) => console.error("Error deleting customer from MySQL:", err));
  };

  // Devices CRUD
  const addDevice = (deviceData: Omit<CustomerDevice, "id" | "createdAt">): CustomerDevice => {
    const tempId = `dev-${Date.now()}`;
    const newDevice: CustomerDevice = {
      ...deviceData,
      id: tempId,
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    setDevices((prev) => [newDevice, ...prev]);

    fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceData),
    })
      .then((res) => res.json())
      .then((saved) => {
        if (saved && saved.id) {
          setDevices((prev) =>
            prev.map((d) => (d.id === tempId ? { ...d, id: saved.id, createdAt: saved.createdAt } : d))
          );
        }
      })
      .catch((err) => console.error("Error saving device to MySQL:", err));

    return newDevice;
  };

  const updateDevice = (id: string, deviceData: Partial<Omit<CustomerDevice, "id" | "createdAt">>) => {
    setDevices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...deviceData } : item))
    );

    fetch(`/api/devices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceData),
    }).catch((err) => console.error("Error updating device in MySQL:", err));
  };

  const deleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((item) => item.id !== id));

    fetch(`/api/devices/${id}`, {
      method: "DELETE",
    }).catch((err) => console.error("Error deleting device from MySQL:", err));
  };

  // NMS Portals CRUD
  const addNmsPortal = (portalData: Omit<NmsPortal, "id" | "createdAt">): NmsPortal => {
    const tempId = `nms-${Date.now()}`;
    const newPortal: NmsPortal = {
      ...portalData,
      id: tempId,
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    setNmsPortals((prev) => [newPortal, ...prev]);

    fetch("/api/nms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(portalData),
    })
      .then((res) => res.json())
      .then((saved) => {
        if (saved && saved.id) {
          setNmsPortals((prev) =>
            prev.map((p) => (p.id === tempId ? { ...p, id: saved.id, createdAt: saved.createdAt } : p))
          );
        }
      })
      .catch((err) => console.error("Error saving NMS portal to MySQL:", err));

    return newPortal;
  };

  const updateNmsPortal = (id: string, portalData: Partial<Omit<NmsPortal, "id" | "createdAt">>) => {
    setNmsPortals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...portalData } : item))
    );

    fetch(`/api/nms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(portalData),
    }).catch((err) => console.error("Error updating NMS portal in MySQL:", err));
  };

  const deleteNmsPortal = (id: string) => {
    setNmsPortals((prev) => prev.filter((item) => item.id !== id));

    fetch(`/api/nms/${id}`, {
      method: "DELETE",
    }).catch((err) => console.error("Error deleting NMS portal from MySQL:", err));
  };

  // Users CRUD
  const addUser = (userData: Omit<PortalUser, "id" | "createdAt" | "lastActive">): PortalUser => {
    const tempId = `usr-${Date.now()}`;
    const newUser: PortalUser = {
      ...userData,
      id: tempId,
      lastActive: "Just now",
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    setUsers((prev) => [newUser, ...prev]);

    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
      .then((res) => res.json())
      .then((saved) => {
        if (saved && saved.id) {
          setUsers((prev) =>
            prev.map((u) => (u.id === tempId ? { ...u, id: saved.id, createdAt: saved.createdAt } : u))
          );
        }
      })
      .catch((err) => console.error("Error saving user to MySQL:", err));

    return newUser;
  };

  const updateUser = (id: string, userData: Partial<Omit<PortalUser, "id" | "createdAt">>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          if (u.isSuperUser) {
            return {
              ...u,
              ...userData,
              roleId: "role-super-admin",
              roleName: "Super Admin",
            };
          }
          return { ...u, ...userData };
        }
        return u;
      })
    );

    if (currentUser && currentUser.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...userData } : null));
    }

    fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    }).catch((err) => console.error("Error updating user in MySQL:", err));
  };

  const deleteUser = (id: string): boolean => {
    const target = users.find((u) => u.id === id);
    if (target?.isSuperUser) {
      return false;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));

    fetch(`/api/users/${id}`, {
      method: "DELETE",
    }).catch((err) => console.error("Error deleting user from MySQL:", err));

    return true;
  };

  const toggleUserStatus = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target?.isSuperUser) {
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );

    fetch(`/api/users/${id}/status`, {
      method: "PATCH",
    }).catch((err) => console.error("Error toggling user status in MySQL:", err));
  };

  // Roles CRUD
  const addRole = (roleData: Omit<PortalRole, "id" | "createdAt">): PortalRole => {
    const tempId = `role-${Date.now()}`;
    const newRole: PortalRole = {
      ...roleData,
      id: tempId,
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    setRoles((prev) => [...prev, newRole]);

    fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleData),
    })
      .then((res) => res.json())
      .then((saved) => {
        if (saved && saved.id) {
          setRoles((prev) =>
            prev.map((r) => (r.id === tempId ? { ...r, id: saved.id, createdAt: saved.createdAt } : r))
          );
        }
      })
      .catch((err) => console.error("Error saving role to MySQL:", err));

    return newRole;
  };

  const updateRole = (id: string, roleData: Partial<Omit<PortalRole, "id" | "createdAt">>): boolean => {
    const target = roles.find((r) => r.id === id);
    if (target?.isSystem) {
      return false;
    }

    setRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...roleData } : r))
    );

    if (roleData.name) {
      setUsers((prev) =>
        prev.map((u) => (u.roleId === id ? { ...u, roleName: roleData.name! } : u))
      );
    }

    fetch(`/api/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleData),
    }).catch((err) => console.error("Error updating role in MySQL:", err));

    return true;
  };

  const deleteRole = (id: string): boolean => {
    const target = roles.find((r) => r.id === id);
    if (target?.isSystem) {
      return false;
    }

    setRoles((prev) => prev.filter((r) => r.id !== id));

    fetch(`/api/roles/${id}`, {
      method: "DELETE",
    }).catch((err) => console.error("Error deleting role from MySQL:", err));

    return true;
  };

  const resetToDefaults = () => {
    setCustomers(defaultCustomers);
    setDevices(defaultDevices);
    setNmsPortals(defaultNmsPortals);
    setRoles(defaultRoles);
    setUsers(defaultUsers);
    setCurrentUser(defaultUsers[0]);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.DEVICES);
    localStorage.removeItem(STORAGE_KEYS.NMS);
    localStorage.removeItem(STORAGE_KEYS.ROLES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  return (
    <PortalDataContext.Provider
      value={{
        customers,
        devices,
        nmsPortals,
        users,
        roles,
        currentUser,
        dbConnected,
        loading,
        login,
        logout,
        changePassword,
        hasPermission,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addDevice,
        updateDevice,
        deleteDevice,
        addNmsPortal,
        updateNmsPortal,
        deleteNmsPortal,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addRole,
        updateRole,
        deleteRole,
        resetToDefaults,
        refreshFromDatabase,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  );
};

export const usePortalData = () => {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error("usePortalData must be used within a PortalDataProvider");
  }
  return context;
};
