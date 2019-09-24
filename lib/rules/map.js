/**
 * @fileoverview description for rule
 * @author Anastasia
 */
"use strict";

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
        fixable: code,  // or "code" or "whitespace"
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
                    let variableType;
                    const globalScope = context.getScope();
                    const { set, childScopes } = globalScope;

                    //  проверим переменные текущего scope
                    if(set.has(varName)) {
                        const { defs } = set.get(varName);
                        const defNode = defs[0].node;
                        variableType = defNode.init.type;
                    } else {
                        // надо проверить родительские скоупы, если в текущем переменной не нашлось
                    }

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



            }


        };
    }
};

/*
export default function(context) {
  return {
    'CallExpression[callee.type="MemberExpression"][callee.object.name="_"][callee.property.name="map"][arguments > ArrayExpression]'(
      node
    ) {
      const { start, end, arguments: args } = node;
      const [first, ...rest] = args;

      console.log({ start, end, node, rest });
      if (isArrayExpression(first)) {
        //console.log(context.getAncestors());

        context.report({
          node,
          message: "Use native JavaScript map()",
          fix: fixer => {
            const sourseCode = context.getSourceCode();
            //console.log(sourseCode.getText(node));

            const txt = rest.reduce(
              (acc,node) => {
                const nodeText = sourseCode.getText(node);
                acc = acc + nodeText;
                return acc;
              },
              ""
            );

            console.log({txt});

            return fixer.replaceTextRange([start, end], `${sourseCode.getText(first)}.map(${txt})`);
          }
        });
      }
    },
    onCodePathSegmentStart: function(codePath, node) {
      // at the start of analyzing a code path
      //console.log(codePath);
      //console.log('node: ', node);
    },
    onCodePathEnd: function(codePath, node) {
      // at the end of analyzing a code path
    }
  };
}

function isLodashMapMemberExpression(node) {
  if (node.object.name === "_" && node.property.name === "map") return true;
  return false;
}

function isArrayExpression(node) {
  return node.type === "ArrayExpression";
}

 */
