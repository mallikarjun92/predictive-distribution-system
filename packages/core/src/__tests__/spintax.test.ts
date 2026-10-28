import { describe, it, expect } from 'vitest';
import { parseSpintax, interpolateVariables } from '../spintax.js';

describe('Spintax & Interpolation Engine', () => {
  it('should parse simple spintax options', () => {
    const template = '{Hello|Hey|Hi} world';
    const parsed = parseSpintax(template);
    expect(['Hello world', 'Hey world', 'Hi world']).toContain(parsed);
  });

  it('should parse nested spintax correctly', () => {
    const template = '{{Quick|Urgent} question|Hello there}';
    const parsed = parseSpintax(template);
    expect(['Quick question', 'Urgent question', 'Hello there']).toContain(parsed);
  });

  it('should interpolate variable tags accurately', () => {
    const template = 'Hey {{firstName}}, loved the work at {{company}}!';
    const interpolated = interpolateVariables(template, {
      firstName: 'Alice',
      company: 'TechCorp',
    });
    expect(interpolated).toBe('Hey Alice, loved the work at TechCorp!');
  });

  it('should handle missing variables by replacing with empty string without crashing', () => {
    const template = 'Hello {{firstName}}, website: {{website}}';
    const interpolated = interpolateVariables(template, { firstName: 'Bob' });
    expect(interpolated).toBe('Hello Bob, website: ');
  });
});
