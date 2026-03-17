// Centralized tag and background gradient styles for the public UI.
// Extend TAG_STYLES or NAME_BACKGROUND_STYLES to customize behavior.

const TAG_STYLES: Record<string, { chip: string; gradient?: string }> = {
  safe: {
    chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    // Include dark-mode variants so Teams dark/contrast theme keeps the intended tag tint.
    gradient: 'via-emerald-500/5 to-emerald-500/10 dark:via-emerald-400/10 dark:to-emerald-400/20',
  },
  unsafe: {
    chip: 'bg-red-100 text-red-700 border-red-200',
    gradient: 'via-red-500/5 to-red-500/10 dark:via-red-400/10 dark:to-red-400/20',
  },
  internal: {
    chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    gradient: 'via-emerald-500/5 to-emerald-500/10 dark:via-emerald-400/10 dark:to-emerald-400/20',
  },
  external: {
    chip: 'bg-red-100 text-red-700 border-red-200',
    gradient: 'via-red-500/5 to-red-500/10 dark:via-red-400/10 dark:to-red-400/20',
  },
};

// Optional: name-based background overrides (workspace/chatbot names)
const NAME_BACKGROUND_STYLES: Record<string, string> = {
  // 'my special workspace': 'via-blue-500/5 to-blue-500/10',
};

const DEFAULT_CHIP = 'bg-gray-100 text-gray-700 border-gray-200';
const DEFAULT_GRADIENT = 'via-primary/5 to-primary/10 dark:via-primary/10 dark:to-primary/20';

function normalize(value?: string): string {
  return (value || '').toString().trim().toLowerCase();
}

export function getTagChipClasses(tag: string): string {
  const key = normalize(tag);
  return TAG_STYLES[key]?.chip ?? DEFAULT_CHIP;
}

export function getBackgroundGradientClasses({
  tags,
  name,
}: {
  tags?: string[];
  name?: string;
}): string {
  const nameKey = normalize(name);
  if (nameKey && NAME_BACKGROUND_STYLES[nameKey]) {
    return NAME_BACKGROUND_STYLES[nameKey];
  }

  const tagKeys = (tags || []).map(normalize);
  for (const key of tagKeys) {
    const style = TAG_STYLES[key]?.gradient;
    if (style) return style;
  }

  return DEFAULT_GRADIENT;
}


