'use strict';
/* eslint-disable no-console */

const program = require('commander');
const CB = require('camda').CB;
const AWS = require('aws-sdk');

const gatherInfo = require('./lib/gatherInformation.js');
const scaleUp = require('./lib/scaleUp');
const scaleDown = require('./lib/scaleDown');

AWS.config.region = 'eu-west-1';
const as = new AWS.AutoScaling();

let ASGroupName = null;
let clusterName = null;
let scaleDownStrategy = 'removeable';

program
    .version('0.1.0')
    .arguments('<cluster-name> <auto-scaling-group-name>')
    .option('-d, --dry-run', 'do not actually run changes, just output to console')
    .action((cName, asgName) => {
        clusterName = cName;
        ASGroupName = asgName;
    })
    .parse(process.argv);

if(!ASGroupName || !clusterName) {
    program.outputHelp();
    return;
}

//increaseASGroupCapacity :: CB (AutoscalingGroupName, currentCapacity) ()
const increaseASGroupCapacity = CB.create(params => ({
    AutoScalingGroupName: params.ASGroupName,
    DesiredCapacity: params.currentCapacity + 1,
    HonorCooldown: true
}))
    .compose(CB((asgRequest, cb) => {
        if(program.dryRun) {
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
        if(program.dryRun) {
            console.log('Dry run - will not remove instance: ' + terminateInstanceRequest.InstanceId);
            return cb(null, null);
        }
        console.log('Removing instance: ' + terminateInstanceRequest.InstanceId);
        as.terminateInstanceInAutoScalingGroup(terminateInstanceRequest, cb);
    }));

gatherInfo({
    clusterName: clusterName,
    ASGroupName: ASGroupName
}, (err, data) => {
    if(scaleUp(data)) {
        increaseASGroupCapacity({desiredCapacity: data.desiredCapacity, ASGroupName: ASGroupName}, err => {
            if(err) return console.error(err);
            console.log('Capacity increased');
        });
    } else {
        const scaleDownInstance = scaleDown(data, scaleDownStrategy);
        if(scaleDownInstance) {
            removeInstance(scaleDownInstance, err => {
                if(err) return console.error(err);
                console.log('Capacity decreased');
            });
        } else {
            console.log('No changes needed.');
        }
    }
});
