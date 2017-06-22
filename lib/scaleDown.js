'use strict';
const R = require('ramda');
const binpack = require('./binpack.js');
const dataUtils = require('./dataUtils.js');

module.exports = data => {
    const azs = R.countBy(dataUtils.az, data.containerInstances);
    const maxCount = R.reduce(R.max, -Infinity, R.values(azs));
    const commonAzs = R.map(x => x[0], R.filter(p => p[1] === maxCount, R.toPairs(azs)));
    const removeableInstances = R.map(instance => dataUtils.isInstanceNearHour(data.ec2Instances)(instance) && R.contains(dataUtils.az(instance), commonAzs), data.containerInstances);
    const instanceConstraints = R.map(dataUtils.instanceToConstraints, data.containerInstances);
    for(let i = 0; i < removeableInstances.length; i++) {
        if(!removeableInstances[i]) continue;
        let tasks;
        try {
            tasks = R.map(task => dataUtils.taskToDefinition(data.taskDefinitions, task), dataUtils.instanceTasks(data.containerInstances[i])(data.tasks));
        } catch(e) {
            continue;
        }
        const taskConstraints = R.map(dataUtils.taskToConstraints, tasks);
        if(binpack(R.remove(i, 1, instanceConstraints), taskConstraints)) {
            return data.containerInstances[i].ec2InstanceId;
        }
    }
    return false;
};
