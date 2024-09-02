import fs from "node:fs/promises";
import path from "node:path";

const SAMPLE_CONTENT = `
When you eat [3 cookies]{cookies: 2..100}, you consume <strong>[150. calories]{calories}</strong>. That’s [7.%]{dailypct} of your recommended daily calories.

    let kcal_per_cookie = 50;
    let daily_calories = 2_100;
    calories = cookies * kcal_per_cookie;
    dailypct = calories / daily_calories;

- - -

This file is an example of [Active Markdown](https://activemarkdown.org).

Check out more [examples](https://activemarkdown.org/examples.html) or read the [reference](https://activemarkdown.org/reference.html).
`;

export default async function sample () {
  const target_path = path.join(process.cwd(), 'sample.md');
  let existing = true;
  try {
    await fs.stat(target_path);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
    existing = false;
  }
  if (existing) {
    process.stderr.write('\n./sample.md already exists, aborting…\n');
    process.exit(1);
  }
  await fs.writeFile(target_path, SAMPLE_CONTENT);
  process.stdout.write('\nSample saved to ./sample.md. Compile it now using `activemd sample.md`.\n');
}
