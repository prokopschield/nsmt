import cluster, { Worker } from 'cluster';
import * as nslibmgr from 'nsmt-nslibmgr/lib/nslibmgr';
import { nsprt } from 'nsprt';

let prettier = nsprt();

let worker: Worker;
let worker_initialized = false;

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
