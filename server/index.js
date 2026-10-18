import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import pool, { testConnection } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ================= HEALTH CHECK =================
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as is_alive");
    res.json({
      status: "ok",
      database: "MySQL",
      dbName: process.env.DB_NAME || "teamzero_portal",
      connected: rows.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ================= AUTH ROUTES =================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
      [cleanUser, cleanUser]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const user = rows[0];

    // Password validation (plain match for portal demo, supports default admin)
    const valid = user.password === cleanPass || (!user.password && cleanPass === "admin");
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Contact an administrator.",
      });
    }

    // Update last active in MySQL
    await pool.query("UPDATE users SET last_active = 'Just now' WHERE id = ?", [user.id]);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name,
        status: user.status,
        lastActive: "Just now",
        mustChangePassword: Boolean(user.must_change_password),
        isSuperUser: Boolean(user.is_super_user),
        createdAt: user.created_at,
      },
      mustChangePassword: Boolean(user.must_change_password),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/change-password", async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long.",
      });
    }

    const [result] = await pool.query(
      "UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?",
      [newPassword.trim(), userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= CUSTOMERS ROUTES =================
app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM customers ORDER BY created_at DESC");
    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      phone: r.phone,
      email: r.email,
      createdAt: r.created_at,
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;
    const id = `cust-${Date.now()}`;
    const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      "INSERT INTO customers (id, name, address, phone, email, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, address, phone, email, createdAt]
    );

    res.status(201).json({ id, name, address, phone, email, createdAt });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email } = req.body;

    await pool.query(
      "UPDATE customers SET name = COALESCE(?, name), address = COALESCE(?, address), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?",
      [name, address, phone, email, id]
    );

    if (name) {
      // Sync customer_name in customer_devices table
      await pool.query(
        "UPDATE customer_devices SET customer_name = ? WHERE customer_id = ?",
        [name, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM customer_devices WHERE customer_id = ?", [id]);
    await pool.query("DELETE FROM customers WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= CUSTOMER DEVICES ROUTES =================
app.get("/api/devices", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM customer_devices ORDER BY created_at DESC");
    const formatted = rows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      deviceName: r.device_name,
      deviceIp: r.device_ip,
      username: r.username,
      password: r.password,
      loginMethod: r.login_method,
      notes: r.notes || "",
      createdAt: r.created_at,
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Get devices error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/devices", async (req, res) => {
  try {
    const { customerId, customerName, deviceName, deviceIp, username, password, loginMethod, notes } = req.body;
    const id = `dev-${Date.now()}`;
    const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      `INSERT INTO customer_devices 
      (id, customer_id, customer_name, device_name, device_ip, username, password, login_method, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, customerId, customerName, deviceName, deviceIp, username, password, loginMethod || "winbox", notes || "", createdAt]
    );

    res.status(201).json({
      id,
      customerId,
      customerName,
      deviceName,
      deviceIp,
      username,
      password,
      loginMethod,
      notes,
      createdAt,
    });
  } catch (error) {
    console.error("Create device error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, customerName, deviceName, deviceIp, username, password, loginMethod, notes } = req.body;

    await pool.query(
      `UPDATE customer_devices SET 
        customer_id = COALESCE(?, customer_id),
        customer_name = COALESCE(?, customer_name),
        device_name = COALESCE(?, device_name),
        device_ip = COALESCE(?, device_ip),
        username = COALESCE(?, username),
        password = COALESCE(?, password),
        login_method = COALESCE(?, login_method),
        notes = COALESCE(?, notes)
      WHERE id = ?`,
      [customerId, customerName, deviceName, deviceIp, username, password, loginMethod, notes, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Update device error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM customer_devices WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete device error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= NMS PORTALS ROUTES =================
app.get("/api/nms", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM nms_portals ORDER BY created_at DESC");
    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      username: r.username,
      password: r.password,
      category: r.category,
      status: r.status,
      createdAt: r.created_at,
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Get NMS portals error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/nms", async (req, res) => {
  try {
    const { name, url, username, password, category, status } = req.body;
    const id = `nms-${Date.now()}`;
    const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      `INSERT INTO nms_portals (id, name, url, username, password, category, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, url, username, password, category || "Monitoring & Analytics", status || "online", createdAt]
    );

    res.status(201).json({ id, name, url, username, password, category, status: status || "online", createdAt });
  } catch (error) {
    console.error("Create NMS portal error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/nms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, username, password, category, status } = req.body;

    await pool.query(
      `UPDATE nms_portals SET 
        name = COALESCE(?, name),
        url = COALESCE(?, url),
        username = COALESCE(?, username),
        password = COALESCE(?, password),
        category = COALESCE(?, category),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [name, url, username, password, category, status, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Update NMS portal error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/nms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM nms_portals WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete NMS portal error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= ROLES ROUTES =================
app.get("/api/roles", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM roles ORDER BY created_at ASC");
    const formatted = rows.map((r) => {
      let perms = [];
      try {
        perms = typeof r.permissions === "string" ? JSON.parse(r.permissions) : r.permissions;
      } catch {
        perms = [];
      }
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: Array.isArray(perms) ? perms : [],
        isSystem: Boolean(r.is_system),
        createdAt: r.created_at,
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/roles", async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const id = `role-${Date.now()}`;
    const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      "INSERT INTO roles (id, name, description, permissions, is_system, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, description, JSON.stringify(permissions || []), 0, createdAt]
    );

    res.status(201).json({
      id,
      name,
      description,
      permissions: permissions || [],
      isSystem: false,
      createdAt,
    });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/roles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Check if role is system/super admin
    const [rows] = await pool.query("SELECT is_system FROM roles WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Role not found" });
    if (rows[0].is_system) {
      return res.status(403).json({ error: "System Super Admin role cannot be modified" });
    }

    await pool.query(
      `UPDATE roles SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        permissions = COALESCE(?, permissions)
      WHERE id = ?`,
      [name, description, permissions ? JSON.stringify(permissions) : null, id]
    );

    if (name) {
      await pool.query("UPDATE users SET role_name = ? WHERE role_id = ?", [name, id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/roles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT is_system FROM roles WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Role not found" });
    if (rows[0].is_system) {
      return res.status(403).json({ error: "System Super Admin role cannot be deleted" });
    }

    await pool.query("DELETE FROM roles WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= USERS ROUTES =================
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name,
      username: r.username,
      email: r.email,
      roleId: r.role_id,
      roleName: r.role_name,
      status: r.status,
      lastActive: r.last_active,
      mustChangePassword: Boolean(r.must_change_password),
      isSuperUser: Boolean(r.is_super_user),
      createdAt: r.created_at,
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, username, email, password, roleId, roleName, status } = req.body;
    const id = `usr-${Date.now()}`;
    const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      `INSERT INTO users 
      (id, name, username, email, password, role_id, role_name, status, last_active, must_change_password, is_super_user, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        username,
        email,
        password || "password123",
        roleId,
        roleName,
        status || "active",
        "Just now",
        0,
        0,
        createdAt,
      ]
    );

    res.status(201).json({
      id,
      name,
      username,
      email,
      roleId,
      roleName,
      status: status || "active",
      lastActive: "Just now",
      mustChangePassword: false,
      isSuperUser: false,
      createdAt,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, password, roleId, roleName, status } = req.body;

    const [rows] = await pool.query("SELECT is_super_user FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    const isSuperUser = Boolean(rows[0].is_super_user);

    // If superuser, prevent demoting role from Super Admin or deactivating
    const finalRoleId = isSuperUser ? "role-super-admin" : roleId;
    const finalRoleName = isSuperUser ? "Super Admin" : roleName;
    const finalStatus = isSuperUser ? "active" : status;

    if (password && password.trim()) {
      await pool.query(
        `UPDATE users SET 
          name = COALESCE(?, name),
          username = COALESCE(?, username),
          email = COALESCE(?, email),
          password = ?,
          role_id = COALESCE(?, role_id),
          role_name = COALESCE(?, role_name),
          status = COALESCE(?, status)
        WHERE id = ?`,
        [name, username, email, password.trim(), finalRoleId, finalRoleName, finalStatus, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET 
          name = COALESCE(?, name),
          username = COALESCE(?, username),
          email = COALESCE(?, email),
          role_id = COALESCE(?, role_id),
          role_name = COALESCE(?, role_name),
          status = COALESCE(?, status)
        WHERE id = ?`,
        [name, username, email, finalRoleId, finalRoleName, finalStatus, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT is_super_user, status FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    if (rows[0].is_super_user) {
      return res.status(403).json({ error: "Super Admin account cannot be deactivated" });
    }

    const nextStatus = rows[0].status === "active" ? "inactive" : "active";
    await pool.query("UPDATE users SET status = ? WHERE id = ?", [nextStatus, id]);

    res.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT is_super_user FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    if (rows[0].is_super_user) {
      return res.status(403).json({ error: "Primary Super Admin user cannot be deleted" });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= WINBOX & TELNET LAUNCHER ROUTES =================
function getWinboxExecutablePath() {
  const customPath = process.env.WINBOX_PATH;
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  // Check project tools folder first
  const projectTool = path.resolve("tools", "WinBox.exe");
  if (fs.existsSync(projectTool)) {
    return projectTool;
  }

  const userHome = os.homedir();
  const searchLocations = [
    path.join(userHome, "Downloads", "WinBox.exe"),
    path.join(userHome, "Downloads", "winbox.exe"),
    path.join(userHome, "Downloads", "winbox64.exe"),
    path.join(userHome, "Desktop", "WinBox.exe"),
    path.join(userHome, "Desktop", "winbox.exe"),
    "C:\\Program Files\\Winbox\\winbox.exe",
    "C:\\Program Files\\Winbox\\WinBox.exe",
    "C:\\Program Files (x86)\\Winbox\\winbox.exe",
    "C:\\Program Files (x86)\\Winbox\\WinBox.exe",
    "C:\\Winbox\\winbox.exe",
    "C:\\Winbox\\WinBox.exe",
  ];

  for (const loc of searchLocations) {
    if (fs.existsSync(loc)) {
      return loc;
    }
  }

  return "winbox.exe";
}

app.post("/api/launch/winbox", (req, res) => {
  try {
    const { ip, username, password } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, message: "Target IP / Host is required." });
    }

    const winboxPath = getWinboxExecutablePath();
    const cleanIp = ip.trim();
    const args = [cleanIp];
    if (username) args.push(username.trim());
    if (password) args.push(password);

    console.log(`[WinBox Launch] Spawning visible GUI: ${winboxPath} with target: ${cleanIp}`);

    // Launch via cmd.exe /c start to guarantee interactive GUI window on Windows desktop
    const child = spawn("cmd.exe", ["/c", "start", "", winboxPath, ...args], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });

    child.unref();

    res.json({
      success: true,
      message: `Winbox launched for ${cleanIp}`,
      executable: winboxPath,
      pid: child.pid,
    });
  } catch (error) {
    console.error("Failed to launch Winbox:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/launch/telnet", (req, res) => {
  try {
    const { ip, port } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, message: "Target IP / Host is required." });
    }

    const cleanIp = ip.trim();
    const cleanPort = (port || "23").toString().trim();

    const child = spawn("cmd.exe", ["/c", "start", "cmd.exe", "/k", `telnet ${cleanIp} ${cleanPort}`], {
      detached: true,
      stdio: "ignore",
      shell: true,
    });

    child.unref();

    res.json({
      success: true,
      message: `Telnet terminal opened for ${cleanIp}:${cleanPort}`,
    });
  } catch (error) {
    console.error("Failed to launch Telnet:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`TeamZero Backend API running on http://localhost:${PORT}`);
  await testConnection();
});
