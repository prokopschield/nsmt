#!/usr/bin/env node

import cluster, { Worker } from 'cluster';

if (cluster.isMaster) {
	require('nsprt/lib/cli');
	require('./parent');
} else {
	require('./child');
}
