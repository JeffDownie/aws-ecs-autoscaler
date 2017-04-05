'use strict';
const R = require('ramda');

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

const az = instance => {
    return R.find(R.propEq('name', 'ecs.availability-zone'), R.prop('attributes', instance)).value;
};

const findEc2Instance = (containerInstance, ec2Instances) => {
    return R.find(ec2Instance => containerInstance.ec2InstanceId === ec2Instance.InstanceId, ec2Instances);
};

const getLaunchTime = ec2Instance => new Date(ec2Instance.LaunchTime).getTime();

const isNearlyHour = launchTime => (new Date().getTime() - launchTime) % (60 * 60 * 1000) >= ((60 - 5) * 60 * 1000);

const isInstanceNearHour = ec2Instances => containerInstance => isNearlyHour(getLaunchTime(findEc2Instance(containerInstance, ec2Instances)));

module.exports = {
    isInstanceNearHour: isInstanceNearHour,
    az: az,
    instanceToConstraints: instanceToConstraints,
    taskToDefinition: taskToDefinition,
    instanceTasks: instanceTasks,
    taskToConstraints: taskToConstraints
};
