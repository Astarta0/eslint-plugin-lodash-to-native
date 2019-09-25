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

        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------

        const NODE_TYPES = {
            "ARRAY_EXPRESSION": 'ArrayExpression',
            "IDENTIFIER": 'Identifier',
            "CALL_EXPRESSION": 'CallExpression',
            "ARROW_FUNCTION_EXPRESSION": 'ArrowFunctionExpression',
            "FUNCTION_EXPRESSION": 'FunctionExpression',
        };

        const PARENT_TYPES = ['Program', 'BlockStatement'];

        const findParentNode = node => {
            if (!node.parent) return null;
            node = node.parent;
            if(PARENT_TYPES.includes(node.parent.type)) {
                return node;
            } else {
                return findParentNode(node);
            }
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
                const sourseCode = context.getSourceCode();

                if(first.type === NODE_TYPES.ARRAY_EXPRESSION) {
                    return context.report({
                        node,
                        messageId: "useArrayMap",
                        fix: function(fixer) {
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

                    // Можем определить тип переменной, и если массив - выполняем простую замену
                    if(defNode.init && defNode.init.type && defNode.init.type === NODE_TYPES.ARRAY_EXPRESSION) {
                        return context.report({
                            node,
                            messageId: "useArrayMap",
                            fix: function(fixer) {
                                const restArguments = reduceNodesText(rest, sourseCode);
                                return fixer.replaceTextRange([start, end], `${sourseCode.getText(first)}.map(${restArguments})`);
                            }
                        });
                    }

                    // Не можем определить тип переменной, замена с проверкой типа
                    // TODO

                }


                // первый аргумент - вызов функции
                if(first.type === NODE_TYPES.CALL_EXPRESSION) {
                    if(astUtils.isArrayFromMethod(first.callee)) {
                        return context.report({
                            node,
                            messageId: "useArrayMap",
                            fix: function(fixer) {
                                const restArguments = reduceNodesText(rest, sourseCode);
                                return fixer.replaceTextRange([start, end], `${sourseCode.getText(first)}.map(${restArguments})`);
                            }
                        });
                    } else {
                        // TODO работа с параметрами больше чем с 1
                        const firstParameterText = sourseCode.getText(first);
                        const collectionDefinition = `const collection = ${firstParameterText};\n`;

                        let mapFn = '';
                        let condition = '';
                        const restedText = sourseCode.getText(rest[0]);
                        const restParameterType = rest[0].type;

                        if(restParameterType === NODE_TYPES.ARROW_FUNCTION_EXPRESSION || restParameterType === NODE_TYPES.FUNCTION_EXPRESSION) {
                            mapFn = `const mapFn = ${restedText};\n`;
                            condition = `Array.isArray(collection) ? collection.map(mapFn) : _.map(collection, mapFn)`;
                        } else {
                            condition = `Array.isArray(collection) ? collection.map(${restedText}) : _.map(collection, ${restedText})`;
                        }

                        // замена текста вокруг родителя
                        const targetParent = findParentNode(node);

                        return context.report({
                            node: node,
                            messageId: "useArrayMap",
                            fix: function(fixer) {
                                return [
                                    fixer.insertTextBefore(targetParent, mapFn),
                                    fixer.insertTextBefore(targetParent, collectionDefinition),
                                    fixer.replaceText(node, condition)
                                ];
                            }
                        });
                    }
                }

            }


        };
    }
};
