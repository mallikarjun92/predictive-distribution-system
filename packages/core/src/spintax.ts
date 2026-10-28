/**
 * Recursively parses and resolves Spintax syntax, e.g.:
 * "{Hey|Hi|Hello} {{firstName}}, {hope you are well|quick question}."
 * Also handles nested spintax like:
 * "{{{Hey|Hi}|Hello} there|Greetings}"
 */
export function parseSpintax(text: string): string {
  if (!text) return '';
  const spintaxRegex = /\{([^{}]+)\}/g;
  let result = text;
  
  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (_, choices) => {
      const options = choices.split('|');
      const chosen = options[Math.floor(Math.random() * options.length)];
      return chosen;
    });
  }
  return result;
}

/**
 * Interpolates variables into a template string:
 * interpolateTemplate("Hi {{firstName}} at {{company}}", { firstName: "Sarah", company: "Acme" })
 */
export function interpolateVariables(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}
