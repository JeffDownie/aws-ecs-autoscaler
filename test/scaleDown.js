'use strict';
require('should');

const scaleDown = require('../lib/scaleDown');

describe('scaleDown', () => {
    it('exists', () => {
        scaleDown.should.be.ok();
    });
    it('should not do anything if nothing is there', () => {
        scaleDown({
            containerInstances: [],
            taskDefinitions: []
        }).should.be.false();
    });
    it('should remove an empty instance', () => {
        scaleDown({
            containerInstances: [{
                ec2InstanceId: 'i-123',
                remainingResources: [{
                    name: 'MEMORY',
                    integerValue: 100
                }, {
                    name: 'CPU',
                    integerValue: 100
                }],
                containerInstanceArn: 'abc',
                attributes: [{
                    name: 'ecs.availability-zone',
                    value: 1
                }]
            }],
            taskDefinitions: [],
            tasks: []
        }).should.be.equal('i-123');
    });
    it('should not remove a lone filled instance', () => {
        scaleDown({
            containerInstances: [{
                ec2InstanceId: 'i-123',
                remainingResources: [{
                    name: 'MEMORY',
                    integerValue: 100
                }, {
                    name: 'CPU',
                    integerValue: 100
                }],
                containerInstanceArn: 'abc',
                attributes: [{
                    name: 'ecs.availability-zone',
                    value: 1
                }]
            }],
            taskDefinitions: [{
                taskDefinitionArn: 'def',
                containerDefinitions: [{
                    memory: 100,
                    cpu: 100
                }]
            }],
            tasks: [{
                containerInstanceArn: 'abc',
                taskDefinitionArn: 'def'
            }]
        }).should.be.false();
    });
    it('should remove an instance that can fit in another', () => {
        scaleDown({
            containerInstances: [{
                ec2InstanceId: 'i-124',
                remainingResources: [{
                    name: 'MEMORY',
                    integerValue: 200
                }, {
                    name: 'CPU',
                    integerValue: 200
                }],
                containerInstanceArn: 'abc',
                attributes: [{
                    name: 'ecs.availability-zone',
                    value: 1
                }]
            }, {
                ec2InstanceId: 'i-123',
                remainingResources: [{
                    name: 'MEMORY',
                    integerValue: 100
                }, {
                    name: 'CPU',
                    integerValue: 100
                }],
                containerInstanceArn: 'abd',
                attributes: [{
                    name: 'ecs.availability-zone',
                    value: 1
                }]
            }],
            taskDefinitions: [{
                taskDefinitionArn: 'def',
                containerDefinitions: [{
                    memory: 100,
                    cpu: 100
                }]
            }],
            tasks: [{
                containerInstanceArn: 'abc',
                taskDefinitionArn: 'def'
            }, {
                containerInstanceArn: 'abc',
                taskDefinitionArn: 'def'
            }, {
                containerInstanceArn: 'abd',
                taskDefinitionArn: 'def'
            }, {
                containerInstanceArn: 'abd',
                taskDefinitionArn: 'def'
            }]
        }).should.be.equal('i-123');
    });
    it('should remove an instance in a bigger AZ first', () => {
        scaleDown({
            containerInstances: [{
                ec2InstanceId: 'i-124',
                remainingResources: [{
                    name: 'MEMORY',
                    integerValue: 100
                }, {
                    name: 'CPU',
                    integerValue: 100
                }],
                containerInstanceArn: 'abc',
                attributes: [{
                    name: 'ecs.availability-zone',
                    value: 1
                }]
            }, {
                ec2InstanceId: 'i-123',
                remainingResources: [{
                    name: 'MEMORY',
                    integerValue: 100
                }, {
                    name: 'CPU',
                    integerValue: 100
                }],
                containerInstanceArn: 'abd',
                attributes: [{
                    name: 'ecs.availability-zone',
                    value: 2
                }]
            }, {
                ec2InstanceId: 'i-125',
                remainingResources: [{
                    name: 'MEMORY',
                    integerValue: 100
                }, {
                    name: 'CPU',
                    integerValue: 100
                }],
                containerInstanceArn: 'ab3',
                attributes: [{
                    name: 'ecs.availability-zone',
                    value: 2
                }]
            }],
            taskDefinitions: [],
            tasks: []
        }).should.be.equal('i-123');
    });
});
