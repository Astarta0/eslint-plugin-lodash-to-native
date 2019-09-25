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
_.map(getItems(), someFunction );
`;

linter.defineRule("lodash-to-native", plugin);

const messages = linter.verify(code, config, { filename: 'debug.js' });

console.log(util.inspect(messages, { colors: true, depth: null }));
