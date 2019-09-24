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
                message: "Use native JavaScript Array.map() method for arrays instead of _.map()",
                type: "MemberExpression"
            }]
        }
    ]
});

