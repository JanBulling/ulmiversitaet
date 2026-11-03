"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Select } from "./input";

/** Select inside a `<form action>` that submits the form as soon as the value changes */
export function AutoSubmitSelect(props: React.ComponentProps<typeof Select>) {
  const { pending } = useFormStatus();

  return (
    <div className="relative">
      <Select
        {...props}
        disabled={pending || props.disabled}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      />
      {pending && (
        <LoaderCircle
          className="absolute top-2.5 right-2.5 size-4 animate-spin text-muted-foreground"
          aria-hidden
        />
      )}
    </div>
  );
}
