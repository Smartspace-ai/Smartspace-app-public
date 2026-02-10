/**
 * Form field wrapper: label, error message, aria-invalid, aria-describedby.
 * Use with React Hook Form Controller or register().
 */

import { type ReactNode } from 'react';
import type { FieldError } from 'react-hook-form';

export type FormFieldProps = {
  name: string;
  label: string;
  error?: FieldError;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
};

const errorId = (name: string) => `${name}-error`;

export function FormField({ name, label, error, children }: FormFieldProps) {
  const id = name.replace(/\./g, '-');
  const describedBy = error?.message ? errorId(id) : undefined;

  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className="font-medium text-sm leading-none peer-disabled:opacity-70"
      >
        {label}
      </label>
      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': describedBy,
      })}
      {error?.message && (
        <p id={errorId(id)} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
