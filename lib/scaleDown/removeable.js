'use strict';
const R = require('ramda');
const binpack = require('../binpack.js');

const instanceToConstraints = instance => {
    const resources = instance.remainingResources;
    return {
        memory: R.find(R.propEq('name', 'MEMORY'), resources).integerValue,
        cpu: R.find(R.propEq('name', 'CPU'), resources).integerValue,
    };
};

const taskToConstraints = task => {
    return R.reduce((c1, c2) => ({memory:c1.memory + c2.memory, cpu:c1.cpu+c2.cpu}), {memory: 0, cpu: 0}, R.map(R.pick(['memory', 'cpu']), task.containerDefinitions));
};

const taskToDefinition = (definitons, task) => {
    return R.find(R.propEq('taskDefinitionArn', task.taskDefinitionArn), definitons);
};

const instanceTasks = containerInstance => {
    return R.filter(R.eqProps('containerInstanceArn', containerInstance));
};

module.exports = data => {
    const instanceConstraints = R.map(instanceToConstraints, data.containerInstances);
    for(let i = 0; i< data.containerInstances.length; i++) {
        const tasks = R.map(task => taskToDefinition(data.taskDefinitions, task), instanceTasks(data.containerInstances[i])(data.tasks));
        const taskConstraints = R.map(taskToConstraints, tasks);
        if(binpack(R.remove(i, 1, instanceConstraints), taskConstraints)) {
            return data.containerInstances[i].ec2InstanceId;
        }
    }
    return false;
};
