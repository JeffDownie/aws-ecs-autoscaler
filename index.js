'use strict';
/* eslint-disable no-console */

const CB = require('camda').CB;
const AWS = require('aws-sdk');

const gatherInfo = require('./lib/gatherInformation');
const scaleUp = require('./lib/scaleUp');
const scaleDown = require('./lib/scaleDown');

if(!process.env.AWS_REGION) {
    console.error('AWS_REGION not set');
    process.exit(1);
}
const as = new AWS.AutoScaling();

let ASGroupName = process.env.AS_GROUP_NAME;
let clusterName = process.env.CLUSTER_NAME;
let dryRun = process.env.DRY_RUN;
let interval = process.env.INTERVAL || 20000;
let loopsRemaining = process.env.MAX_LOOPS || 20;

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

const gc = () => {
    if(global.gc) global.gc();
};

const run = () => {
    if(loopsRemaining <= 0) {
        process.exit(0);
        return;
    }
    loopsRemaining--;

    gatherInfo({
        clusterName: clusterName,
        ASGroupName: ASGroupName
    }, (err, data) => {
        const scaleDownInstance = scaleDown(data);
        const scaleUpInstance = scaleUp(data);

        if(data.containerInstances.length !== data.desiredCapacity) {
            console.log('Still scaling up instances');
        } else if(scaleUpInstance) {
            return increaseASGroupCapacity({currentCapacity: data.desiredCapacity, ASGroupName: ASGroupName}, err => {
                if(err) return console.error(err);
                console.log('Capacity increased');
                gc();
            });
        } else if(data.awaitingTasks.length !== 0) {
            console.log('Still scaling up tasks');
        } else if(scaleDownInstance) {
            return removeInstance(scaleDownInstance, err => {
                if(err) return console.error(err);
                console.log('Capacity decreased');
                gc();
            });
        } else {
            console.log('No changes needed.');
        }
        gc();
    });
};

run();
setInterval(run, interval);
