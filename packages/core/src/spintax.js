"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSpintax = parseSpintax;
exports.interpolateVariables = interpolateVariables;
/**
 * Recursively parses and resolves Spintax syntax, e.g.:
 * "{Hey|Hi|Hello} {{firstName}}, {hope you are well|quick question}."
 * Also handles nested spintax like:
 * "{{{Hey|Hi}|Hello} there|Greetings}"
 */
function parseSpintax(text) {
    if (!text)
        return '';
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
function interpolateVariables(template, variables) {
    if (!template)
        return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        const val = variables[key];
        return val !== undefined && val !== null ? String(val) : '';
    });
}
//# sourceMappingURL=spintax.js.map