#!/usr/bin/env node

import cluster, { Worker } from 'cluster';

if (cluster.isMaster) {
	require('./parent');
} else {
	require('./child');
}

process.on('uncaughtException', (error) => console.log({ error }));
process.on('unhandledRejection', (_reason, promise) =>
	console.log('Unhandeled rejection!', promise)
);
