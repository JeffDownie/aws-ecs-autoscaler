'use strict';
const R = require('ramda');
const CB = require('camda').CB;
const AWS = require('aws-sdk');

const ecs = new AWS.ECS();
const as = new AWS.AutoScaling();
const ec2 = new AWS.EC2();

//getDesiredCapacity :: CB AutoscalingGroupName Int
const getDesiredCapacity = CB.create(autoScalingGroup => ({AutoScalingGroupNames: [autoScalingGroup]}))
    .compose(CB(as.describeAutoScalingGroups, as))
    .map(R.path(['AutoScalingGroups', 0, 'DesiredCapacity']));

//getContainerInstances :: CB ClusterName [ContainerInstance]
const getContainerInstances = CB.create(clusterName => ({cluster: clusterName}))
    .compose(CB(ecs.listContainerInstances, ecs))
    .map(data => data.containerInstanceArns)
    .chain(instanceArns => CB.create(clusterName => ({cluster: clusterName, containerInstances: instanceArns})))
    .compose(CB(ecs.describeContainerInstances, ecs))
    .map(R.prop('containerInstances'));

//getServices :: CB ClusterName [Service]
const getServices = CB.create(clusterName => ({cluster: clusterName}))
    .compose(CB(ecs.listServices, ecs))
    .chain(data => CB.create(clusterName => ({services: data.serviceArns, cluster: clusterName})))
    .compose(CB(ecs.describeServices, ecs))
    .map(R.prop('services'));

//getTaskDefinition :: CB TaskDefinitionArn TaskDefinition
const getTaskDefinition = CB.create(taskDefinitionArn => ({taskDefinition: taskDefinitionArn}))
    .compose(CB(ecs.describeTaskDefinition, ecs))
    .map(R.prop('taskDefinition'));

//getTasks :: CB ClusterName [Task]
const getTasks = CB.create(clusterName => ({cluster: clusterName}))
    .compose(CB(ecs.listTasks, ecs))
    .chain(tasks => CB.create(clusterName => ({tasks: tasks.taskArns, cluster: clusterName})))
    .compose(CB(ecs.describeTasks, ecs))
    .map(R.prop('tasks'));

//getNotYetRunningTasks :: Service -> [TaskDefinitionArn]
const getNotYetRunningTasks = service => {
    return R.chain(deployment => R.repeat(deployment.taskDefinition, R.max(0, deployment.desiredCount - deployment.pendingCount - deployment.runningCount)), service.deployments);
};

//getEC2Instances :: CB [instanceId] [ec2Instances]
const getEC2Instances = CB.create(ids => ({InstanceIds: ids}))
    .compose(CB(ec2.describeInstances, ec2))
    .map(R.prop('Reservations'))
    .map(R.chain(R.prop('Instances')));

//CB (ClusterName, AutoscalingGroupName) (DesiredCapacity, ContainerInstances, AwaitingTasks, EC2Instances, Tasks)
module.exports = CB((params, cb) => {
    const clusterName = params.clusterName;
    const ASGroupName = params.ASGroupName;
    if(!clusterName || !ASGroupName) return cb('Both clusterName and ASGName are required for gathering required information');
    getServices.map(R.map(R.prop('taskDefinition'))).compose(getTaskDefinition.parallel())(clusterName, (err, taskDefinitions) => {
        getServices.map(R.chain(getNotYetRunningTasks)).compose(getTaskDefinition.parallel())(clusterName, (err, awaitingTasks) => {
            getContainerInstances(clusterName, (err, containerInstances) => {
                getEC2Instances((R.map(R.prop('ec2InstanceId'), containerInstances)), (err, ec2Instances) => {
                    getDesiredCapacity(ASGroupName, (err, desiredCapacity) => {
                        getTasks(clusterName, (err, tasks) => {
                            cb(null, {
                                desiredCapacity: desiredCapacity,
                                containerInstances: containerInstances,
                                awaitingTasks: awaitingTasks,
                                ec2Instances: ec2Instances,
                                tasks: tasks,
                                taskDefinitions: taskDefinitions
                            });
                        });
                    });
                });
            });
        });
    });
});
