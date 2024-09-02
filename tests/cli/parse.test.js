import { describe, expect, test } from "vitest";
import parse from "../../lib/parse";
import fs from "fs/promises";

describe('parse', () => {

  test('should parse Active Markdown into html with frontmatter', async () => {
    const source = (await fs.readFile('tests/cli/sample_documents/test.md', 'utf-8')).toString();
    const target = (await fs.readFile('tests/cli/sample_documents/test.html', 'utf-8')).toString();
    expect(parse(source)).toEqual({
      html: target,
      meta: { title: 'Test' },
    });
  });
});
