export interface CreepJsHeadlessMarkers {
  chromium: string | null;
  likeHeadless: string | null;
  headless: string | null;
  stealth: string | null;
}

export interface CreepJsResult {
  fpId: string | null;
  /** True when the page reached a stable FP ID before the scrape timeout. */
  computed: boolean;
  headless: CreepJsHeadlessMarkers;
  /** Raw text of the rendered fingerprint table — useful for manual review. */
  fullReport: string;
}
