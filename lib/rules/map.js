const astUtils = require('eslint/lib/rules/utils/ast-utils');

//----------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------

const NODE_TYPES = {
    ARRAY_EXPRESSION: 'ArrayExpression',
    IDENTIFIER: 'Identifier',
    CALL_EXPRESSION: 'CallExpression',
    ARROW_FUNCTION_EXPRESSION: 'ArrowFunctionExpression',
    FUNCTION_EXPRESSION: 'FunctionExpression',
    OBJECT_EXPRESSION: 'ObjectExpression'
};

const STATEMENT_CONTAINERS_TYPES = ['Program', 'BlockStatement'];

/**
 * Найти ближайший statement
 * @param node
 */
const findClosestStatement = node => {
    if (!node.parent) return null;
    node = node.parent;
    if(STATEMENT_CONTAINERS_TYPES.includes(node.parent.type)) {
        return node;
    } else {
        return findClosestStatement(node);
    }
};

/**
 * Получить текст всех аргументов начиная со второго
 * @param nodes
 * @param sourceCode
 */
const getTextOfRestArguments = (nodes, sourceCode) => nodes.reduce((acc, node, idx) => {
    const txt = sourceCode.getText(node);
    acc = idx === 0 ? acc + txt : acc + ', ' + txt;
    return acc;
}, '');

/**
 * Получить свободное имя переменной для извлечения колбека
 * @param scope
 * @param name
 * @param iteration
 * @returns {string}
 */
const getFreeVariableName = (scope, name, iteration = 0) => {
    const varname = name + (iteration || '');
    const variable = astUtils.getVariableByName(scope, varname);
    if (variable) {
        return getFreeVariableName(scope, name, ++iteration);
    }
    return varname;
};


//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        messages: {
            useArrayMap: "Use native JavaScript Array.map() instead of _.map()"
        },
        docs: {
            description: "Replace _.map() with Array.prototype.map() if first argument is array",
            recommended: false
        },
        fixable: "code",
        schema: []
    },

    create(context) {
        return {
            'CallExpression[callee.type="MemberExpression"][callee.object.name="_"][callee.property.name="map"]'(node) {
                const { start, end, arguments: args } = node;
                const [ first, ...rest ] = args;
                const range = [start, end];
                const scope = context.getScope();
                const sourceCode = context.getSourceCode();
                const [callback, callbackContext] = rest;

                if (node.parent && node.parent.alternate === node) return;

                // использование _.map для литералов объектов допустимо
                // пропускаем такие ноды
                if (first.type === NODE_TYPES.OBJECT_EXPRESSION) {
                    return;
                }

                const firstParameterText = sourceCode.getText(first);
                const callbackNodeText = sourceCode.getText(callback);
                const restArguments = getTextOfRestArguments(rest, sourceCode);

                const buildCondition = (collectionText, callbackText) => {
                    collectionText = collectionText || firstParameterText;
                    callbackText = callbackText || callbackNodeText;
                    let contextParameter = '';
                    if (callbackContext) {
                        contextParameter = ', ' + sourceCode.getText(callbackContext);
                    }
                    return `Array.isArray(${collectionText}) ? ${collectionText}.map(${callbackText}${contextParameter}) : _.map(${collectionText}, ${callbackText}${contextParameter})`;
                };

                const report = fix => context.report({
                    node,
                    messageId: "useArrayMap",
                    fix
                });

                const makeSimpleReplace = () => report(fixer => (
                    fixer.replaceTextRange(range, `${firstParameterText}.map(${restArguments})`)
                ));

                // e.g. _.map([1, 2], fn)
                if(first.type === NODE_TYPES.ARRAY_EXPRESSION) {
                    return makeSimpleReplace();
                }

                // e.g. _.map(something, fn)
                const isIdentifier = first.type === NODE_TYPES.IDENTIFIER;

                // e.g. _.map(getItems(), fn)
                const isCallExpression = first.type === NODE_TYPES.CALL_EXPRESSION;

                if (isIdentifier) {
                    const variable = astUtils.getVariableByName(scope, first.name);
                    if (variable) {
                        const { defs } = variable;
                        const [definition] = defs;
                        // если переменная была объявлена через const полагаемся на то
                        // что ее значение не может быть переопределено в коде
                        if (definition.type === 'Variable' && definition.kind === 'const') {
                            const defNode = definition.node;
                            const defNodeType = defNode.init && defNode.init.type;
                            // для объектов использование _.map допускается
                            if (defNodeType === NODE_TYPES.OBJECT_EXPRESSION) {
                                return;
                            }
                            // для массивов можно сделать простую замену
                            if (defNodeType === NODE_TYPES.ARRAY_EXPRESSION) {
                                return makeSimpleReplace();
                            }
                        }
                    }
                }

                let collectionVariableName;
                let callbackVariableName;
                const extractions = [];

                if (isCallExpression) {
                    // можем сделать простую замену
                    if (astUtils.isArrayFromMethod(first.callee)) {
                        return makeSimpleReplace();
                    }
                    collectionVariableName = getFreeVariableName(scope, 'collection');
                    const collectionVariableDeclaration = `const ${collectionVariableName} = ${firstParameterText};\n`;
                    extractions.push(collectionVariableDeclaration);
                }

                if (
                    callback.type === NODE_TYPES.ARROW_FUNCTION_EXPRESSION ||
                    callback.type === NODE_TYPES.FUNCTION_EXPRESSION
                ) {
                    callbackVariableName = getFreeVariableName(scope, 'callback');
                    const callbackVariableDeclaration = `const ${callbackVariableName} = ${callbackNodeText};\n`;
                    extractions.push(callbackVariableDeclaration);
                }

                const closestStatement = findClosestStatement(node);
                const condition = buildCondition(collectionVariableName, callbackVariableName);

                return report(fixer => [
                    ...extractions.map(text => fixer.insertTextBefore(closestStatement, text)),
                    fixer.replaceText(node, condition)
                ]);
            }
        };
    }
};
