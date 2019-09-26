# eslint-plugin-lodash-to-native

```
# Запустить тесты
npm run test

# Запустить для dubug'a и разработки
npm run debug
```

### Структура
```
│
├── lib/                   
│   └── rules/   
│       └──   map.js - файл реализации правила   
├── tests/
│    └── lib/ 
│        └── rules/ 
│            └── map.tests.js  - тесты для правила
└── debug.js  - файл, используемый для отладки и разработки
```


ESLint плагин включает правило с фиксом для функции _.map() библиотеки Lodash.
Правило находит использование функции `_.map`, например `_.map(collection, fn)`,
и, если это возможно, предлагает заменить его на использование нативного `Array.prototipe.map()`.

1. Если первый параметр в функции `_.map()` - это литерал массива, либо по скоупам можно определить, что это литерал массива,
то выполняется замена на вызов `Array.prototype.map()`;
2. Если первый параметр - это литерал объекта - никакая замена не предлагается и не выполняется.
3. Если нельзя точно определить тип переменной, то выполняется замена с проверкой через тернарный оператор:
`Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn);`
4. Если первый параметр - это вызов метода `Array.from(collection)`, выполняется замена на вызов `Array.prototype.map()`:
`Array.from(collection).map(fn)`
5. Если первый параметр - это вызов функции, и т.о. мы так же не можем определить точно его тип, то,
в замене, выносится вызов этой функции, чтобы не дублировать вычисления, в переменную, и вставляется строкой выше до
измененного вызова .map();
`
const collection = getItems();
Array.isArray(collection) ? collection.map(callback) : _.map(collection, callback);
`
6. Чтобы не дублировать вычисления, проверяется тип второго аргумента map, и если это функция, то ее вызов так же сохраняется в переменную
и выносится строкой выше до замены.
7. Есть проверка наличия существующих переменных в скоупе с именами, которые в правиле зарезервированы под
хранение collection и callback`a, которые передаются в вызов _.map().
Если с таким именем переменные существуют - правило меняет имя путем добавления числа, пока не найдет свободное имя.



 


## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-lodash-to-native`:

```
$ npm install eslint-plugin-lodash-to-native --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-lodash-to-native` globally.

## Usage

Add `lodash-to-native` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "lodash-to-native"
    ]
}
```





