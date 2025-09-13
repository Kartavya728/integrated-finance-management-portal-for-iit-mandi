// SidebarLinks.tsx
import React from "react";
import { IconPlus, IconHistory } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface SidebarLinksProps {
  activePage: string;
  setActivePage: (page: "upload" | "history") => void;
  open: boolean;
}

const SidebarLinks: React.FC<SidebarLinksProps> = ({ 
  activePage, 
  setActivePage, 
  open 
}) => {
  const links = [
    {
      label: "Upload Bill",
      icon: <IconPlus className="h-5 w-5 shrink-0 text-blue-600" />,
      onClick: () => setActivePage("upload"),
      key: "upload"
    },
    {
      label: "Bills History",
      icon: <IconHistory className="h-5 w-5 shrink-0 text-indigo-600" />,
      onClick: () => setActivePage("history"),
      key: "history"
    },
  ];

  return (
    <>
      {links.map((link) => (
        <button
          key={link.key}
          onClick={link.onClick}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded text-left w-full",
            activePage === link.key && "bg-gray-200 font-medium"
          )}
        >
          {link.icon}
          {open && <span>{link.label}</span>}
        </button>
      ))}
    </>
  );
};

export default SidebarLinks;