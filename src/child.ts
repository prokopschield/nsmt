import { read } from 'doge-json';
import fs from 'fs';
import * as nslibmgr from 'nsmt-nslibmgr/lib/nslibmgr';
import path from 'path';
import { watch } from 'ts-hound';

Promise.resolve().then(async () => {
	// Detect source code modification!
	watch('./src').on('change', () => {
		console.log('Restarting worker!');
		process.exit();
	});
	// run tests/
	if (fs.existsSync('tests/')) {
		await nslibmgr.testHandler();
	}
	// run any bins in package.json
	const pkg = read('package.json');
	if (pkg.bin) {
		for (const [name, p] of Object.entries(pkg.bin)) {
			console.log(`Executing ${name}`);
			require(path.resolve(`${p}`));
		}
	}
});
