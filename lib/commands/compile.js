
import fs from "node:fs/promises";
import path from "node:path";

import parse from "../parse.js";
import wrapInScripts from "../buildScript.js";

export default async function compile (input_file_path, options) {
  const now = new Date();
  const input_file_name = path.basename(input_file_path);

  const source_file = await fs.readFile(
    path.join(process.cwd(), input_file_path),
  );
  const raw = source_file.toString();

  const { html, meta } = parse(raw);

  const title = options.title || meta.title || input_file_name;
  const output_file_name = input_file_path.replace(/\.md$/,'.html');
  const output = await wrapInScripts(
    html,
    {
      raw,
      input_file_name,
      title,
      now,
      meta,
      livereload: options.livereload,
    },
  );

  await fs.writeFile(
    path.join(process.cwd(), output_file_name),
    output,
  );
  if (!options.quiet) {
    process.stdout.write(`\nCompiled ${ input_file_path } to ${ output_file_name } (${ output.length } bytes)\n`);
  }
  return { input_bytes: raw.length, output_bytes: output.length, output_file_name };
}
