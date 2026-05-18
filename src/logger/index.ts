import pino, { type Logger, type LoggerOptions } from "pino";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "silent";
export type LogFormat = "pretty" | "json";

export interface CreateLoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
}

export function createLogger({ level = "info", format = "pretty" }: CreateLoggerOptions): Logger {
  const options: LoggerOptions = { level };
  if (format === "pretty") {
    options.transport = {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
    };
  }
  return pino(options);
}
