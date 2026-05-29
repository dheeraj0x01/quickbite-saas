"use client";

type ToastProps = {
  message: string;
  kind?: "info" | "success" | "error";
};

export default function Toast({ message, kind = "info" }: ToastProps) {
  return <div className={`admin-toast ${kind}`}>{message}</div>;
}
