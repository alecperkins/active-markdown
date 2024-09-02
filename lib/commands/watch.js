
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import compile from "./compile.js";

// Super-naive long polling livereload implementation
// that delays responding to a request until compilation
// is complete. It relies on the page reloading itself
// to start a new request.
function startReloadServer () {
  const port = 3000; // TODO: detect conflicts?
  let _res;
  function trigger (event) {
    _res?.end(event);
    _res = null;
  }
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'access-control-allow-origin': '*',
      'access-control-allow-method': '*',
    });
    if (_res) {
      res.end('skip');
    } else {
      _res = res;
    };
  });
  server.listen(port);
  return { trigger, port };
}

export default async function watch (input_file_path, options) {
  process.stdout.write(`Watching ${ input_file_path } for changes…\n`);

  const target_path = path.join(process.cwd(), input_file_path);
  let is_compiling = false;
  let wait_timeout = null;
  let last_compile = 0;
  let last_input_bytes = 0;

  const livereload = startReloadServer();

  function tryCompiling () {
    const now = new Date();
    if (now.getTime() - last_compile < 2_000 && last_input_bytes !== 0) {
      // There are often two change events for every save,
      // so avoid recompiling so quickly. But, sometimes
      // the last read was while the file was still writing
      // so it got 0 bytes.
      return;
    }
    clearTimeout(wait_timeout);
    if (is_compiling) {
      wait_timeout = setTimeout(tryCompiling, 500);
      return;
    }
    is_compiling = true;
    process.stdout.write(`${ now.toISOString() }: `);
    options.livereload = livereload.port;
    options.quiet = true;
    compile(input_file_path, options)
      .then(({ input_bytes, output_bytes, output_file_name }) => {
        if (input_bytes === 0) {
          last_input_bytes = 0;
          is_compiling = false;
          last_compile = now;
          return;
        }
        last_input_bytes = input_bytes;
        process.stdout.write(`Wrote ${ output_bytes } bytes to ${ output_file_name } in ${ Date.now() - now.getTime() }ms\n`);
        // Allow for the filesystem to finish writing the compiled
        // output before telling the browser to fetch it.
        setTimeout(() => {
          is_compiling = false;
          last_compile = now;
          livereload.trigger('reload');
        }, 50);
      })
      .catch(error => {
        is_compiling = false;
        process.stdout.write('\n\n');
        console.error(error);
        livereload.trigger('error');
      });
  }

  tryCompiling();

  const watcher = fs.watch(target_path);
  for await (const event of watcher) {
    if (event.eventType === "change") {
      tryCompiling();
    }
  }
}
