import React, { useState, useEffect, useRef, useMemo } from "react";
import Button from "@/components/ui/button/Button";
import CopyButton from "./CopyButton";
import {
  TerminalIcon,
  PlugInIcon,
  EyeIcon,
  EyeCloseIcon,
  BoltIcon,
  CheckCircleIcon,
  SparkIcon,
} from "@/icons";
import { usePortalData, type CustomerDevice } from "@/context/PortalDataContext";

export interface TerminalConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: CustomerDevice | null;
  initialProtocol?: "ssh" | "telnet" | "winbox";
}

interface SuggestionCommand {
  cmd: string;
  desc: string;
  vendor: "huawei" | "cisco" | "mikrotik" | "common";
}

const NETWORK_COMMANDS: SuggestionCommand[] = [
  // Huawei VRP Commands (Essential for Huawei switches)
  { cmd: "display version", desc: "View Huawei VRP system software version & uptime", vendor: "huawei" },
  { cmd: "display current-configuration", desc: "View active running switch configuration", vendor: "huawei" },
  { cmd: "display interface brief", desc: "View summary of all interface states, speeds, and link status", vendor: "huawei" },
  { cmd: "display ip interface brief", desc: "View Layer-3 IP addresses and physical/protocol states", vendor: "huawei" },
  { cmd: "display mac-address", desc: "View dynamic and static MAC address forwarding table", vendor: "huawei" },
  { cmd: "display ip routing-table", desc: "Inspect IPv4 routing table and gateway next-hops", vendor: "huawei" },
  { cmd: "display vlan", desc: "Display configured VLAN IDs and assigned member ports", vendor: "huawei" },
  { cmd: "display arp", desc: "View IP-to-MAC ARP resolution mappings", vendor: "huawei" },
  { cmd: "display logbuffer", desc: "Inspect recent system logs & interface link changes", vendor: "huawei" },
  { cmd: "display cpu-usage", desc: "Monitor CPU utilization across all system tasks", vendor: "huawei" },
  { cmd: "display memory-usage", desc: "Monitor system memory and RAM allocation", vendor: "huawei" },
  { cmd: "display device", desc: "Inspect hardware modules, power supplies, and fans", vendor: "huawei" },
  { cmd: "display transceiver verbose", desc: "Check optical SFP/SFP+ optical power (dBm) and wavelength", vendor: "huawei" },
  { cmd: "display lldp neighbor brief", desc: "Discover connected LLDP switches and remote ports", vendor: "huawei" },
  { cmd: "display stp brief", desc: "Check Spanning Tree Protocol port states (FWD/BLK)", vendor: "huawei" },
  { cmd: "display port vlan", desc: "Display VLAN attributes across all physical ports", vendor: "huawei" },
  { cmd: "display user-interface", desc: "View active VTY/Console user interface sessions", vendor: "huawei" },
  { cmd: "system-view", desc: "Enter system configuration view [Huawei]", vendor: "huawei" },
  { cmd: "sysname", desc: "Configure system hostname", vendor: "huawei" },
  { cmd: "interface GigabitEthernet", desc: "Configure GigabitEthernet port", vendor: "huawei" },
  { cmd: "interface Eth-Trunk", desc: "Configure link aggregation Eth-Trunk port", vendor: "huawei" },
  { cmd: "port link-type access", desc: "Set port to access mode", vendor: "huawei" },
  { cmd: "port link-type trunk", desc: "Set port to 802.1Q trunk mode", vendor: "huawei" },
  { cmd: "port default vlan", desc: "Assign access port to VLAN ID", vendor: "huawei" },
  { cmd: "port trunk allow-pass vlan", desc: "Allow specified VLANs on trunk port", vendor: "huawei" },
  { cmd: "ip route-static", desc: "Add static IPv4 route", vendor: "huawei" },
  { cmd: "save", desc: "Save current configuration to flash/NVRAM", vendor: "huawei" },
  { cmd: "return", desc: "Return directly to user view (<Huawei>)", vendor: "huawei" },
  { cmd: "quit", desc: "Return to previous view or disconnect", vendor: "huawei" },
  { cmd: "undo", desc: "Negate or delete configuration statement", vendor: "huawei" },
  { cmd: "reboot", desc: "Reboot the switch", vendor: "huawei" },

  // Cisco Commands
  { cmd: "show version", desc: "View Cisco IOS software and hardware summary", vendor: "cisco" },
  { cmd: "show running-config", desc: "View active running configuration", vendor: "cisco" },
  { cmd: "show ip interface brief", desc: "View summary of IP addresses & link status", vendor: "cisco" },
  { cmd: "show interfaces status", desc: "View port VLANs, duplex, and speeds", vendor: "cisco" },
  { cmd: "show ip route", desc: "View IP routing table and default routes", vendor: "cisco" },
  { cmd: "show mac address-table", desc: "View dynamic MAC address table", vendor: "cisco" },
  { cmd: "show vlan brief", desc: "View configured VLANs and port memberships", vendor: "cisco" },
  { cmd: "configure terminal", desc: "Enter global configuration mode", vendor: "cisco" },

  // Mikrotik Commands
  { cmd: "/interface print", desc: "List all network interfaces and links", vendor: "mikrotik" },
  { cmd: "/ip address print", desc: "Display assigned IP address subnets", vendor: "mikrotik" },
  { cmd: "/ip route print", desc: "Display active routing table", vendor: "mikrotik" },
  { cmd: "/system resource print", desc: "Display CPU, RAM, architecture, and uptime", vendor: "mikrotik" },
  { cmd: "/log print", desc: "Show recent RouterOS system logs", vendor: "mikrotik" },

  // Common Network Tools
  { cmd: "ping 8.8.8.8", desc: "Send ICMP echo requests to Google DNS", vendor: "common" },
  { cmd: "tracert 8.8.8.8", desc: "Trace network path hops to destination", vendor: "common" },
  { cmd: "clear", desc: "Clear terminal screen buffer", vendor: "common" },
];

// Helper to handle backspaces (\b) emitted by terminal pagers when overwriting prompts
const appendTerminalOutput = (existing: string, incoming: string): string => {
  if (!incoming.includes("\b")) {
    return existing + incoming;
  }
  let res = existing;
  for (let i = 0; i < incoming.length; i++) {
    const ch = incoming[i];
    if (ch === "\b") {
      res = res.slice(0, -1);
    } else {
      res += ch;
    }
  }
  return res;
};

// Word-by-word Tab autocompletion (Cisco/Huawei/SecureCRT style)
const getWordCompletion = (
  currentInput: string,
  suggestions: SuggestionCommand[],
  currentIndex: number,
  isRepeatedTab: boolean
): { nextText: string; nextIndex: number } => {
  if (suggestions.length === 0) {
    return { nextText: currentInput, nextIndex: 0 };
  }

  const activeIndex = currentIndex >= 0 && currentIndex < suggestions.length ? currentIndex : 0;

  // On repeated Tab press, cycle to the next matching command in suggestions
  if (isRepeatedTab && suggestions.length > 1) {
    const nextIdx = (activeIndex + 1) % suggestions.length;
    const nextCandidate = suggestions[nextIdx].cmd;

    // Check how many words the user had before cycling
    const inputWords = currentInput.trim().split(/\s+/).filter(Boolean);
    const candWords = nextCandidate.trim().split(/\s+/).filter(Boolean);

    // If user only had 1 word (e.g. "display "), stay at 1 word: candWords[0] + " "
    if (inputWords.length <= 1) {
      return { nextText: candWords[0] + " ", nextIndex: nextIdx };
    }

    // If user had multiple words, replace with the next candidate (up to inputWords.length or full candidate)
    const count = Math.min(inputWords.length, candWords.length);
    const hasMore = count < candWords.length;
    return {
      nextText: candWords.slice(0, count).join(" ") + (hasMore ? " " : ""),
      nextIndex: nextIdx,
    };
  }

  const targetCandidate = suggestions[activeIndex].cmd;
  const endsWithSpace = /\s+$/.test(currentInput);
  const inputWords = currentInput.trim().split(/\s+/).filter(Boolean);
  const candidateWords = targetCandidate.trim().split(/\s+/).filter(Boolean);

  if (inputWords.length === 0) {
    return { nextText: candidateWords[0] + " ", nextIndex: 0 };
  }

  // Case 1: user is typing inside a word (no trailing space), e.g. "dis" or "display in"
  if (!endsWithSpace) {
    const wordIndex = inputWords.length - 1;
    const currentWord = inputWords[wordIndex].toLowerCase();

    // Check if active candidate matches at wordIndex
    if (wordIndex < candidateWords.length && candidateWords[wordIndex].toLowerCase().startsWith(currentWord)) {
      const completedWords = [...inputWords.slice(0, wordIndex), candidateWords[wordIndex]];
      const nextText = completedWords.join(" ") + " ";
      return { nextText, nextIndex: activeIndex };
    }

    // Otherwise find first matching candidate
    for (let i = 0; i < suggestions.length; i++) {
      const cWords = suggestions[i].cmd.trim().split(/\s+/);
      if (wordIndex < cWords.length && cWords[wordIndex].toLowerCase().startsWith(currentWord)) {
        const completedWords = [...inputWords.slice(0, wordIndex), cWords[wordIndex]];
        const nextText = completedWords.join(" ") + " ";
        return { nextText, nextIndex: i };
      }
    }
  }

  // Case 2: user finished word(s) and pressed space, e.g. "display "
  const nextWordIndex = inputWords.length;

  // First Tab on trailing space: append next word from active candidate
  if (nextWordIndex < candidateWords.length) {
    const resultWords = [...inputWords, candidateWords[nextWordIndex]];
    const hasMore = nextWordIndex + 1 < candidateWords.length;
    return {
      nextText: resultWords.join(" ") + (hasMore ? " " : ""),
      nextIndex: activeIndex,
    };
  } else {
    // If command already full, cycle next candidate
    const cycledIndex = (activeIndex + 1) % suggestions.length;
    return {
      nextText: suggestions[cycledIndex].cmd,
      nextIndex: cycledIndex,
    };
  }
};

export const TerminalConnectionModal: React.FC<TerminalConnectionModalProps> = ({
  isOpen,
  onClose,
  device,
  initialProtocol = "telnet",
}) => {
  const { updateDevice } = usePortalData();

  // Protocol: SSH, Telnet, or Winbox
  const [protocol, setProtocol] = useState<"ssh" | "telnet" | "winbox">(
    device?.loginMethod === "winbox" ? "winbox" : device?.loginMethod === "ssh" ? "ssh" : initialProtocol || "telnet"
  );

  // Connection settings
  const [host, setHost] = useState("");
  const [port, setPort] = useState("23");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConfig, setShowConfig] = useState(true);

  // Auto-Login feature state
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(true);
  const [autoLoginStatus, setAutoLoginStatus] = useState<string>("");
  const autoUserSentRef = useRef<boolean>(false);
  const autoPassSentRef = useRef<boolean>(false);
  const usernameRef = useRef<string>("");
  const passwordRef = useRef<string>("");
  const autoLoginRef = useRef<boolean>(true);

  // SecureCRT Mark-Text-to-Copy feedback toast
  const [copyToast, setCopyToast] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });

  // SecureCRT Command Suggestions / Autocomplete
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [vendorFilter, setVendorFilter] = useState<"all" | "huawei" | "cisco" | "mikrotik">("all");

  // Live Terminal stream state
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [inputCommand, setInputCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLaunchingDesktop, setIsLaunchingDesktop] = useState(false);
  const [desktopFeedback, setDesktopFeedback] = useState<string | null>(null);

  const sessionIdRef = useRef<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const lastTabTimeRef = useRef<number>(0);
  const lastTabInputRef = useRef<string>("");

  // Keep refs in sync for EventSource callbacks
  useEffect(() => {
    usernameRef.current = username;
    passwordRef.current = password;
    autoLoginRef.current = autoLoginEnabled;
  }, [username, password, autoLoginEnabled]);

  // Filter commands for SecureCRT-style suggestions, ranking exact prefixes highest
  const filteredSuggestions = useMemo(() => {
    if (!suggestionsEnabled || !inputCommand.trim()) return [];
    const query = inputCommand.toLowerCase().trim();
    const matched = NETWORK_COMMANDS.filter((item) => {
      if (vendorFilter !== "all" && item.vendor !== vendorFilter && item.vendor !== "common") {
        return false;
      }
      return item.cmd.toLowerCase().includes(query);
    });

    matched.sort((a, b) => {
      const aStarts = a.cmd.toLowerCase().startsWith(query) ? 0 : 1;
      const bStarts = b.cmd.toLowerCase().startsWith(query) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.cmd.localeCompare(b.cmd);
    });

    return matched.slice(0, 8);
  }, [inputCommand, suggestionsEnabled, vendorFilter]);

  // Reset selected suggestion index when query changes
  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [inputCommand]);

  // Initialize from device or defaults
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
      setIsFullscreen(false);
      if (device) {
        const isWb = device.loginMethod === "winbox";
        const isSsh = device.loginMethod === "ssh";
        const selectedProto: "ssh" | "telnet" | "winbox" = isWb ? "winbox" : isSsh ? "ssh" : "telnet";
        setProtocol(selectedProto);

        const [ipOnly, portFromIp] = device.deviceIp.split(":");
        const resolvedHost = ipOnly || device.deviceIp;
        const resolvedPort = portFromIp || (isWb ? "8291" : isSsh ? "22" : "23");

        setHost(resolvedHost);
        setPort(resolvedPort);
        setUsername(device.username || "");
        setPassword(device.password || "");

        // Set default vendor filter based on device name/notes
        const lowerName = (device.deviceName + " " + (device.notes || "")).toLowerCase();
        if (lowerName.includes("huawei") || lowerName.includes("vrp") || lowerName.includes("babu")) {
          setVendorFilter("huawei");
        } else if (lowerName.includes("cisco")) {
          setVendorFilter("cisco");
        } else if (lowerName.includes("mikrotik") || lowerName.includes("routeros") || isWb) {
          setVendorFilter("mikrotik");
        } else {
          setVendorFilter("all");
        }

        if (selectedProto === "winbox") {
          setStatus("disconnected");
          setStatusMessage("Winbox mode ready (Port 8291)");
          setTerminalOutput(
            `MikroTik Winbox Mode Initialized.\n` +
            `Target: ${resolvedHost}:${resolvedPort}\n` +
            `Username: ${device.username || "admin"}\n\n` +
            `Ready to trigger native Winbox window. Click [Launch Winbox Window] to open GUI.\n` +
            `You can also switch to SSH or Telnet above to open an interactive terminal console.\n`
          );
        } else {
          setTimeout(() => {
            connectToDevice(resolvedHost, resolvedPort, selectedProto, device.username || "");
          }, 150);
        }
      } else {
        setProtocol(initialProtocol);
        const resolvedPort = initialProtocol === "winbox" ? "8291" : initialProtocol === "ssh" ? "22" : "23";
        setPort(resolvedPort);
        const defaultHost = host || "10.199.199.188";
        setHost(defaultHost);
        setUsername(username || "asnur1");

        if (initialProtocol === "winbox") {
          setStatus("disconnected");
          setStatusMessage("Winbox mode ready (Port 8291)");
          setTerminalOutput(
            `MikroTik Winbox Mode Initialized.\n` +
            `Target: ${defaultHost}:${resolvedPort}\n\n` +
            `Ready to trigger native Winbox window. Click [Launch Winbox Window] to open GUI.\n`
          );
        } else {
          setTimeout(() => {
            connectToDevice(defaultHost, resolvedPort, initialProtocol, username || "asnur1");
          }, 150);
        }
      }
      setDesktopFeedback(null);
    } else {
      cleanupConnection();
    }

    return () => {
      cleanupConnection();
    };
  }, [isOpen, device]);

  // Manage body scroll: restore background page scroll when minimized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isMinimized]);

  // Clean up existing SSE connection & socket
  const cleanupConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (sessionIdRef.current) {
      fetch("/api/terminal/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      }).catch(() => {});
      sessionIdRef.current = "";
    }
    autoUserSentRef.current = false;
    autoPassSentRef.current = false;
    setAutoLoginStatus("");
    setStatus("disconnected");
  };

  // SecureCRT Auto-Login Checker: detects Username and Password prompts and auto-sends
  const checkAutoLogin = (fullText: string) => {
    if (!autoLoginRef.current) return;

    // Detect Username Prompt (e.g. "Username:", "login:", "User Name:")
    if (usernameRef.current && !autoUserSentRef.current) {
      const lower = fullText.toLowerCase();
      if (
        lower.includes("username:") ||
        lower.includes("login:") ||
        /(?:username|login)\s*:?\s*$/i.test(fullText.trim())
      ) {
        autoUserSentRef.current = true;
        setAutoLoginStatus(`Auto-sending username: ${usernameRef.current}...`);
        setTimeout(() => {
          sendData(usernameRef.current + "\r\n");
          setAutoLoginStatus("Username sent! Waiting for password...");
        }, 250);
      }
    }

    // Detect Password Prompt (e.g. "Password:", "passwd:")
    if (passwordRef.current && autoUserSentRef.current && !autoPassSentRef.current) {
      const lower = fullText.toLowerCase();
      const lastUser = lower.lastIndexOf("username:");
      const lastPass = lower.lastIndexOf("password:");

      if (
        (lastPass > -1 && lastPass >= lastUser) ||
        /(?:password|passwd)\s*:?\s*$/i.test(fullText.trim())
      ) {
        autoPassSentRef.current = true;
        setAutoLoginStatus("Auto-sending password 🔑...");
        setTimeout(() => {
          sendData(passwordRef.current + "\r\n");
          setAutoLoginStatus("Logged in automatically! ⚡");
          setTimeout(() => setAutoLoginStatus(""), 4000);
        }, 250);
      }
    }
  };

  // Connect to the REAL device via backend socket bridge
  const connectToDevice = (
    targetHost = host,
    targetPort = port,
    targetProto = protocol,
    targetUser = username
  ) => {
    cleanupConnection();

    const cleanHost = targetHost.trim();
    if (!cleanHost) return;

    if (targetProto === "winbox") {
      setStatus("disconnected");
      setStatusMessage(`Winbox target ready: ${cleanHost}:${targetPort || "8291"}`);
      setTerminalOutput(
        `MikroTik Winbox Mode Ready.\n\n` +
        `Target Host: ${cleanHost}\n` +
        `Port: ${targetPort || "8291"}\n` +
        `Username: ${targetUser || "admin"}\n\n` +
        `Click [Launch Winbox Window] to spawn the native MikroTik Winbox GUI application with these credentials.\n` +
        `Tip: To run CLI commands directly inside this web console, switch protocol to SSH (Port 22) or Telnet (Port 23).\n`
      );
      return;
    }

    const newSessionId = `term_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    sessionIdRef.current = newSessionId;
    autoUserSentRef.current = false;
    autoPassSentRef.current = false;

    setStatus("connecting");
    setStatusMessage(`Connecting to ${cleanHost}:${targetPort} via ${targetProto.toUpperCase()}...`);
    setTerminalOutput(`Connecting to real ${targetProto.toUpperCase()} device at ${cleanHost}:${targetPort}...\n\n`);

    const streamUrl = `/api/terminal/stream?sessionId=${encodeURIComponent(
      newSessionId
    )}&protocol=${encodeURIComponent(targetProto)}&host=${encodeURIComponent(
      cleanHost
    )}&port=${encodeURIComponent(targetPort)}&username=${encodeURIComponent(targetUser)}`;

    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener("status", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.state === "connected") {
          setStatus("connected");
          setStatusMessage(payload.message || "Connected");
          setTimeout(() => inputRef.current?.focus(), 100);
        } else if (payload.state === "error") {
          setStatus("disconnected");
          setStatusMessage(payload.message);
          setTerminalOutput((prev) => prev + `\n\n[Error: ${payload.message}]\n`);
        } else if (payload.state === "disconnected") {
          setStatus("disconnected");
          setStatusMessage(payload.message || "Disconnected");
          setTerminalOutput((prev) => prev + `\n\n[${payload.message || "Session closed"}]\n`);
        }
      } catch (err) {
        console.error("Status parse error:", err);
      }
    });

    es.addEventListener("output", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.text) {
          setTerminalOutput((prev) => {
            const next = appendTerminalOutput(prev, payload.text);
            checkAutoLogin(next);
            return next;
          });
        }
      } catch (err) {
        console.error("Output parse error:", err);
      }
    });

    es.onerror = () => {
      if (status !== "connected") {
        setStatus("disconnected");
        setStatusMessage("Connection failed or socket unreachable");
      }
    };
  };

  // When protocol changes, update default port
  const handleProtocolChange = (newProto: "ssh" | "telnet" | "winbox") => {
    setProtocol(newProto);
    if (newProto === "winbox") {
      setPort("8291");
      setVendorFilter("mikrotik");
      cleanupConnection();
      setStatus("disconnected");
      setStatusMessage("Winbox mode selected (Port 8291)");
      setTerminalOutput(
        `MikroTik Winbox Mode Selected.\n` +
        `Target: ${host || "192.168.88.1"}:8291\n` +
        `Click [Launch Winbox Window] below to trigger and open the native MikroTik Winbox GUI application.\n` +
        `You can switch back to SSH (Port 22) or Telnet (Port 23) anytime for RouterOS CLI terminal.\n`
      );
    } else {
      const newPort = newProto === "ssh" ? "22" : "23";
      setPort(newPort);
      connectToDevice(host, newPort, newProto, username);
    }
  };

  // Auto scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalOutput]);

  // Send raw string directly to device socket
  const sendData = async (raw: string) => {
    if (!sessionIdRef.current) return;
    try {
      await fetch("/api/terminal/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          data: raw,
        }),
      });
    } catch (err) {
      console.error("Failed to send terminal data:", err);
    }
  };

  // Detect if Huawei / Cisco / Mikrotik pager prompt (e.g. "---- More ----") is active
  const isPagerActive = useMemo(() => {
    if (!terminalOutput) return false;
    const tail = terminalOutput.slice(-600);
    const matchMore = /(?:----?|--|<---|\b)\s*More(?:\s*\(\s*\d+%\s*\))?\s*(?:----?|--|--->|\b)?/i.test(tail);
    if (!matchMore) return false;

    // Verify prompt has not returned after the "More" keyword
    const moreIndex = tail.toLowerCase().lastIndexOf("more");
    const textAfterMore = tail.slice(moreIndex + 4);
    const hasPromptAfter =
      /<[^>\r\n]+>\s*$/i.test(textAfterMore) ||
      /\[[^\]\r\n]+\]\s*$/i.test(textAfterMore) ||
      /(?:username|login|password)\s*:?\s*$/i.test(textAfterMore);

    return !hasPromptAfter;
  }, [terminalOutput]);

  // Window-level keyboard listener to handle Space, Enter, and 'q' even when input isn't directly focused
  useEffect(() => {
    if (!isOpen || status !== "connected" || isMinimized) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input field (host, port, username, password)
      const activeEl = document.activeElement;
      const isOtherInput =
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") &&
        activeEl !== inputRef.current;
      if (isOtherInput) return;

      // Escape handling: exit fullscreen first, or minimize to bottom tab
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
          return;
        } else {
          setIsMinimized(true);
          return;
        }
      }

      // If typing inside the terminal command input and it already has text, let the input's onKeyDown handle it
      if (activeEl === inputRef.current && inputCommand.trim().length > 0) {
        return;
      }

      // Spacebar handling:
      if (e.key === " ") {
        // Space advances page when in pager or empty input
        e.preventDefault();
        sendData(" ");
        inputRef.current?.focus();
        return;
      }

      // Enter handling:
      if (e.key === "Enter") {
        e.preventDefault();
        sendData("\r\n");
        inputRef.current?.focus();
        return;
      }

      // 'q' or 'Q' handling when pager is active:
      if (isPagerActive && (e.key === "q" || e.key === "Q")) {
        e.preventDefault();
        sendData("q");
        inputRef.current?.focus();
        return;
      }

      // Ctrl+C (Break/Interrupt):
      if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        const sel = window.getSelection()?.toString();
        if (!sel || sel.trim() === "") {
          e.preventDefault();
          sendData("\x03");
          inputRef.current?.focus();
          return;
        }
      }

      // If user presses any standard character, auto-focus terminal input so typing is never lost
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && activeEl !== inputRef.current) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, status, isPagerActive, inputCommand, isMinimized, isFullscreen]);

  // Handle command submission from input bar
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If input is empty (e.g. user hit Enter on empty command):
    // Send newline to advance 1 line on pager or refresh terminal prompt
    if (inputCommand.trim() === "") {
      sendData("\r\n");
      setInputCommand("");
      return;
    }

    const cmd = inputCommand;
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    sendData(cmd + "\r\n");
    setInputCommand("");
  };

  // Quick Action Send (e.g. Huawei/Cisco commands)
  const sendQuickCommand = (cmd: string) => {
    if (cmd === "clear") {
      setTerminalOutput("");
      return;
    }
    sendData(cmd + "\r\n");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // SecureCRT Feature: "Copy on Mark/Select"
  const handleTerminalMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString() || "";
    if (text && text.trim().length > 0) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyToast({
          visible: true,
          text: text.length > 32 ? `Copied: "${text.substring(0, 32)}..."` : `Copied: "${text}"`,
        });
        setTimeout(() => {
          setCopyToast((prev) => ({ ...prev, visible: false }));
        }, 1800);
      }).catch(() => {});
    }
  };

  // SecureCRT Feature: Right-click in terminal to Paste
  const handleTerminalContextMenu = async (e: React.MouseEvent) => {
    // Only paste if text is available
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        e.preventDefault();
        sendData(clipText);
        setCopyToast({
          visible: true,
          text: `Pasted: "${clipText.substring(0, 24)}..."`,
        });
        setTimeout(() => setCopyToast((prev) => ({ ...prev, visible: false })), 1600);
      }
    } catch {
      // Permission prompt or fallback to normal menu
    }
  };

  // Launch Desktop Terminal or Winbox GUI
  const handleLaunchDesktop = async () => {
    setIsLaunchingDesktop(true);
    setDesktopFeedback(null);

    const cleanHost = host.trim() || "127.0.0.1";
    const cleanPort = port.trim() || (protocol === "ssh" ? "22" : protocol === "winbox" ? "8291" : "23");

    try {
      if (protocol === "winbox") {
        const res = await fetch("/api/launch/winbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip: cleanHost,
            username: username.trim(),
            password: password,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setDesktopFeedback(`Winbox GUI window launched for ${cleanHost}`);
        } else {
          setDesktopFeedback(`Winbox window triggered for ${cleanHost}`);
        }
      } else {
        const endpoint = protocol === "ssh" ? "/api/launch/ssh" : "/api/launch/telnet";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip: cleanHost,
            port: cleanPort,
            username: username.trim(),
            password: password,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setDesktopFeedback(`Desktop ${protocol.toUpperCase()} window launched for ${cleanHost}`);
        } else {
          setDesktopFeedback(`Desktop client triggered`);
        }
      }
    } catch {
      setDesktopFeedback(`${protocol === "winbox" ? "Winbox" : "Desktop client"} triggered for ${cleanHost}`);
    } finally {
      setTimeout(() => setIsLaunchingDesktop(false), 3000);
    }
  };

  // Save entered password to device profile for permanent auto-login
  const handleSavePasswordToDevice = () => {
    if (device && password) {
      updateDevice(device.id, { password });
      setDesktopFeedback("Password saved to device! Auto-login will remember it.");
      // Check if prompt is waiting at password right now
      checkAutoLogin(terminalOutput);
      setTimeout(() => setDesktopFeedback(null), 3500);
    }
  };

  const cliCommand =
    protocol === "winbox"
      ? `winbox.exe ${host || "192.168.88.1"} ${username || "admin"} ${password || ""}`
      : protocol === "ssh"
      ? `ssh -p ${port || "22"} ${username ? `${username}@` : ""}${host || "10.199.199.188"}`
      : `telnet ${host || "10.199.199.188"} ${port || "23"}`;

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Docked Bottom Tab */}
      {isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-5 start-1/2 -translate-x-1/2 z-99999 flex items-center gap-3.5 bg-[#161b22]/95 border border-brand-500/60 backdrop-blur-2xl px-4 py-2.5 rounded-2xl shadow-2xl hover:border-brand-400 hover:shadow-brand-500/25 transition-all cursor-pointer select-none text-xs text-gray-200 group"
          title="Click to restore terminal window"
        >
          {/* Live indicator dot */}
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                status === "connected"
                  ? "bg-success-400 animate-pulse shadow-sm shadow-success-500"
                  : status === "connecting"
                  ? "bg-warning-400 animate-ping"
                  : "bg-error-500"
              }`}
            />
            <span className="rounded bg-brand-500/20 text-brand-300 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border border-brand-500/30">
              LIVE {protocol.toUpperCase()}
            </span>
          </div>

          {/* Device info */}
          <div className="flex items-center gap-1.5 font-mono">
            <strong className="text-white font-semibold">{device ? device.deviceName : host}</strong>
            <span className="text-gray-400 text-[11px]">({host}:{port})</span>
          </div>

          {/* Pager indicator if paused at More */}
          {isPagerActive && (
            <span className="rounded bg-warning-500/20 text-warning-300 px-2 py-0.5 text-[10px] font-mono border border-warning-500/40 animate-pulse">
              ---- More ----
            </span>
          )}

          <div className="h-4 w-px bg-gray-700" />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-300 hover:text-white px-2.5 py-1 rounded-lg bg-brand-600/30 hover:bg-brand-600 transition cursor-pointer"
              title="Restore terminal window"
            >
              <span>⬈ Restore</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
                setIsFullscreen(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-300 hover:text-white px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
              title="Open in full screen"
            >
              <span>⛶ Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cleanupConnection();
                onClose();
              }}
              className="inline-flex items-center justify-center size-6 rounded-lg text-gray-400 hover:text-error-400 hover:bg-error-500/20 transition cursor-pointer"
              title="Close and disconnect session"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Terminal Window Shell */}
      <div
        className={
          isMinimized
            ? "hidden"
            : isFullscreen
            ? "fixed inset-0 z-99999 w-screen h-screen flex flex-col bg-[#0d1117] text-gray-200 overflow-hidden"
            : "fixed inset-0 z-99999 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        }
      >
        {/* Backdrop for standard modal mode */}
        {!isFullscreen && !isMinimized && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-99998 transition-opacity"
            onClick={() => setIsMinimized(true)}
            title="Click outside to minimize to bottom tab"
          />
        )}

        {/* Modal Window Container (Wide 7XL Default Size) */}
        <div
          className={
            isFullscreen
              ? "relative flex flex-col w-full h-full bg-[#0d1117] text-gray-200 select-none z-99999"
              : "relative z-99999 max-w-7xl w-[96vw] h-[840px] max-h-[94vh] rounded-3xl border border-gray-800 bg-[#0d1117] shadow-2xl flex flex-col overflow-hidden text-gray-200 transition-all duration-200"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* SecureCRT Mark-Text-to-Copy Floating Notification Toast */}
          {copyToast.visible && (
            <div className="absolute top-14 end-6 z-50 flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg animate-bounce border border-brand-400/40">
              <CheckCircleIcon className="size-4 text-white" />
              <span>{copyToast.text}</span>
              <span className="ms-1 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-mono text-brand-100">
                Auto-Copied (SecureCRT Mode)
              </span>
            </div>
          )}

          {/* Terminal Header Bar */}
          <div
            onDoubleClick={() => setIsFullscreen((prev) => !prev)}
            className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-4 py-3 select-none cursor-default"
            title="Double-click header to toggle Fullscreen"
          >
            <div className="flex items-center gap-2">
              {/* macOS styled window dots */}
              <button
                type="button"
                onClick={() => {
                  cleanupConnection();
                  onClose();
                }}
                title="Close and Disconnect (Red)"
                className="size-3 rounded-full bg-[#ff5f56] hover:brightness-125 transition cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize to bottom tab (Yellow)"
                className="size-3 rounded-full bg-[#ffbd2e] hover:brightness-125 transition cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                title={isFullscreen ? "Restore default window (Green)" : "Enter Fullscreen (Green)"}
                className="size-3 rounded-full bg-[#27c93f] hover:brightness-125 transition cursor-pointer"
              />
              <span className="ms-2 font-mono text-xs font-semibold text-gray-300 flex items-center gap-2">
                <span className="rounded bg-brand-500/20 text-brand-300 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider border border-brand-500/30">
                  LIVE {protocol.toUpperCase()}
                </span>
                <span>
                  {device ? `${device.deviceName} (${host}:${port})` : `${host}:${port}`}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* SecureCRT Features Indicators */}
              <div
                className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono border transition ${
                  autoLoginEnabled
                    ? "border-success-500/30 bg-success-500/10 text-success-300"
                    : "border-gray-800 bg-gray-900 text-gray-500"
                }`}
                title="Auto-Login detects Username/Password prompts and responds automatically"
              >
                <SparkIcon className="size-3 text-warning-400" />
                <span>Auto-Login: {autoLoginEnabled ? "ON" : "OFF"}</span>
              </div>

              <div
                className="hidden md:flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-mono border border-brand-500/20 bg-brand-500/10 text-brand-300"
                title="SecureCRT Copy-on-select: select any text with mouse to copy immediately"
              >
                <span>📋 Mark to Copy</span>
              </div>

              {/* Live Connection Status Badge */}
              <div
                className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-mono border border-gray-800"
                title={statusMessage || status}
              >
                <span
                  className={`size-2 rounded-full ${
                    status === "connected"
                      ? "bg-success-400 animate-pulse"
                      : status === "connecting"
                      ? "bg-warning-400 animate-ping"
                      : "bg-error-500"
                  }`}
                />
                <span className="capitalize text-gray-300 font-semibold">{status}</span>
              </div>

              {/* Toggle Configuration Settings */}
              <button
                type="button"
                onClick={() => setShowConfig((prev) => !prev)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800/80 hover:bg-gray-800 transition cursor-pointer"
              >
                {showConfig ? "Hide Config" : "Config"}
              </button>

              {/* Minimize Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize terminal to bottom tab"
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800/80 hover:bg-gray-800 transition flex items-center gap-1 cursor-pointer"
              >
                <span>🗕</span>
                <span className="hidden sm:inline">Minimize</span>
              </button>

              {/* Fullscreen / Restore Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                title={isFullscreen ? "Restore default window size" : "Expand to Fullscreen"}
                className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 rounded bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{isFullscreen ? "🗗" : "⛶"}</span>
                <span className="hidden sm:inline">{isFullscreen ? "Restore" : "Fullscreen"}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  cleanupConnection();
                  onClose();
                }}
                title="Close and disconnect"
                className="text-xs text-gray-400 hover:text-error-400 px-2 py-1 rounded bg-gray-800/80 hover:bg-error-500/20 transition flex items-center cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

        {/* Connection Settings Bar */}
        {showConfig && (
          <div className="border-b border-gray-800/80 bg-[#12161f] p-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
              {/* Protocol selector */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Protocol
                </label>
                <div className="flex rounded-lg bg-gray-800/80 p-0.5 border border-gray-700">
                  <button
                    type="button"
                    onClick={() => handleProtocolChange("telnet")}
                    className={`flex-1 py-1 px-1.5 rounded-md font-semibold text-xs transition flex items-center justify-center gap-1 ${
                      protocol === "telnet"
                        ? "bg-warning-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <PlugInIcon className="size-3" />
                    Telnet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProtocolChange("ssh")}
                    className={`flex-1 py-1 px-1.5 rounded-md font-semibold text-xs transition flex items-center justify-center gap-1 ${
                      protocol === "ssh"
                        ? "bg-purple-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <TerminalIcon className="size-3" />
                    SSH
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProtocolChange("winbox")}
                    className={`flex-1 py-1 px-1.5 rounded-md font-semibold text-xs transition flex items-center justify-center gap-1 ${
                      protocol === "winbox"
                        ? "bg-brand-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <BoltIcon className="size-3" />
                    Winbox
                  </button>
                </div>
              </div>

              {/* Host / Target IP */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Target Host / IP Address
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. 10.199.199.188"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/90 px-3 py-1.5 font-mono text-xs text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/90 px-3 py-1.5 font-mono text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / asnur1"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/90 px-3 py-1.5 font-mono text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Password
                  </label>
                  {password && <CopyButton textToCopy={password} title="Copy Password" />}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      passwordRef.current = e.target.value;
                    }}
                    placeholder="Enter device password"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/90 px-3 py-1.5 pe-8 font-mono text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeCloseIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons on Toolbar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-800/80 pt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {protocol === "winbox" ? (
                  <button
                    type="button"
                    onClick={handleLaunchDesktop}
                    disabled={isLaunchingDesktop}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-3 py-1 text-xs font-semibold hover:bg-brand-500 transition shadow-sm cursor-pointer"
                  >
                    <BoltIcon className="size-3 text-amber-300" />
                    <span>{isLaunchingDesktop ? "Launching WinBox..." : "Open WinBox GUI"}</span>
                  </button>
                ) : status === "connected" ? (
                  <button
                    type="button"
                    onClick={() => cleanupConnection()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-error-600/20 text-error-400 border border-error-500/30 px-3 py-1 text-xs font-semibold hover:bg-error-600/30 transition cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => connectToDevice()}
                    disabled={status === "connecting"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-3 py-1 text-xs font-semibold hover:bg-brand-500 transition shadow-sm cursor-pointer"
                  >
                    {status === "connecting" ? "Connecting..." : "Reconnect Socket"}
                  </button>
                )}

                {/* Auto-Login Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setAutoLoginEnabled(!autoLoginEnabled)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition cursor-pointer ${
                    autoLoginEnabled
                      ? "bg-warning-500/20 border-warning-500/40 text-warning-300"
                      : "bg-gray-800 border-gray-700 text-gray-400"
                  }`}
                  title="Toggle automatic login detection"
                >
                  <SparkIcon className="size-3" />
                  <span>Auto-Login: {autoLoginEnabled ? "Active" : "Disabled"}</span>
                </button>

                {/* 1-Click Send Saved Credentials */}
                {username && (
                  <button
                    type="button"
                    onClick={() => sendData(username + "\r\n")}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1 text-xs font-mono font-medium transition cursor-pointer"
                    title={`Send username '${username}' to switch`}
                  >
                    <span>Send User:</span>
                    <strong className="text-brand-300">{username}</strong>
                  </button>
                )}

                {password ? (
                  <button
                    type="button"
                    onClick={() => sendData(password + "\r\n")}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1 text-xs font-mono font-medium transition cursor-pointer"
                    title="Send saved password to switch"
                  >
                    <span>Send Pass 🔑</span>
                  </button>
                ) : (
                  device && (
                    <button
                      type="button"
                      onClick={handleSavePasswordToDevice}
                      disabled={!password}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/40 px-2.5 py-1 text-xs font-medium transition cursor-pointer"
                    >
                      Save Pass to Device
                    </button>
                  )
                )}

                {/* Desktop Terminal / Winbox Launcher */}
                <button
                  type="button"
                  onClick={handleLaunchDesktop}
                  disabled={isLaunchingDesktop}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                    protocol === "winbox"
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
                  }`}
                >
                  <BoltIcon className={`size-3.5 ${protocol === "winbox" ? "text-amber-300" : "text-brand-400"}`} />
                  <span>
                    {isLaunchingDesktop
                      ? "Launching..."
                      : protocol === "winbox"
                      ? "Launch Winbox Window"
                      : "Launch Desktop Terminal"}
                  </span>
                </button>

                {autoLoginStatus && (
                  <span className="text-[11px] font-mono text-warning-300 bg-warning-500/15 px-2 py-0.5 rounded border border-warning-500/30 animate-pulse">
                    {autoLoginStatus}
                  </span>
                )}

                {desktopFeedback && (
                  <span className="text-[11px] font-mono text-success-400 bg-success-500/10 px-2 py-0.5 rounded border border-success-500/20">
                    {desktopFeedback}
                  </span>
                )}
              </div>

              {/* CLI Command */}
              <div className="flex items-center gap-2">
                <code className="rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-brand-300 border border-gray-800">
                  {cliCommand}
                </code>
                <CopyButton textToCopy={cliCommand} label="Copy" />
              </div>
            </div>
          </div>
        )}

        {/* Real Live Terminal Screen with SecureCRT Copy-on-Mark */}
        <div
          ref={terminalContainerRef}
          onClick={() => inputRef.current?.focus()}
          onMouseUp={handleTerminalMouseUp}
          onContextMenu={handleTerminalContextMenu}
          className="flex-1 bg-[#090d13] p-4 overflow-y-auto font-mono text-xs text-gray-200 leading-relaxed custom-scrollbar selection:bg-brand-500/40 selection:text-white cursor-text select-text relative"
          title="Mark/select text to copy automatically (SecureCRT style). Right-click to paste."
        >
          {/* WinBox Dedicated Quick-Action Banner */}
          {protocol === "winbox" && (
            <div className="mb-4 rounded-2xl border border-brand-500/40 bg-gradient-to-r from-[#161b22] via-brand-950/30 to-[#161b22] p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0">
                    <BoltIcon className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">MikroTik Winbox GUI Controller</h4>
                      <span className="rounded bg-brand-500/20 text-brand-300 px-2 py-0.5 text-[10px] font-mono border border-brand-500/30">
                        Port {port || "8291"}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Target: <strong className="text-gray-200">{host || "192.168.88.1"}</strong> | User:{" "}
                      <strong className="text-brand-300">{username || "admin"}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleLaunchDesktop}
                    disabled={isLaunchingDesktop}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 shadow-lg shadow-brand-500/25 transition cursor-pointer"
                  >
                    <BoltIcon className="size-4 text-amber-300" />
                    <span>{isLaunchingDesktop ? "Launching WinBox..." : "Launch Winbox Window"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProtocolChange("ssh")}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs px-3 py-2.5 transition cursor-pointer"
                    title="Switch to interactive SSH terminal for RouterOS CLI"
                  >
                    <TerminalIcon className="size-3.5" />
                    <span>SSH CLI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <pre className="font-mono whitespace-pre-wrap leading-relaxed select-text text-gray-200">
            {terminalOutput}
          </pre>

          {/* SecureCRT-style Interactive Suggestions Dropdown Popup */}
          {filteredSuggestions.length > 0 && (
            <div className="sticky bottom-8 z-40 mb-2 rounded-xl border border-brand-500/40 bg-[#161b22]/95 backdrop-blur-md p-1.5 shadow-2xl font-mono text-xs max-w-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 px-2 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5 text-brand-300">
                  <SparkIcon className="size-3 text-warning-400" />
                  CLI Suggestions (Tab: 1 Word at a time • Repeat Tab: Cycle Matches)
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  {(["all", "huawei", "cisco", "mikrotik"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVendorFilter(v);
                      }}
                      className={`px-1.5 py-0.5 rounded capitalize ${
                        vendorFilter === v ? "bg-brand-600 text-white" : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-1 divide-y divide-gray-800/40 max-h-48 overflow-y-auto custom-scrollbar">
                {filteredSuggestions.map((item, idx) => {
                  const isSelected = idx === selectedSuggestionIndex;
                  return (
                    <div
                      key={item.cmd}
                      onClick={() => {
                        setInputCommand(item.cmd + " ");
                        setSelectedSuggestionIndex(idx);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      onDoubleClick={() => {
                        setInputCommand(item.cmd);
                        sendData(item.cmd + "\r\n");
                        setCommandHistory((prev) => [...prev, item.cmd]);
                        setInputCommand("");
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? "bg-brand-600/30 text-white border border-brand-500/30"
                          : "hover:bg-gray-800/60 text-gray-300"
                      }`}
                      title="Click to insert into command line, Double-click to execute immediately"
                    >
                      <div className="flex items-center gap-2">
                        <strong className="text-brand-300 font-bold">{item.cmd}</strong>
                        <span className="text-gray-400 text-[11px] truncate max-w-sm">
                          — {item.desc}
                        </span>
                      </div>
                      <span className="rounded bg-black/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gray-400 border border-gray-800">
                        {item.vendor}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Huawei / Cisco Pager Interactive Helper Banner */}
          {isPagerActive && (
            <div className="sticky bottom-10 z-30 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning-500/50 bg-[#1a140d]/95 p-2 px-3 shadow-2xl backdrop-blur-md font-mono text-xs text-warning-200">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-warning-400 animate-ping" />
                <span className="text-warning-300 font-bold uppercase tracking-wider text-[11px]">
                  ---- More ---- (Output Paused)
                </span>
                <span className="hidden sm:inline text-[10px] text-gray-400">
                  Press Space for next page, Enter for next line
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    sendData(" ");
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg bg-warning-500 text-black px-2.5 py-1 text-xs font-bold hover:bg-warning-400 transition shadow cursor-pointer flex items-center gap-1"
                  title="Send Space to advance 1 full screen page"
                >
                  <span>␣ Space: Next Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sendData("\r\n");
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg bg-gray-800 text-gray-200 border border-gray-700 hover:border-warning-500/50 px-2.5 py-1 text-xs font-semibold hover:bg-gray-700 hover:text-white transition cursor-pointer flex items-center gap-1"
                  title="Send Enter to advance 1 line"
                >
                  <span>↵ Enter: Next Line</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sendData("q");
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg bg-gray-800 text-error-400 border border-error-500/30 px-2.5 py-1 text-xs font-semibold hover:bg-error-600/30 transition cursor-pointer"
                  title="Cancel / Quit paging (q)"
                >
                  <span>✕ Quit (q)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const disableCmd =
                      vendorFilter === "cisco"
                        ? "terminal length 0\r\n"
                        : "screen-length 0 temporary\r\n";
                    sendData(disableCmd);
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg bg-brand-600/30 text-brand-300 border border-brand-500/40 px-2.5 py-1 text-[11px] font-semibold hover:bg-brand-600/50 transition cursor-pointer"
                  title="Disable pagination for this session on switch"
                >
                  <span>⚡ Disable Pager</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Command Line Input directly connected to remote socket */}
          <form onSubmit={handleCommandSubmit} className="flex items-center mt-2 group sticky bottom-0 bg-[#090d13]/90 pt-1 pb-1">
            <span className="text-success-400 font-bold whitespace-nowrap select-none font-mono me-1">
              &gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              placeholder={
                status !== "connected"
                  ? "Connecting..."
                  : isPagerActive
                  ? "---- More ---- Press Space for Next Page, Enter for Next Line, or 'q' to Quit"
                  : "Type command or keyword for SecureCRT suggestions (e.g. 'display', 'sys', 'int')..."
              }
              disabled={status !== "connected"}
              onKeyDown={(e) => {
                if (e.key === " " && (isPagerActive || inputCommand === "")) {
                  // Spacebar: if pager is active OR input is empty, send Space directly to switch to show more config!
                  e.preventDefault();
                  sendData(" ");
                  return;
                }

                if (e.key === "Enter") {
                  if (inputCommand.trim() === "") {
                    // Empty Enter: send newline directly to advance 1 line on pager or get fresh prompt
                    e.preventDefault();
                    sendData("\r\n");
                    return;
                  }
                }

                if ((e.key === "q" || e.key === "Q") && isPagerActive && inputCommand === "") {
                  // 'q' on pager: exit pager
                  e.preventDefault();
                  sendData("q");
                  return;
                }

                if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
                  const sel = window.getSelection()?.toString();
                  if (!sel || sel.trim() === "") {
                    e.preventDefault();
                    sendData("\x03");
                    setInputCommand("");
                    return;
                  }
                }

                if (e.key === "Tab") {
                  e.preventDefault();
                  if (filteredSuggestions.length > 0) {
                    const now = Date.now();
                    const isRepeatedTab =
                      now - lastTabTimeRef.current < 2500 &&
                      (inputCommand === lastTabInputRef.current ||
                        inputCommand.trim() === lastTabInputRef.current.trim());
                    lastTabTimeRef.current = now;

                    const { nextText, nextIndex } = getWordCompletion(
                      inputCommand,
                      filteredSuggestions,
                      selectedSuggestionIndex,
                      isRepeatedTab
                    );

                    setInputCommand(nextText);
                    setSelectedSuggestionIndex(nextIndex);
                    lastTabInputRef.current = nextText;
                  }
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (filteredSuggestions.length > 0) {
                    setSelectedSuggestionIndex((prev) =>
                      prev <= 0 ? filteredSuggestions.length - 1 : prev - 1
                    );
                  } else if (commandHistory.length > 0) {
                    const nextIdx =
                      historyIndex === -1
                        ? commandHistory.length - 1
                        : Math.max(0, historyIndex - 1);
                    setHistoryIndex(nextIdx);
                    setInputCommand(commandHistory[nextIdx]);
                  }
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (filteredSuggestions.length > 0) {
                    setSelectedSuggestionIndex((prev) =>
                      prev >= filteredSuggestions.length - 1 ? 0 : prev + 1
                    );
                  } else if (historyIndex !== -1) {
                    const nextIdx = historyIndex + 1;
                    if (nextIdx >= commandHistory.length) {
                      setHistoryIndex(-1);
                      setInputCommand("");
                    } else {
                      setHistoryIndex(nextIdx);
                      setInputCommand(commandHistory[nextIdx]);
                    }
                  }
                } else if (e.key === "Escape") {
                  setSuggestionsEnabled(false);
                  setTimeout(() => setSuggestionsEnabled(true), 1000);
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono ps-1 focus:ring-0 placeholder:text-gray-500 text-xs"
              autoFocus
            />
          </form>

          <div ref={terminalEndRef} />
        </div>

        {/* Quick Huawei / Network Commands (Bottom Toolbar) */}
        <div className="border-t border-gray-800 bg-[#161b22] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase text-gray-500 me-1">
              Huawei Quick Cmds:
            </span>
            {[
              "display version",
              "display current-configuration",
              "display interface brief",
              "display ip interface brief",
              "display mac-address",
              "display ip routing-table",
              "display vlan",
              "display cpu-usage",
              "screen-length 0 temporary",
              "system-view",
              "quit",
              "clear",
            ].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => sendQuickCommand(cmd)}
                className="rounded bg-gray-800/90 px-2 py-0.5 font-mono text-[11px] text-gray-300 hover:bg-brand-600 hover:text-white transition border border-gray-700/60 cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white border-gray-700"
            >
              Minimize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                cleanupConnection();
                onClose();
              }}
              className="text-gray-300 hover:text-white border-gray-700"
            >
              Close Terminal
            </Button>
          </div>
        </div>
      </div>
    </div>
  </>
);
};

export default TerminalConnectionModal;
