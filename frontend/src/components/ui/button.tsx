import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded-lg font-medium transition-colors",
        "bg-purple-600 text-white hover:bg-purple-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    />
  );
}
