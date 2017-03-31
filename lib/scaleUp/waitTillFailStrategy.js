'use strict';
const R = require('ramda');

const getTaskResource = resourceName => R.compose(R.sum, R.map(R.prop(resourceName)), R.prop('containerDefinitions'));
const getTaskMemory = getTaskResource('memory');
const getTaskCpu = getTaskResource('cpu');

const getInstanceResource = (resourceName, getTotal) => R.compose(R.prop('integerValue'), R.find(resource => R.toUpper(resourceName) === resource.name), R.prop(getTotal ? 'registeredResources' : 'remainingResources'));

//tasksFitInRemainingSpace :: [TaskDefinition] -> [ContainerInstance] -> Bool
const tasksFitInRemainingSpace = (taskDefinitions, containerInstances) => {
    return R.all(taskDefinition => {
        return R.any(containerInstance => {
            return getInstanceResource('memory')(containerInstance) >= getTaskMemory(taskDefinition) && getInstanceResource('cpu')(containerInstance) >= getTaskCpu(taskDefinition);
        }, containerInstances);
    }, taskDefinitions);
};

module.exports = data => {
    return !tasksFitInRemainingSpace(data.awaitingTasks, data.containerInstances);
};
