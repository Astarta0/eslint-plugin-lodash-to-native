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
    _.map(getItems(), a => a * 10 )
`;

linter.defineRule("map", plugin);

const messages = linter.verify(code, config, { filename: 'debug.js' });

console.log(code);
console.log(util.inspect(messages, { colors: true, depth: null }));
