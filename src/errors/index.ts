export const ErrorCode = {
  UnknownProbe: "UNKNOWN_PROBE",
  InvalidInput: "INVALID_INPUT",
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

export const unknownProbe = (name: string, known: readonly string[]): CliError =>
  new CliError(ErrorCode.UnknownProbe, `Unknown probe: "${name}". Known: ${known.join(", ")}.`, {
    exitCode: 2,
  });
