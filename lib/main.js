#!/usr/bin/env node

import { Command } from "commander";
import compile from "./commands/compile.js";
import watch from "./commands/watch.js";
import sample from "./commands/sample.js";

const program = new Command();

program.option("t, --title <string>", "The title to use for the generated HTML file. Defaults to meta.title or <file.md> if not provided.")
program.argument("<file.md>", "The markdown file to compile.");
program.action((file, options) => {
  compile(file, options).catch(error => {
    console.error(error);
    process.exit(1);
  });
});

program.command("compile <file.md>")
  .description("Compile the given active markdown file into HTML.")
  .option("t, --title <string>", "The title to use for the generated HTML file. Defaults to meta.title or <file.md> if not provided.")
  .action((file, options) => {
    compile(file, options).catch(error => {
      console.error(error);
      process.exit(1);
    });
  })
;

program.command("sample")
  .description("Generate a sample Active Markdown document")
  .action((file, options) => {
    sample(file, options).catch(error => {
      console.error(error);
      process.exit(1);
    });
  })
;

program.command("watch <file.md>")
  .description("Rebuild the output whenever the source file.md changes, autoreload the file if open in a browser.")
  .option("t, --title <string>", "The title to use for the generated HTML file. Defaults to meta.title or <file.md> if not provided.")
  .action((file, options) => {
    watch(file, options).catch(error => {
      console.error(error);
      process.exit(1);
    });
  })
;

program.parse();
