import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`} {...props} />;
}
export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input ${className}`} {...props} />;
}
export function FieldError({
  id,
  children,
}: {
  id: string;
  children?: string;
}) {
  return children ? (
    <p className="field-error" id={id}>
      {children}
    </p>
  ) : null;
}
