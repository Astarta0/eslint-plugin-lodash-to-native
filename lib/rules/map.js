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
    OBJECT_EXPRESSION: 'ObjectExpression',
    ASSIGNMENT_EXPRESSION: 'AssignmentExpression',
    IF_STATEMENT: 'IfStatement',
    MEMBER_EXPRESSION: 'MemberExpression',
    UNARY_EXPRESSION: 'UnaryExpression'
};

const STATEMENT_CONTAINERS_TYPES = ['Program', 'BlockStatement'];
const CONDITION_TYPES = ['IfStatement', 'ConditionalExpression'];

const arrayOrTypedArrayPattern = /Array$/u;

function isArrayMethod(node) {
    return (
        node.type === "MemberExpression" &&
        node.object.type === "Identifier" &&
        arrayOrTypedArrayPattern.test(node.object.name) &&
        node.property.type === "Identifier" &&
        node.property.name === "isArray" &&
        node.computed === false
    );
}

/**
 * Найти ближайший statement
 * @param node
 */
const findClosestStatement = node => {
    if (!node.parent) return null;
    node = node.parent;
    if (STATEMENT_CONTAINERS_TYPES.includes(node.parent.type)) {
        return node;
    } else {
        return findClosestStatement(node);
    }
};

/**
 * Найти ближайшее условие
 * @param node
 */
const findClosestCondition = node => {
    if (!node.parent) return null;
    node = node.parent;
    if (CONDITION_TYPES.includes(node.type)) {
        return node;
    } else {
        return findClosestCondition(node);
    }
};

/**
 * Найти ближайшее условие
 * @param node
 */
const findClosestConditionBranch = node => {
    if (!node || !node.parent) return null;
    if (CONDITION_TYPES.includes(node.parent.type)) {
        return node;
    } else {
        return findClosestConditionBranch(node.parent);
    }
};

function isAlternateBranch(node) {
    const branch = findClosestConditionBranch(node);
    if (!branch) return;
    const condition = branch.parent;
    return condition.alternate === branch
}

function isConsequentBranch(node) {
    const branch = findClosestConditionBranch(node);
    if (!branch) return;
    const condition = branch.parent;
    return condition.consequent === branch
}

const isFirstArgumentName = (callExpression, name) => {
    return Boolean(
        callExpression.arguments.length &&
        callExpression.arguments[0] &&
        callExpression.arguments[0].name &&
        callExpression.arguments[0].name === name
    );
};

const isIsArrayCondition = (condition, firstParameterText) => {
    return (
        // условие состоит из Array.isArray
        condition.test.type === NODE_TYPES.CALL_EXPRESSION &&
        isArrayMethod(condition.test.callee) &&
        // проверяет тип первого аргумента
        isFirstArgumentName(condition.test, firstParameterText)
    );
};

const isNegativeIsArrayCondition = (condition, firstParameterText) => {
    return (
        condition.test.type === NODE_TYPES.UNARY_EXPRESSION &&
        condition.test.operator === '!' &&
        isArrayMethod(condition.test.argument.callee) &&
        // проверяет тип первого аргумента
        isFirstArgumentName(condition.test.argument, firstParameterText)
    );
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

const wasLodashOverridden = (node, scope) => {
    const lodash = astUtils.getVariableByName(scope, '_');
    const refs = lodash ? lodash.references : [];

    for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        if(ref.init) continue;

        if (ref.identifier.start < node.start) {
            return true;
        }
    }
    return false;
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

                if (wasLodashOverridden(node, scope)) return;

                // использование _.map для литералов объектов допустимо
                // пропускаем такие ноды
                if (first.type === NODE_TYPES.OBJECT_EXPRESSION) {
                    return;
                }

                const firstParameterText = sourceCode.getText(first);
                const callbackNodeText = sourceCode.getText(callback);
                const restArguments = getTextOfRestArguments(rest, sourceCode);

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

                const buildCondition = (collectionText, callbackText) => {
                    collectionText = collectionText || firstParameterText;
                    callbackText = callbackText || callbackNodeText;
                    let contextParameter = '';
                    if (callbackContext) {
                        contextParameter = ', ' + sourceCode.getText(callbackContext);
                    }
                    const condition = `Array.isArray(${collectionText}) ? ${collectionText}.map(${callbackText}${contextParameter}) : _.map(${collectionText}, ${callbackText}${contextParameter})`;
                    if (node.parent.type === NODE_TYPES.MEMBER_EXPRESSION) {
                        return `(${condition})`;
                    }
                    return condition;
                };

                const outerCondition = findClosestCondition(node);

                // внутри условия
                if (outerCondition) {
                    // это Array.isArray(collection)
                    if (isIsArrayCondition(outerCondition, firstParameterText)) {
                        // это основная ветка
                        if (isConsequentBranch(node)) {
                            return makeSimpleReplace();
                        }
                        // это альтернативная ветка
                        if (isAlternateBranch(node)) {
                            return;
                        }
                    }
                    // это !Array.isArray(collection)
                    if (isNegativeIsArrayCondition(outerCondition, firstParameterText)) {
                        // это основная ветка
                        if (isConsequentBranch(node)) {
                            return;
                        }
                        // это альтернативная ветка
                        if (isAlternateBranch(node)) {
                            return makeSimpleReplace();
                        }
                    }
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
