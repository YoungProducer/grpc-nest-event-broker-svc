const { workerData } = require("node:worker_threads");

require("ts-node").register();
require(workerData.aliasModule);