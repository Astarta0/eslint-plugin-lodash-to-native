/**
 * @fileoverview description for rule
 * @author Anastasia
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/map");
const RuleTester = require("eslint").RuleTester;

const oneLine = str => str.replace(/\s+/g, ' ').trim();


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2015 } });

ruleTester.run("map", rule, {

    valid: [
        '_.map({ a: 4, b: 8 }, () => {});',
        'const obj = {}; const myVar = _.map(obj, fn);',
        'const obj = {}; function z(){ return _.map(obj, () => {}) }'
    ],

    invalid: [
        {
            code: "_.map([1, 2, 3], () => {})",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: '[1, 2, 3].map(() => {})'
        },

        {
            code: "_.map([], myFunc)",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: '[].map(myFunc)'
        },

        {
            code: "const array = [];" +
                "_.map(array, myFunc)",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const array = [];' + 'array.map(myFunc)'
        },

        {
            code: "_.map(Array.from(items), myFunc)",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output:'Array.from(items).map(myFunc)'
        },

        {
            code: "_.map(getItems(), a => a * 10 )",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const collection = getItems();\n' +
                    'const callback = a => a * 10;\n' +
                    'Array.isArray(collection) ? collection.map(callback) : _.map(collection, callback)'
        },

        {
            code: "_.map(getItems(), function(a) { return a + 10; } )",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const collection = getItems();\n' +
                    'const callback = function(a) { return a + 10; };\n' +
                    'Array.isArray(collection) ? collection.map(callback) : _.map(collection, callback)'
        },

        {
            code: "_.map(getItems(), someFunction );",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const collection = getItems();\n' +
                'Array.isArray(collection) ? collection.map(someFunction) : _.map(collection, someFunction);'
        },

        // Когда не удалось определить тип переменной по скоупам, должны заменить с проверкой
        {
            code: "const a = _.map(someVariable, fn);",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const a = Array.isArray(someVariable) ? someVariable.map(fn) : _.map(someVariable, fn);'
        },

        {
            code: "const someVariable = getAction();" +
                "const a = _.map(someVariable, fn);",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const someVariable = getAction();'+'const a = Array.isArray(someVariable) ? someVariable.map(fn) : _.map(someVariable, fn);'
        },
        /////////

        {
            code: '_.map([].concat([]), fn);',
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const collection = [].concat([]);\n' +
                'Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn);'
        },

        {
            code: oneLine(`
                const collection = [1, 2, 3];
                const callback = () => {};
                const result = _.map(getItems(), a => a * 10);
            `),
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const collection = [1, 2, 3]; const callback = () => {}; const collection1 = getItems();\n' +
                'const callback1 = a => a * 10;\n' +
                'const result = Array.isArray(collection1) ? collection1.map(callback1) : _.map(collection1, callback1);'
        },

        {
            code: `const result = _.map(something, fn, ctx);`,
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const result = Array.isArray(something) ? something.map(fn, ctx) : _.map(something, fn, ctx);'
        }

    ]
});

