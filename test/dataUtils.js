'use strict';
require('should');

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
