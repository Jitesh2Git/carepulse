"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { FiLogOut } from "react-icons/fi";

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessKey");
    router.push("/");
  };

  return (
    <div className="flex items-center gap-2 sm:gap-5">
      <p className="text-16-semibold max-sm:text-sm max-sm:text-center">
        Admin Dashboard
      </p>
      <button className="text-xl">
        <FiLogOut onClick={handleLogout} />
      </button>
    </div>
  );
};

export default LogoutButton;
