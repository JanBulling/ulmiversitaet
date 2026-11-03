"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "./button";

/** Submit button that shows a spinner and disables itself while its form's action runs */
export function SubmitButton({
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}
