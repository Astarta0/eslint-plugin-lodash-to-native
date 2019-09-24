/**
 * @fileoverview description for rule
 * @author Anastasia
 */
"use strict";

const astUtils = require('eslint/lib/rules/utils/ast-utils');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        messages: {
            useArrayMap: "Use native JavaScript Array.map() instead of _.map()"
        },
        docs: {
            description: "description for rule",
            category: "Fill me in",
            recommended: false
        },
        fixable: "code",  // or "code" or "whitespace"
        schema: [
            // fill in your schema
        ]
    },

    create: function(context) {

        // variables should be defined here

        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------

        const NODE_TYPES = {
            "ARRAY_EXPRESSION": 'ArrayExpression',
            "IDENTIFIER": 'Identifier',
            "CALL_EXPRESSION": 'CallExpression'
        };

        const reduceNodesText = (nodes, sourseCode) => nodes.reduce((acc, node, idx) => {
            const txt = sourseCode.getText(node);
            acc = idx === 0 ? acc + txt : acc + ', ' + txt;
            return acc;
        }, '');

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        return {

            'CallExpression[callee.type="MemberExpression"][callee.object.name="_"][callee.property.name="map"]'(node) {
                const { start, end, arguments: args } = node;
                const [ first, ...rest ] = args;

                if(first.type === NODE_TYPES.ARRAY_EXPRESSION) {
                    return context.report({
                        node,
                        messageId: "useArrayMap",
                        fix: function(fixer) {
                            const sourseCode = context.getSourceCode();
                            const restArguments = reduceNodesText(rest, sourseCode);
                            return fixer.replaceTextRange([start, end], `${sourseCode.getText(first)}.map(${restArguments})`);
                        }
                    });
                }

                if(first.type === NODE_TYPES.IDENTIFIER) {
                    const varName = first.name;
                    const scope = context.getScope();

                    const variablesObj = astUtils.getVariableByName(scope,varName);
                    if(!variablesObj) return;
                    const { defs } = variablesObj;
                    const defNode = defs[0].node;
                    const variableType = defNode.init.type;

                    if(variableType === NODE_TYPES.ARRAY_EXPRESSION) {
                        return context.report({
                            node,
                            messageId: "useArrayMap",
                            fix: function(fixer) {
                                const sourseCode = context.getSourceCode();
                                const restArguments = reduceNodesText(rest, sourseCode);
                                return fixer.replaceTextRange([start, end], `${sourseCode.getText(first)}.map(${restArguments})`);
                            }
                        });
                    }
                }

                if(first.type === NODE_TYPES.CALL_EXPRESSION) {
                    if(astUtils.isArrayFromMethod(first.callee)) {
                        return context.report({
                            node,
                            messageId: "useArrayMap",
                            fix: function(fixer) {
                                const sourseCode = context.getSourceCode();
                                const restArguments = reduceNodesText(rest, sourseCode);
                                return fixer.replaceTextRange([start, end], `${sourseCode.getText(first)}.map(${restArguments})`);
                            }
                        });
                    }
                }

            }


        };
    }
};
