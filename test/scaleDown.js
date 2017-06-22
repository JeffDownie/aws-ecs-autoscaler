'use strict';
require('should');

const scaleDown = require('../lib/scaleDown');
const now = new Date().getTime();
const shouldDie = now - (55 * 60 * 1000) - 1;
const shouldLive = now - 1;

const instance = (ec2Id, mem, cpu, arn, az) => ({
    ec2InstanceId: ec2Id,
    remainingResources: [{
        name: 'MEMORY',
        integerValue: mem
    }, {
        name: 'CPU',
        integerValue: cpu
    }],
    containerInstanceArn: arn,
    attributes: [{
        name: 'ecs.availability-zone',
        value: az
    }]
});
const ec2 = (id, launchTime) => ({
    InstanceId: id,
    LaunchTime: launchTime
});
const task = (containerInstanceArn, taskDefArn) => ({
    containerInstanceArn: containerInstanceArn,
    taskDefinitionArn: taskDefArn
});

describe('scaleDown', () => {
    it('exists', () => {
        scaleDown.should.be.ok();
    });
    it('should not do anything if nothing is there', () => {
        scaleDown({
            containerInstances: [],
            taskDefinitions: [],
            ec2Instances: []
        }).should.be.false();
    });
    it('should remove an empty instance', () => {
        scaleDown({
            containerInstances: [instance('i-123', 100, 100, 'abc', '1')],
            ec2Instances: [ec2('i-123', shouldDie)],
            taskDefinitions: [],
            tasks: []
        }).should.be.equal('i-123');
    });
    it('should not remove an instance that is not old enough', () => {
        scaleDown({
            containerInstances: [instance('i-123', 100, 100, 'abc', '1')],
            ec2Instances: [ec2('i-123', shouldLive)],
            taskDefinitions: [],
            tasks: []
        }).should.be.false();
    });
    it('should not remove a lone filled instance', () => {
        scaleDown({
            containerInstances: [instance('i-123', 100, 100, 'abc', '1')],
            ec2Instances: [ec2('i-123', shouldDie)],
            taskDefinitions: [{
                taskDefinitionArn: 'def',
                containerDefinitions: [{
                    memory: 100,
                    cpu: 100
                }]
            }],
            tasks: [task('abc', 'def')]
        }).should.be.false();
    });
    it('should remove an instance that can fit in another', () => {
        scaleDown({
            containerInstances: [
                instance('i-124', 200, 200, 'abc', '1'),
                instance('i-123', 100, 100, 'abd', '1')
            ],
            ec2Instances: [
                ec2('i-123', shouldDie),
                ec2('i-124', shouldDie)
            ],
            taskDefinitions: [{
                taskDefinitionArn: 'def',
                containerDefinitions: [{
                    memory: 100,
                    cpu: 100
                }]
            }],
            tasks: [
                task('abc', 'def'),
                task('abc', 'def'),
                task('abd', 'def'),
                task('abd', 'def')
            ]
        }).should.be.equal('i-123');
    });
    it('should not remove an instance with container definitions that can\'t be found', () => {
        scaleDown({
            containerInstances: [
                instance('i-124', 100, 100, 'abc', '1'),
                instance('i-123', 0, 0, 'abd', '1')
            ],
            ec2Instances: [
                ec2('i-123', shouldDie),
                ec2('i-124', shouldDie)
            ],
            taskDefinitions: [{
                taskDefinitionArn: 'def',
                containerDefinitions: [{
                    memory: 100,
                    cpu: 100
                }]
            }],
            tasks: [
                task('abc', 'def'),
                task('abd', 'hij')
            ]
        }).should.be.false();
    });
    it('should remove an aging instance and put containers in a newer instance', () => {
        scaleDown({
            containerInstances: [
                instance('i-123', 100, 100, 'abc', '1'),
                instance('i-124', 100, 100, 'abd', '1'),
            ],
            ec2Instances: [
                ec2('i-123', shouldLive),
                ec2('i-124', shouldDie),
            ],
            taskDefinitions: [{
                taskDefinitionArn: 'def',
                containerDefinitions: [{
                    memory: 1,
                    cpu: 1
                }]
            }],
            tasks: [
                task('abc', 'def'),
                task('abc', 'def'),
                task('abd', 'def'),
                task('abd', 'def')
            ]
        }).should.be.equal('i-124');
    });
    it('should remove an instance in a bigger AZ first', () => {
        scaleDown({
            containerInstances: [
                instance('i-124', 100, 100, 'abc', '1'),
                instance('i-123', 100, 100, 'abd', '2'),
                instance('i-125', 100, 100, 'abe', '2')
            ],
            ec2Instances: [
                ec2('i-123', shouldDie),
                ec2('i-124', shouldDie),
                ec2('i-125', shouldDie)
            ],
            taskDefinitions: [],
            tasks: []
        }).should.be.equal('i-123');
    });
    it('should not remove an instance in a smaller AZ even if it is the only one available to kill', () => {
        scaleDown({
            containerInstances: [
                instance('i-124', 100, 100, 'abc', '1'),
                instance('i-123', 100, 100, 'abd', '2'),
                instance('i-125', 100, 100, 'abe', '2')
            ],
            ec2Instances: [
                ec2('i-123', shouldLive),
                ec2('i-124', shouldDie),
                ec2('i-125', shouldLive)
            ],
            taskDefinitions: [],
            tasks: []
        }).should.be.false();
    });
});
