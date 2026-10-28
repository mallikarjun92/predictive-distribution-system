/**
 * Recursively parses and resolves Spintax syntax, e.g.:
 * "{Hey|Hi|Hello} {{firstName}}, {hope you are well|quick question}."
 * Also handles nested spintax like:
 * "{{{Hey|Hi}|Hello} there|Greetings}"
 */
export declare function parseSpintax(text: string): string;
/**
 * Interpolates variables into a template string:
 * interpolateTemplate("Hi {{firstName}} at {{company}}", { firstName: "Sarah", company: "Acme" })
 */
export declare function interpolateVariables(template: string, variables: Record<string, string | number | null | undefined>): string;
//# sourceMappingURL=spintax.d.ts.map