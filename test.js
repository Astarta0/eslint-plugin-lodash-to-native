import * as _ from 'lodash';

const getItems = () => [1, 2, 3];
const fn = (a) => a*2;

const collection = getItems();
const res = Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn);
