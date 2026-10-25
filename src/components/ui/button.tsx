import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text" | "danger";
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      type={type}
      {...props}
    />
  );
}
