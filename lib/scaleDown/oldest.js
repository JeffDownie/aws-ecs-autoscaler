'use strict';
const R = require('ramda');
const seedrandom = require('seedrandom');

const isOldInstance = instance => {
    const now = new Date().getTime();
    const timeAlive = instance.LaunchTime.getTime();
    return (now - timeAlive > (55*60*1000) + (4*60*1000) * seedrandom(instance.InstanceId)());
}; 

module.exports = data => {
    return R.pipe(
            R.prop('ec2Instances'),
            R.filter(isOldInstance),
            R.head,
            R.propOr(false, 'InstanceId'))(data);
};
