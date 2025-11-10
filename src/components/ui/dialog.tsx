"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

type DialogContextValue = {
  close: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export type DialogProps = PropsWithChildren<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const close = () => onOpenChange?.(false);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <DialogContext.Provider value={{ close }}>
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4">
        {children}
      </div>
    </DialogContext.Provider>,
    document.body
  );
}

export type DialogContentProps = PropsWithChildren<{
  className?: string;
}>;

export function DialogContent({ className, children }: DialogContentProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const context = useContext(DialogContext);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        context?.close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [context]);

  return (
    <div
      ref={ref}
      className={clsx(
        "relative h-[600px] w-[500px] overflow-hidden rounded-3xl border border-white/15 bg-[#101b15]/95 p-6 shadow-2xl",
        className
      )}
    >
      <button
        type="button"
        onClick={context?.close}
        className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
      >
        Close
      </button>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: PropsWithChildren) {
  return <div className="space-y-2 border-b border-white/10 pb-4">{children}</div>;
}

type DialogTitleProps = {
  children: ReactNode;
  className?: string;
};

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={clsx("font-display text-3xl text-white", className)}>
      {children}
    </h2>
  );
}

type DialogDescriptionProps = {
  children?: ReactNode;
  className?: string;
};

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  if (!children) return null;
  return <p className={clsx("text-sm text-white/60", className)}>{children}</p>;
}
