const util = require('util');
const Linter = require("eslint").Linter;
const plugin = require("./lib/rules/map");
const linter = new Linter();

const config = {
    parserOptions: {
        "ecmaVersion": 6
    },
    rules: {
        "map": "error"
    }
};

const code = `
    const _ = require('lodash');
    var m1 = _.map([], fn); // здесь должно сработать
    _ = {map: () => []};
    var m2 = _.map([], fn); // здесь НЕ должно сработать
`;

linter.defineRule("map", plugin);

const messages = linter.verifyAndFix(code, config, { filename: 'debug.js' });

console.log('=============================================================');
console.log('Before:');
console.log(code);
console.log('After:');
console.log(messages.output);
console.log('=============================================================');
console.log(util.inspect(messages, { colors: true, depth: null }));
