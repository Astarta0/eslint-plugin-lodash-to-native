const util = require('util');
const Linter = require("eslint").Linter;
const plugin = require("./lib/rules/map");
const linter = new Linter();

const config = {
    parserOptions: {
        "ecmaVersion": 6
    },
    rules: {
        "lodash-to-native": "error"
    }
};

const code = `
    const items = [1, 2];
    function asd () {
    _.map([1, 2]);
    }
`;

linter.defineRule("lodash-to-native", plugin);

const messages = linter.verify(code, config, { filename: 'debug.js' });

console.log(util.inspect(messages, { colors: true, depth: null }));