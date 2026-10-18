import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon, LockIcon, UserCircleIcon } from "@/icons";

import { usePortalData } from "@/context/PortalDataContext";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login } = usePortalData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setError("");
    const res = await login(username, password);
    if (!res.success) {
      setError(res.message || "Invalid credentials.");
      return;
    }
    // Route to dashboard
    navigate("/");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-4 rtl:rotate-180" />
          Back to Portal
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
              <span className="text-base font-black">TZ</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                TeamZero Solutions
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                NOC Operations &amp; Management Portal
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Sign In
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter your authorized credentials to access network controls.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/50 p-2.5 text-xs text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
              <span className="font-medium">Default Super Admin:</span>
              <button
                type="button"
                onClick={() => {
                  setUsername("admin");
                  setPassword("admin");
                }}
                className="font-mono font-bold underline hover:text-brand-800 dark:hover:text-brand-200"
                title="Click to auto-fill admin / admin"
              >
                admin / admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-error-50 p-3 text-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <Label htmlFor="signin-username">
                Username <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="signin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="ps-10"
                />
                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
                  <UserCircleIcon className="size-4" />
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="signin-password">
                Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="ps-10 pe-11"
                />
                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
                  <LockIcon className="size-4" />
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeCloseIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Keep me logged in */}
            <div className="flex items-center gap-3 pt-1">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="select-none text-sm font-medium text-gray-700 dark:text-gray-300">
                Keep me logged in
              </span>
            </div>

            {/* Sign in button */}
            <div className="pt-2">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
