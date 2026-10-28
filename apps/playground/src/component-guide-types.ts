/** Technical documentation for an implemented component, alongside its live recipe. */
export interface GuideInput {
  summary: string;
  /** Copyable semantic HTML; interactive recipes use the shared enhance lifecycle. */
  usage: string;
  lifecycle: string[];
  api: { name: string; type: string; description: string }[];
  accessibility: string[];
  variants?: string[];
  related?: string[];
  frameworkNotes?: string;
  limitations?: string[];
  source?: string;
}

export interface ComponentGuide extends GuideInput {
  /** Alias retained for renderers that label the example by its adapter. */
  vanilla: string;
  name: string;
}
