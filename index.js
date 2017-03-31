'use strict';
/* eslint-disable no-console */

const CB = require('camda').CB;
const AWS = require('aws-sdk');

const gatherInfo = require('./lib/gatherInformation.js');
const scaleUp = require('./lib/scaleUp');
const scaleDown = require('./lib/scaleDown');

AWS.config.region = 'eu-west-1';
const as = new AWS.AutoScaling();

let ASGroupName = process.env.AS_GROUP_NAME;
let clusterName = process.env.CLUSTER_NAME;
let dryRun = process.env.DRY_RUN;

let scaleDownStrategy = 'removeable';

if(!ASGroupName || !clusterName) {
    console.error('AS_GROUP_NAME or CLUSTER_NAME missing');
    process.exit(1);
}

//increaseASGroupCapacity :: CB (AutoscalingGroupName, currentCapacity) ()
const increaseASGroupCapacity = CB.create(params => ({
    AutoScalingGroupName: params.ASGroupName,
    DesiredCapacity: params.currentCapacity + 1,
    HonorCooldown: true
}))
    .compose(CB((asgRequest, cb) => {
        if(dryRun) {
            console.log('Dry run - will not increase capacity');
            return cb(null, null);
        }
        console.log('Increasing desired capacity');
        as.setDesiredCapacity(asgRequest, cb);
    }));

//removeInstance :: CB instanceId ()
const removeInstance = CB.create(instanceId => ({
    InstanceId: instanceId, ShouldDecrementDesiredCapacity: true
}))
    .compose(CB((terminateInstanceRequest, cb) => {
        if(dryRun) {
            console.log('Dry run - will not remove instance: ' + terminateInstanceRequest.InstanceId);
            return cb(null, null);
        }
        console.log('Removing instance: ' + terminateInstanceRequest.InstanceId);
        as.terminateInstanceInAutoScalingGroup(terminateInstanceRequest, cb);
    }));

const run = () => {
    gatherInfo({
        clusterName: clusterName,
        ASGroupName: ASGroupName
    }, (err, data) => {
        if(data.containerInstances.length !== data.desiredCapacity) {
            console.log('Still scaling up instances');
            return;
        }
        if(scaleUp(data)) {
            increaseASGroupCapacity({desiredCapacity: data.desiredCapacity, ASGroupName: ASGroupName}, err => {
                if(err) return console.error(err);
                console.log('Capacity increased');
            });
            return;
        }
        if(data.awaitingTasks.length !== 0) {
            console.log('Still scaling up tasks');
            return;
        }
        const scaleDownInstance = scaleDown(data, scaleDownStrategy);
        if(scaleDownInstance) {
            removeInstance(scaleDownInstance, err => {
                if(err) return console.error(err);
                console.log('Capacity decreased');
            });
            return;
        }
        console.log('No changes needed.');
    });
};

run();
setInterval(run, 20000);
