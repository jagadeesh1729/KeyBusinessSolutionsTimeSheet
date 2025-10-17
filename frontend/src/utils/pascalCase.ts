export const toPascalCase = (input: string): string =>
  input.replace(/\b([a-z])(\w*)/gi, (_: string, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase());

export const looksLikeUrlOrEmail = (value: string): boolean => {
  if (!value) return false;
  const v = value.trim();
  return /^(https?:\/\/|www\.)/i.test(v) || /@/.test(v) || /\.[a-z]{2,}$/i.test(v);
};

export const shouldSkipInput = (el: HTMLInputElement | HTMLTextAreaElement): boolean => {
  if (!el) return true;
  if (el.hasAttribute('data-no-pascal')) return true;
  if (el.readOnly || el.disabled) return true;
  if ((el as any).isContentEditable) return true;

  const type = (el as HTMLInputElement).type?.toLowerCase?.() || '';
  const skipTypes = new Set([
    'email',
    'url',
    'password',
    'number',
    'date',
    'time',
    'datetime-local',
    'month',
    'week',
    'tel',
    'search',
  ]);
  if (skipTypes.has(type)) return true;

  if (looksLikeUrlOrEmail(el.value)) return true;
  return false;
};

