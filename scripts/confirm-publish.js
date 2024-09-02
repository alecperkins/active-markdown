const target = require('../dist/package.json');

(async () => {
    const npm_endpoint = `https://registry.npmjs.com/${ target.name }`;
    const published_package = await (await fetch(npm_endpoint)).json();
    const latest_version = published_package["dist-tags"]?.latest;
    process.stdout.write(`Local version: ${ target.version }\n`);
    process.stdout.write(`Published version: ${ latest_version }\n`);

    if (latest_version === target.version) {
        process.stdout.write(`\nLocal and published versions are the same (${ latest_version }).
Merge the release first! https://github.com/alecperkins/${target.name}/pulls?q=is:pr+is:open+label:%22autorelease:+pending%22\n`);
        process.exit(1);
    }

    process.stdout.write(`\n\nReview the pack readout above, then confirm publish of ${ target.name }@${ target.version } by typing the package name:\n> `);
    process.stdin.on('data', (data) => {
        if (data.toString().trim() === target.name) {
            process.exit(0);
        } else {
            process.stdout.write(`'${ data }' does not match '${ target.name }, aborting!'`);
            process.exit(1);
        }
    });

})().catch(error => {
    console.error(error);
    process.exit(1);
});
