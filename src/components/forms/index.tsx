/**
 * Form Components - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * Reusable form components with validation, accessibility, and loading states.
 * Uses react-hook-form with Zod validation for type-safe forms.
 *
 * Place in: components/forms/
 */

'use client';

import * as React from 'react';
import { useForm, UseFormReturn, FieldValues, Path, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================================
// FORM FIELD COMPONENT
// ============================================================

interface FormFieldProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Field type */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  /** Placeholder text */
  placeholder?: string;
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the field */
  helpText?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Minimum value for number inputs */
  min?: number;
  /** Maximum value for number inputs */
  max?: number;
  /** Number of rows for textarea */
  rows?: number;
}

/**
 * Accessible form field with label, input, and error display.
 *
 * @example
 * <FormField
 *   name="email"
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   form={form}
 * />
 */
export function FormField<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  form,
  disabled,
  helpText,
  autoComplete,
  min,
  max,
  rows = 4,
}: FormFieldProps<T>) {
  const { register, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const hasError = !!error;

  const inputProps = {
    id: name,
    placeholder,
    disabled,
    autoComplete,
    'aria-invalid': hasError,
    'aria-describedby': [
      hasError ? errorId : null,
      helpText ? helpId : null,
    ].filter(Boolean).join(' ') || undefined,
    ...register(name, { valueAsNumber: type === 'number' }),
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      {type === 'textarea' ? (
        <Textarea {...inputProps} rows={rows} />
      ) : (
        <Input
          {...inputProps}
          type={type}
          min={min}
          max={max}
        />
      )}

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// FORM SELECT COMPONENT
// ============================================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Select options */
  options: SelectOption[];
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the field */
  helpText?: string;
}

/**
 * Accessible select dropdown with label and error display.
 *
 * @example
 * <FormSelect
 *   name="status"
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   form={form}
 * />
 */
export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  form,
  placeholder = 'Select an option',
  disabled,
  helpText,
}: FormSelectProps<T>) {
  const { setValue, watch, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const hasError = !!error;
  const value = watch(name) as string | undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      <Select
        value={value}
        onValueChange={(val) => setValue(name, val as T[Path<T>], { shouldValidate: true })}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          aria-invalid={hasError}
          aria-describedby={[
            hasError ? errorId : null,
            helpText ? helpId : null,
          ].filter(Boolean).join(' ') || undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// FORM CHECKBOX COMPONENT
// ============================================================

interface FormCheckboxProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Checkbox label */
  label: string;
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the checkbox */
  helpText?: string;
}

/**
 * Accessible checkbox with label and error display.
 *
 * @example
 * <FormCheckbox
 *   name="acceptTerms"
 *   label="I accept the terms and conditions"
 *   form={form}
 * />
 */
export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  form,
  disabled,
  helpText,
}: FormCheckboxProps<T>) {
  const { setValue, watch, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const hasError = !!error;
  const checked = watch(name) as boolean;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={checked}
          onCheckedChange={(val) => setValue(name, val as T[Path<T>], { shouldValidate: true })}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={[
            hasError ? errorId : null,
            helpText ? helpId : null,
          ].filter(Boolean).join(' ') || undefined}
        />
        <Label
          htmlFor={name}
          className={`text-sm font-normal cursor-pointer ${hasError ? 'text-destructive' : ''}`}
        >
          {label}
        </Label>
      </div>

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground ml-6">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive ml-6" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// FORM RADIO GROUP COMPONENT
// ============================================================

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface FormRadioGroupProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Radio options */
  options: RadioOption[];
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the group */
  helpText?: string;
  /** Layout direction */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Accessible radio group with keyboard navigation and proper ARIA labels.
 * Supports arrow key navigation between options.
 *
 * @example
 * <FormRadioGroup
 *   name="exportFormat"
 *   label="Export Format"
 *   options={[
 *     { value: 'markdown', label: 'Markdown', description: 'For GitHub, docs, wikis' },
 *     { value: 'html', label: 'HTML', description: 'Standalone web page' },
 *   ]}
 *   form={form}
 * />
 */
export function FormRadioGroup<T extends FieldValues>({
  name,
  label,
  options,
  form,
  disabled,
  helpText,
  orientation = 'vertical',
}: FormRadioGroupProps<T>) {
  const { setValue, watch, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const labelId = `${name}-label`;
  const hasError = !!error;
  const value = watch(name) as string | undefined;

  const handleKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    const enabledOptions = options.filter(opt => !opt.disabled);
    const currentEnabledIdx = enabledOptions.findIndex(opt => opt.value === options[currentIdx].value);

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (currentEnabledIdx + 1) % enabledOptions.length;
      setValue(name, enabledOptions[nextIdx].value as T[Path<T>], { shouldValidate: true });
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (currentEnabledIdx - 1 + enabledOptions.length) % enabledOptions.length;
      setValue(name, enabledOptions[prevIdx].value as T[Path<T>], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-2">
      <Label id={labelId} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={[
          hasError ? errorId : null,
          helpText ? helpId : null,
        ].filter(Boolean).join(' ') || undefined}
        className={orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}
      >
        {options.map((option, idx) => (
          <label
            key={option.value}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
              value === option.value
                ? 'bg-primary/10 border-primary'
                : 'bg-muted/50 border-border hover:border-muted-foreground/50'
            } ${option.disabled || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => setValue(name, option.value as T[Path<T>], { shouldValidate: true })}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disabled={option.disabled || disabled}
              className="mt-1"
              aria-describedby={option.description ? `${name}-${option.value}-desc` : undefined}
            />
            <div>
              <span className="font-medium text-sm">{option.label}</span>
              {option.description && (
                <p
                  id={`${name}-${option.value}-desc`}
                  className="text-xs text-muted-foreground"
                >
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// SUBMIT BUTTON COMPONENT
// ============================================================

interface SubmitButtonProps {
  /** Button text when idle */
  children: React.ReactNode;
  /** Button text when loading */
  loadingText?: string;
  /** Whether the form is submitting */
  isSubmitting: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Submit button with loading spinner and disabled state.
 *
 * @example
 * <SubmitButton isSubmitting={form.formState.isSubmitting}>
 *   Create Account
 * </SubmitButton>
 */
export function SubmitButton({
  children,
  loadingText = 'Saving...',
  isSubmitting,
  disabled,
  variant = 'default',
  fullWidth = false,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={isSubmitting || disabled}
      className={fullWidth ? 'w-full' : undefined}
    >
      {isSubmitting ? (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// ============================================================
// FORM ERROR DISPLAY
// ============================================================

interface FormErrorProps {
  /** Error message to display */
  message: string | null | undefined;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a form-level error message.
 *
 * @example
 * <FormError message={error} />
 * <FormError message={error} className="mt-2" />
 */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn("rounded-md bg-destructive/10 p-3 text-sm text-destructive", className)}
      role="alert"
    >
      {message}
    </div>
  );
}

// ============================================================
// FORM SUCCESS DISPLAY
// ============================================================

interface FormSuccessProps {
  /** Success message to display */
  message: string | null | undefined;
}

/**
 * Displays a form-level success message.
 *
 * @example
 * <FormSuccess message="Changes saved successfully!" />
 */
export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400"
      role="status"
    >
      {message}
    </div>
  );
}

// ============================================================
// ENTITY-SPECIFIC FORMS
// ============================================================


// ============================================================
// GENERIC FORM WRAPPER HOOK
// ============================================================

interface UseFormSubmitOptions<TData, TResponse> {
  /** Async function to call with form data */
  submitFn: (data: TData) => Promise<TResponse>;
  /** Called on successful submission */
  onSuccess?: (response: TResponse) => void;
  /** Called on failed submission */
  onError?: (error: Error) => void;
}

/**
 * Hook for handling form submission with loading and error states.
 *
 * @example
 * const { submit, isSubmitting, error } = useFormSubmit({
 *   submitFn: (data) => api.createUser(data),
 *   onSuccess: (user) => router.push(`/users/${user.id}`),
 * });
 */
export function useFormSubmit<TData, TResponse>({
  submitFn,
  onSuccess,
  onError,
}: UseFormSubmitOptions<TData, TResponse>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = React.useCallback(
    async (data: TData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await submitFn(data);
        onSuccess?.(response);
        return response;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
        setError(errorMessage);
        onError?.(e instanceof Error ? e : new Error(errorMessage));
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitFn, onSuccess, onError]
  );

  const clearError = React.useCallback(() => setError(null), []);

  return { submit, isSubmitting, error, clearError };
}

// ============================================================
// MUTATION-INTEGRATED FORM HOOK
// ============================================================

import { UseMutationResult } from '@tanstack/react-query';
import { toastSuccess, toastError } from '@/components/ui/toast';

/**
 * Toast messages configuration for form operations.
 */
interface FormToastMessages {
  /** Message shown on successful submission */
  success: string;
  /** Message shown on failed submission (error message appended) */
  error?: string;
  /** Message shown while submitting (for optimistic feedback) */
  loading?: string;
}

/**
 * Default toast messages by operation type.
 */
const DEFAULT_TOAST_MESSAGES = {
  create: {
    success: 'Created successfully',
    error: 'Failed to create',
    loading: 'Creating...',
  },
  update: {
    success: 'Saved successfully',
    error: 'Failed to save changes',
    loading: 'Saving...',
  },
  delete: {
    success: 'Deleted successfully',
    error: 'Failed to delete',
    loading: 'Deleting...',
  },
} as const;

type OperationType = keyof typeof DEFAULT_TOAST_MESSAGES;

interface UseMutationFormOptions<TFormData, TMutationData, TResponse> {
  /** The React Query mutation to use */
  mutation: UseMutationResult<TResponse, Error, TMutationData>;
  /** Transform form data to mutation input (optional, defaults to identity) */
  transformData?: (data: TFormData) => TMutationData;
  /** Toast messages configuration */
  toastMessages?: FormToastMessages;
  /** Operation type for default toast messages */
  operationType?: OperationType;
  /** Callback after successful mutation */
  onSuccess?: (response: TResponse) => void;
  /** Callback after failed mutation */
  onError?: (error: Error) => void;
  /** Whether to show toast notifications (default: true) */
  showToast?: boolean;
  /** Whether to reset the form after successful submission */
  resetOnSuccess?: boolean;
}

/**
 * Hook that integrates react-hook-form with React Query mutations and toast notifications.
 * Provides automatic success/error toasts and proper loading states.
 *
 * @example
 * // Basic usage with Create mutation
 * const createMutation = useCreateProject();
 * const { handleFormSubmit, isSubmitting } = useMutationForm({
 *   mutation: createMutation,
 *   operationType: 'create',
 *   onSuccess: (project) => router.push(`/projects/${project.id}`),
 * });
 *
 * // Custom toast messages
 * const { handleFormSubmit } = useMutationForm({
 *   mutation: updateMutation,
 *   toastMessages: {
 *     success: 'Profile updated!',
 *     error: 'Could not update profile',
 *   },
 * });
 *
 * // With data transformation
 * const { handleFormSubmit } = useMutationForm({
 *   mutation: createMutation,
 *   transformData: (formData) => ({ ...formData, status: 'draft' }),
 * });
 *
 * // In form
 * <form onSubmit={form.handleSubmit(handleFormSubmit)}>
 *   ...
 * </form>
 */
export function useMutationForm<
  TFormData extends FieldValues,
  TMutationData = TFormData,
  TResponse = unknown,
>({
  mutation,
  transformData,
  toastMessages,
  operationType = 'create',
  onSuccess,
  onError,
  showToast = true,
  resetOnSuccess = false,
}: UseMutationFormOptions<TFormData, TMutationData, TResponse>) {
  const messages = toastMessages ?? DEFAULT_TOAST_MESSAGES[operationType];

  const handleFormSubmit = React.useCallback(
    async (data: TFormData) => {
      const mutationData = transformData
        ? transformData(data)
        : (data as unknown as TMutationData);

      try {
        const response = await mutation.mutateAsync(mutationData);

        if (showToast) {
          toastSuccess({ title: messages.success });
        }

        onSuccess?.(response);
        return response;
      } catch (e) {
        const error = e instanceof Error ? e : new Error('An unexpected error occurred');

        if (showToast) {
          const errorPrefix = messages.error ?? 'Operation failed';
          toastError({ title: `${errorPrefix}: ${error.message}` });
        }

        onError?.(error);
        throw error;
      }
    },
    [mutation, transformData, messages, showToast, onSuccess, onError]
  );

  return {
    /** Handler to pass to form.handleSubmit() */
    handleFormSubmit,
    /** Whether the mutation is currently in progress */
    isSubmitting: mutation.isPending,
    /** The last error from the mutation */
    error: mutation.error,
    /** Reset the mutation state */
    reset: mutation.reset,
  };
}

// ============================================================
// FORM WITH MUTATION WRAPPER COMPONENT
// ============================================================

interface MutationFormProps<TFormData extends FieldValues, TMutationData, TResponse> {
  /** The form instance from useForm */
  form: UseFormReturn<TFormData>;
  /** The mutation options */
  mutationOptions: UseMutationFormOptions<TFormData, TMutationData, TResponse>;
  /** Form content (children) */
  children: React.ReactNode;
  /** Additional CSS classes for the form */
  className?: string;
}

/**
 * Form wrapper that integrates with React Query mutations.
 * Handles submission, loading states, and toast notifications automatically.
 *
 * @example
 * const form = useForm<CreateProjectInput>({
 *   resolver: zodResolver(CreateProjectSchema),
 * });
 * const createMutation = useCreateProject();
 *
 * return (
 *   <MutationForm
 *     form={form}
 *     mutationOptions={{
 *       mutation: createMutation,
 *       operationType: 'create',
 *       onSuccess: (project) => router.push(`/projects/${project.id}`),
 *     }}
 *     className="space-y-6"
 *   >
 *     <FormField name="name" label="Project Name" form={form} />
 *     <SubmitButton isSubmitting={createMutation.isPending}>
 *       Create Project
 *     </SubmitButton>
 *   </MutationForm>
 * );
 */
export function MutationForm<
  TFormData extends FieldValues,
  TMutationData = TFormData,
  TResponse = unknown,
>({
  form,
  mutationOptions,
  children,
  className = 'space-y-6',
}: MutationFormProps<TFormData, TMutationData, TResponse>) {
  const { handleFormSubmit, error } = useMutationForm<TFormData, TMutationData, TResponse>(
    mutationOptions
  );

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className={className}>
      <FormError message={error?.message} />
      {children}
    </form>
  );
}

// ============================================================
// ENTITY MUTATION FORM HELPERS
// ============================================================


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
