import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CommonProps = {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
  className?: string;
};

type InputProps = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
    as?: "input";
  };

type TextareaProps = CommonProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> & {
    as: "textarea";
  };

type Props = InputProps | TextareaProps;

const INPUT_CLASSES = (error: boolean, className: string | undefined) =>
  cn(
    "block w-full rounded-md border-2 px-3 py-2 text-base text-gray-900",
    "focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-0",
    error ? "border-red-600" : "border-teal-deep/30",
    className,
  );

export function FormField(props: Props) {
  const id = useId();
  const errId = `${id}-err`;
  const hasError = !!props.error;

  return (
    <div>
      <label htmlFor={id} className="text-teal-deep mb-1 block text-sm font-semibold">
        {props.label}
      </label>
      {props.as === "textarea" ? (
        <TextareaControl id={id} errId={errId} hasError={hasError} props={props} />
      ) : (
        <InputControl id={id} errId={errId} hasError={hasError} props={props} />
      )}
      {props.helperText && !props.error && (
        <p className="mt-1 text-xs text-gray-700">{props.helperText}</p>
      )}
      {props.error && (
        <p id={errId} className="mt-1 text-xs text-red-600">
          {props.error}
        </p>
      )}
    </div>
  );
}

function InputControl({
  id,
  errId,
  hasError,
  props,
}: {
  id: string;
  errId: string;
  hasError: boolean;
  props: InputProps;
}) {
  const { label, error, helperText, className, as, ...rest } = props;
  void label;
  void error;
  void helperText;
  void as;
  return (
    <input
      id={id}
      aria-invalid={hasError}
      aria-describedby={hasError ? errId : undefined}
      className={INPUT_CLASSES(hasError, className)}
      {...rest}
    />
  );
}

function TextareaControl({
  id,
  errId,
  hasError,
  props,
}: {
  id: string;
  errId: string;
  hasError: boolean;
  props: TextareaProps;
}) {
  const { label, error, helperText, className, as, ...rest } = props;
  void label;
  void error;
  void helperText;
  void as;
  return (
    <textarea
      id={id}
      aria-invalid={hasError}
      aria-describedby={hasError ? errId : undefined}
      className={INPUT_CLASSES(hasError, className)}
      rows={5}
      {...rest}
    />
  );
}
