'use strict';
const should = require('should');

const dataUtils = require('../lib/dataUtils');
describe('taskToConstraints', () => {
    const taskToConstraints = dataUtils.taskToConstraints;
    it('is a function', () => {
        taskToConstraints.should.be.a.Function();
    });
    it('defaults both constraints to zero', done => {
        taskToConstraints({containerDefinitions: []}).should.be.deepEqual({memory: 0, cpu: 0});
        done();
    });
    it('gets multiple cpu constraints', done => {
        taskToConstraints({containerDefinitions: [{cpu: 1}, {cpu: 2}]}).should.be.deepEqual({memory: 0, cpu: 3});
        done();
    });
    it('gets multiple memory constraints', done => {
        taskToConstraints({containerDefinitions: [{memory: 1}, {memory: 2}]}).should.be.deepEqual({memory: 3, cpu: 0});
        done();
    });
    it('gets memoryReservation constraints', done => {
        taskToConstraints({containerDefinitions: [{memoryReservation: 1}]}).should.be.deepEqual({memory: 1, cpu: 0});
        done();
    });
    it('gets multiple constraints of all kinds', done => {
        taskToConstraints({containerDefinitions: [{memory: 1, cpu: 3}, {memoryReservation: 2, cpu: 1}, {memory: 10, memoryReservation: 1}]}).should.be.deepEqual({memory: 13, cpu: 4});
        done();
    });
});

describe('taskToDefinition', () => {
    const taskToDefinition = dataUtils.taskToDefinition;
    it('is a function', done => {
        taskToDefinition.should.be.a.Function();
        done();
    });
    it('gets a task definition using the arn', done => {
        taskToDefinition([{
            taskDefinitionArn: '123abc', otherData: 'wrong'
        }, {
            taskDefinitionArn: 'abc123', otherData: 'correct'
        }], {taskDefinitionArn: 'abc123'}).otherData.should.be.equal('correct');
        done();
    });
    it('throws an error if the taskDef is not in the list of passed definitions', done => {
        should.throws(() => taskToDefinition([], {taskDefinitionArn: 'abc123'}));
        done();
    });
});
