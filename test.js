import * as _ from 'lodash';

const getItems = () => [1, 2, 3];
const fn = (a) => a*2;

const collection = getItems();
// не должен менять
const res = Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn);


// не должен менять
function a() {
    const l = 1;
    const qw = { l, as: '123' };
    return _.map(qw, fn);
}


// должно появиться условие
const secondTern =  Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn);


// во втором присваивании не должен менять
let qwer;
if(Array.isArray(collection)) {
    qwer = collection.map(fn);
} else {
    qwer = _.map(collection, fn);
}
