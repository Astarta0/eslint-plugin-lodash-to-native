/**
 * @fileoverview description for rule
 * @author Anastasia
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/map"),

    RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2015 } });


ruleTester.run("map", rule, {

    valid: [
        '_.map({ a: 4, b: 8 }, () => {});'
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
            output:'const mapFn = a => a * 10;\n' +
                'const collection = getItems();\n' +
                'Array.isArray(collection) ? collection.map(mapFn) : _.map(collection, mapFn)'
        },

        {
            code: "_.map(getItems(), function(a) { return a + 10; } )",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output:'const mapFn = function(a) { return a + 10; };\n' +
                'const collection = getItems();\n' +
                'Array.isArray(collection) ? collection.map(mapFn) : _.map(collection, mapFn)'
        },

        {
            code: "_.map(getItems(), someFunction );",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const collection = getItems();\n' +
                'Array.isArray(collection) ? collection.map(someFunction) : _.map(collection, someFunction)'
        },
        // Когда не удалось определить тип переменной по скоупам, должны заменить с проверкой

        // здесь выйдем по условию  if(!variablesObj) return;
        // TODO - замена с проверкой
        {
            code: "const a = _.map(someVariable, fn);",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const a = Array.isArray(someVariable) ? someVariable.map(fn) : _.map(someVariable, fn)'
        },

        // здесь не можем определить тип переменной, нет defNode.init - надо делать замену с проверкой
        // TODO править: срабатывает правило на прошлые замены, дублирование кода в результате
        {
            code: "const someVariable = getAction();" +
                "const a = _.map(someVariable, fn);",
            errors: [{
                messageId: "useArrayMap",
                type: "CallExpression"
            }],
            output: 'const a = Array.isArray(someVariable) ? someVariable.map(fn) : _.map(someVariable, fn)'
        },


    ]
});

