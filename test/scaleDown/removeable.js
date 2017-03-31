'use strict';
require('should');

const removeable = require('../../lib/scaleDown/removeable');

it('exists', () => {
    removeable.should.be.ok();
});
it('should not do anything if nothing is there', () => {
    removeable({
        containerInstances: [],
        taskDefinitions: []
    }).should.be.false();
});
it('should remove an empty instance', () => {
    removeable({
        containerInstances: [{
            ec2InstanceId: 'i-123',
            remainingResources: [{
                name: 'MEMORY',
                integerValue: 100
            }, {
                name: 'CPU',
                integerValue: 100
            }],
            containerInstanceArn: 'abc'
        }],
        taskDefinitions: [],
        tasks: []
    }).should.be.equal('i-123');
});
it('should not remove a lone filled instance', () => {
    removeable({
        containerInstances: [{
            ec2InstanceId: 'i-123',
            remainingResources: [{
                name: 'MEMORY',
                integerValue: 100
            }, {
                name: 'CPU',
                integerValue: 100
            }],
            containerInstanceArn: 'abc'
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
    removeable({
        containerInstances: [{
            ec2InstanceId: 'i-124',
            remainingResources: [{
                name: 'MEMORY',
                integerValue: 200
            }, {
                name: 'CPU',
                integerValue: 200
            }],
            containerInstanceArn: 'abc'
        }, {
            ec2InstanceId: 'i-123',
            remainingResources: [{
                name: 'MEMORY',
                integerValue: 100
            }, {
                name: 'CPU',
                integerValue: 100
            }],
            containerInstanceArn: 'abd'
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
