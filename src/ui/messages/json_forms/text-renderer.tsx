import { cn } from '@/lib/utils';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { ControlProps, rankWith, schemaMatches } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

const TextCheckControlBase = (
  props: ControlProps & { readonly?: boolean } & Record<string, any>
) => {
  const {
    label,
    path,
    data,
    required,
    handleChange,
    errors,
    readonly,
    enabled,
    visible,
  } = props;

  const isReadOnly =
    readonly === true ||
    props.control?.readonly === true ||
    enabled === false ||
    props.isReadOnly === true;

  const isEmpty = typeof data === 'string' ? data.trim() === '' : !data;
  const showError = !!errors || (required && isEmpty);
  const errorMessage =
    errors || (required && isEmpty ? 'This field is required' : '');

  if (visible === false) return null;

  return (
    <div className="flex flex-col space-y-1.5 py-2">
      {label && (
        <Label
          htmlFor={path}
          className={cn(
            'text-sm font-medium',
            showError ? 'text-destructive' : '',
            isReadOnly ? 'opacity-60' : ''
          )}
        >
          {required ? `${label} *` : label}
        </Label>
      )}
      <Input
        id={path}
        value={data || ''}
        onChange={(e) => {
          if (isReadOnly) return;
          handleChange(path, e.target.value === '' ? null : e.target.value);
        }}
        readOnly={isReadOnly}
        disabled={isReadOnly}
        type={label?.toLowerCase() === 'password' ? 'password' : 'text'}
        className={cn(
          'text-sm',
          showError &&
            'border-destructive ring-1 ring-destructive focus:ring-destructive',
          isReadOnly && 'bg-muted cursor-not-allowed text-muted-foreground'
        )}
      />
      {showError && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export const TextInputControl = withJsonFormsControlProps(TextCheckControlBase);

export const textInputTester = rankWith(
  4,
  schemaMatches((schema) => schema.type === 'string' && !schema.enum)
);
