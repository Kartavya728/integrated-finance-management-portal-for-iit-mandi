"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] shrink-0 border-r border-gray-200",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "70px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full sticky top-0 z-30 shadow-sm"
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200 h-6 w-6"
            onClick={() => setOpen(!open)}
          />
          <span className="font-semibold text-lg">IIT Mandi Finance</span>
        </div>
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop overlay */}
              <motion.div 
                className="fixed inset-0 bg-black/40 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              {/* Sidebar */}
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className={cn(
                  "fixed h-full w-[85%] max-w-[300px] inset-y-0 left-0 bg-white dark:bg-neutral-900 p-6 z-50 flex flex-col justify-between overflow-y-auto",
                  className
                )}
              >
                <div
                  className="absolute right-4 top-4 z-50 text-neutral-800 dark:text-neutral-200 p-2 hover:bg-gray-100 rounded-full"
                  onClick={() => setOpen(!open)}
                >
                  <IconX className="h-5 w-5" />
                </div>
                {children}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
} & React.ComponentProps<"a">) => {
  const { open } = useSidebar();
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-left w-full transition-all duration-200",
        className
      )}
      {...props}
    >
      <div className="min-w-[24px] flex justify-center">
        {link.icon}
      </div>
      <span className={cn(
        "transition-all duration-200", 
        open ? "opacity-100" : "opacity-0 md:hidden"
      )}>
        {link.label}
      </span>
    </a>
  );
};