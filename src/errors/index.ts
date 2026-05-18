export const ErrorCode = {
  UnknownProbe: "UNKNOWN_PROBE",
  InvalidInput: "INVALID_INPUT",
  ProbeFailed: "PROBE_FAILED",
  Internal: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class CliError extends Error {
  readonly code: ErrorCode;
  readonly exitCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    options: { cause?: unknown; exitCode?: number } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "CliError";
    this.code = code;
    this.exitCode = options.exitCode ?? 1;
  }
}

/**
 * Typed failure raised by the runner (timeouts) and CLI input checks
 * (missing proxy env). `kind` is a stable machine-readable category;
 * the printed message is always `${kind}: ${detail}` so consumers can
 * grep stderr without parsing free-text.
 */
export class ProbeError extends CliError {
  readonly kind: string;

  constructor(kind: string, detail: string, options: { cause?: unknown; exitCode?: number } = {}) {
    super(ErrorCode.ProbeFailed, `${kind}: ${detail}`, options);
    this.name = "ProbeError";
    this.kind = kind;
  }
}

export const unknownProbe = (name: string, known: readonly string[]): CliError =>
  new CliError(ErrorCode.UnknownProbe, `Unknown probe: "${name}". Known: ${known.join(", ")}.`, {
    exitCode: 2,
  });
