'use strict';
const scaleUp = require('../lib/scaleUp'); 

const instance = (mem, cpu) => ({
    remainingResources: [{
        name: 'MEMORY',
        integerValue: mem
    }, {
        name: 'CPU',
        integerValue: cpu
    }]
});
const task = (mem, cpu) => ({
    containerDefinitions: [{
        memory: mem,
        cpu: cpu
    }]
});

describe('scaleUp.js', () => {
    it('exists', () => {
        scaleUp.should.be.ok();
    });
    it('should not scale up if no tasks are waiting', () => {
        scaleUp({
            containerInstances: [instance(10, 10)],
            awaitingTasks: []
        }).should.be.false();
    });
    it('should scale up if a task is waiting with no instances', () => {
        scaleUp({
            containerInstances: [],
            awaitingTasks: [task(10, 10)]
        }).should.be.true();
    });
    it('should not scale up awaiting task can fit', () => {
        scaleUp({
            containerInstances: [
                instance(6, 6)
            ],
            awaitingTasks: [
                task(5, 5)
            ]
        }).should.be.false();
    });
    it('should scale up if a task is waiting with all instance too small', () => {
        scaleUp({
            containerInstances: [
                instance(6, 6),
                instance(6, 6),
                instance(6, 6)
            ],
            awaitingTasks: [task(10, 10)]
        }).should.be.true();
    });
    it('should scale up if two tasks are waiting one instance too small to fit', () => {
        scaleUp({
            containerInstances: [
                instance(6, 6)
            ],
            awaitingTasks: [
                task(5, 5),
                task(5, 5)
            ]
        }).should.be.true();
    });
    it('should not scale up if multiple tasks are waiting that can fit across instances', () => {
        scaleUp({
            containerInstances: [
                instance(6, 1),
                instance(1, 6)
            ],
            awaitingTasks: [
                task(5, 1),
                task(1, 5)
            ]
        }).should.be.false();
    });
});
