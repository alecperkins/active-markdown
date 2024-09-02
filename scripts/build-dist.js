
import fs from "node:fs";
import path from "node:path";

const PROJECT_DIR = process.cwd();
const DIST_DIR = path.join(PROJECT_DIR, 'dist');

function readProjectFile (filepath) {
  return fs.readFileSync(path.join(PROJECT_DIR, filepath));
}
function readBuildFile (filepath) {
  return fs.readFileSync(path.join(BUILD_DIR, filepath));
}


function prepareDir () {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR);
}

function writePackageFile (name, content) {
  console.log('writing',name);
  const target_dir = path.join(DIST_DIR, path.dirname(name));
  if (!fs.existsSync(target_dir)) {
    fs.mkdirSync(target_dir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(target_dir, path.basename(name)),
    content,
  );
}

function copyFile (name) {
  writePackageFile(name, readProjectFile(name));
}

function copyFolder (name) {
  const files = fs.readdirSync(path.join(PROJECT_DIR, name), { recursive: true });
  for (const file of files) {
    const _file = path.join(name, file);
    if (!fs.statSync(path.join(PROJECT_DIR, _file)).isDirectory()) {
      copyFile(_file);
    }
  }
}


const package_content = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json')));
delete package_content.bin['activemd-dev']; // This exists so `npx activemd-dev` will run against the dev version instead of an installed live version
delete package_content.scripts;
delete package_content.devDependencies;
delete package_content.private;

prepareDir();

writePackageFile('package.json', JSON.stringify(package_content, null, 2));
copyFile('README.md');
copyFile('LICENSE');
copyFolder('lib');
copyFolder('lib-browser');

