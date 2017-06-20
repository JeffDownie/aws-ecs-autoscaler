'use strict';
const R = require('ramda');
const binpack = require('./binpack.js');
const dataUtils = require('./dataUtils.js');

module.exports = data => {
    return !binpack(
        R.map(dataUtils.instanceToConstraints, data.containerInstances),
        R.map(dataUtils.taskToConstraints, data.awaitingTasks));
};
