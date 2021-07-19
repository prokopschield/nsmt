#!/usr/bin/env node

import cluster, { Worker } from 'cluster';
import { read } from 'doge-json';
import fs from 'fs';
import * as nslibmgr from 'nsmt-nslibmgr/lib/nslibmgr';
import path from 'path';
import { watch } from 'ts-hound';

let worker: Worker;
let worker_initialized = false;

if (cluster.isMaster) {
	Promise.resolve().then(async () => {
		while (true) {
			// prepare cloudHandler
			await nslibmgr.cloudHandler('.', {});
			// compile TypeScript
			await nslibmgr.compileHandler();
			// purge unwanted files
			await nslibmgr.cloudHandler('.', {
				unlink_by_default: true,
			});
			// run prettier ❤️
			await nslibmgr.lintHandler();
			// restart worker
			if (worker_initialized) {
				worker.kill();
			}
			// all done, instanciate worker
			worker = cluster.fork();
			worker_initialized = true;
			// wait for worker to exit
			await new Promise((resolve) => {
				worker.once('online', () => {
					worker.process.stdout?.pipe(process.stdout);
					worker.process.stderr?.pipe(process.stdout);
					worker.process.stdin && process.stdin.pipe(worker.process.stdin);
					worker.once('exit', resolve);
				});
			});
		}
	});
} else {
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
}

process.on('SIGINT', () => {
	if (worker_initialized) {
		worker.kill();
		worker_initialized = false;
		console.log(`\r\n\nTerminated worker.\r\n`);
	} else if (cluster.isWorker) {
		process.exit();
	} else {
		console.log(`\x1b[A  `);
		process.exit();
	}
});

process.on('uncaughtException', (error) => console.log({ error }));
process.on('unhandledRejection', (_reason, promise) =>
	console.log('Unhandeled rejection!', promise)
);
