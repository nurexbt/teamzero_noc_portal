-- TeamZero Solutions Portal Database Schema
CREATE DATABASE IF NOT EXISTS teamzero_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE teamzero_portal;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSON NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_active VARCHAR(100) DEFAULT 'Just now',
  must_change_password BOOLEAN DEFAULT FALSE,
  is_super_user BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customer Devices Table
CREATE TABLE IF NOT EXISTS customer_devices (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  device_name VARCHAR(150) NOT NULL,
  device_ip VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  login_method ENUM('winbox', 'telnet', 'web', 'web_ssl') DEFAULT 'winbox',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. NMS Portals Table
CREATE TABLE IF NOT EXISTS nms_portals (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  url VARCHAR(500) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  category VARCHAR(150) DEFAULT 'Monitoring & Analytics',
  status ENUM('online', 'warning', 'offline') DEFAULT 'online',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================= SEED DEFAULT DATA =================

-- Seed Roles
INSERT IGNORE INTO roles (id, name, description, permissions, is_system, created_at) VALUES
('role-super-admin', 'Super Admin', 'System Root Administrator. Full unrestricted access to all customers, devices, Winbox credentials, NMS portals, roles, and users.', '["Manage Customers", "View Customers", "Manage Devices", "View Devices", "View Passwords", "Launch Winbox/Telnet", "Manage NMS Portals", "Access NMS Portals", "User Management"]', 1, '2025-01-01 00:00:00'),
('role-noc', 'NOC Engineer', 'Operational engineering access for device maintenance, Winbox protocol launch, and NMS telemetry analysis.', '["View Customers", "Manage Devices", "View Passwords", "Launch Winbox/Telnet", "Access NMS Portals"]', 0, '2025-01-05 00:00:00'),
('role-operator', 'Network Operator', 'Read-only monitoring access to client directories, ping status, and telemetry dashboards.', '["View Customers", "View Devices", "Access NMS Portals"]', 0, '2025-01-10 00:00:00');

-- Seed Users (default admin / admin with must_change_password)
INSERT IGNORE INTO users (id, name, username, email, password, role_id, role_name, status, last_active, must_change_password, is_super_user, created_at) VALUES
('usr-admin', 'Super Administrator', 'admin', 'admin@teamzero.solutions', 'admin', 'role-super-admin', 'Super Admin', 'active', 'Just now', 1, 1, '2025-01-01 00:00:00'),
('usr-2', 'Fahim Rahman', 'fahim_noc', 'fahim@teamzero.solutions', 'password123', 'role-noc', 'NOC Engineer', 'active', '15 mins ago', 0, 0, '2025-01-15 11:00:00'),
('usr-3', 'Sabbir Hossain', 'sabbir_net', 'sabbir@teamzero.solutions', 'password123', 'role-operator', 'Network Operator', 'active', '2 hours ago', 0, 0, '2025-02-01 09:30:00');

-- Seed Customers
INSERT IGNORE INTO customers (id, name, address, phone, email, created_at) VALUES
('cust-1', 'Apex Retail Group', 'House 42, Road 11, Banani, Dhaka-1213', '+880 1711-234567', 'noc@apexretail.com', '2025-01-15 10:00:00'),
('cust-2', 'Metro Fiber Net', 'Plot 15, Sector 4, Uttara Commercial Area, Dhaka', '+880 1819-876543', 'admin@metrofiber.net', '2025-02-01 11:30:00'),
('cust-3', 'CloudTech Enterprise Hub', 'Level 8, Concord Tower, Gulshan-2, Dhaka', '+880 1912-345678', 'sysadmin@cloudtech.com.bd', '2025-02-18 09:15:00'),
('cust-4', 'Horizon Logistics Ltd', 'EPZ Road, South Port Zone, Chittagong', '+880 1610-998877', 'it-support@horizonlogistics.com', '2025-03-05 14:20:00');

-- Seed Devices
INSERT IGNORE INTO customer_devices (id, customer_id, customer_name, device_name, device_ip, username, password, login_method, notes, created_at) VALUES
('dev-1', 'cust-1', 'Apex Retail Group', 'Router1', '10.0.0.1:8291', 'admin', 'P@ssw0rd!Router1', 'winbox', 'Main Gateway Mikrotik CCR1009 - Office Uplink', '2025-01-16 12:00:00'),
('dev-2', 'cust-2', 'Metro Fiber Net', 'Core-CCR2004', '192.168.10.1:8291', 'noc_team', 'M3tro#CCR2024!', 'winbox', 'Core BGP Router - Dual 10G SFP+ Uplink', '2025-02-02 10:15:00'),
('dev-3', 'cust-3', 'CloudTech Enterprise Hub', 'Edge-Gateway-01', '172.16.20.1:443', 'admin', 'Cloud#GatewaySecure2024', 'web_ssl', 'FortiGate 100F HA Cluster Web GUI', '2025-02-20 16:45:00'),
('dev-4', 'cust-4', 'Horizon Logistics Ltd', 'Distribution-Switch', '192.168.1.254:80', 'operator', 'Switch$Horizon88', 'web', 'Cisco Catalyst 3850 PoE Switch Web UI', '2025-03-06 08:30:00'),
('dev-5', 'cust-2', 'Metro Fiber Net', 'Access-Switch-L2', '10.50.100.2:23', 'cisco', 'Telnet#Console99', 'telnet', 'Edge Distribution Telnet CLI Access', '2025-03-10 11:00:00');

-- Seed NMS Portals
INSERT IGNORE INTO nms_portals (id, name, url, username, password, category, status, created_at) VALUES
('nms-1', 'Zabbix NOC Monitor', 'http://10.0.0.250:8080', 'Admin', 'zabbix_teamzero_2024', 'Infrastructure Monitoring', 'online', '2025-01-10 08:00:00'),
('nms-2', 'LibreNMS Enterprise Core', 'https://nms.teamzero.solutions', 'nocadmin', 'LibreNMS#P0rtal2024', 'SNMP & Traffic Graphs', 'online', '2025-01-12 09:30:00'),
('nms-3', 'Mikrotik The Dude Server', 'http://192.168.10.250:8291', 'admin', 'DudeServerPass99!', 'RouterOS Topology', 'online', '2025-02-05 14:00:00'),
('nms-4', 'Grafana NOC Telemetry', 'http://10.0.0.251:3000', 'viewer_noc', 'Grafana#TeamZero!', 'Real-time Metrics', 'online', '2025-02-15 15:20:00');
