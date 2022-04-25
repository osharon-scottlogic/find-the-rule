var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { h, render, Component } from 'https://unpkg.com/preact?module';
(function () {
    var worker = new Worker("webworker.js");
    var isSuccess = false;
    function getState() {
        return {
            tests: [],
            assumption: '',
            actual: '',
            isFinished: false,
            val: { a: '', b: '', c: '' },
        };
    }
    var App = /** @class */ (function (_super) {
        __extends(App, _super);
        function App() {
            var _this = _super.call(this) || this;
            _this.state = getState();
            //@ts-ignore
            _this.addTest = function (newTest) { return _this.setState(function (state) { return (__assign(__assign({}, state), { tests: __spreadArray(__spreadArray([], state.tests, true), [newTest], false) })); }); };
            _this.setAssumption = function (assumption) { return _this.setState(function (state) { return (__assign(__assign({}, state), { assumption: assumption })); }); };
            _this.finish = function () { return _this.setState(function (state) { return (__assign(__assign({}, state), { isFinished: true })); }); };
            _this.restart = function () {
                isSuccess = false;
                _this.setState(getState());
                worker.postMessage({ type: 'restart' });
                worker.postMessage({ type: 'test', a: 1, b: 2, c: 3 });
            };
            _this.test = function () {
                var a = +_this.state.val.a;
                var b = +_this.state.val.b;
                var c = +_this.state.val.c;
                worker.postMessage({ type: 'test', a: a, b: b, c: c });
            };
            _this.updateVal = function (key, evt) {
                var val = __assign({}, _this.state.val);
                val[key] = +evt.target.value;
                _this.setState(__assign(__assign({}, _this.state), { val: val }));
            };
            _this.updateAssumption = function (evt) { return _this.setAssumption(evt.target.value); };
            _this.procFormAndCancelSubmit = function (method, evt) {
                method(evt);
                evt.preventDefault();
                return false;
            };
            _this.makeAssumption = function () {
                worker.postMessage({ type: 'testHypothesis', assumption: _this.state.assumption });
            };
            worker.addEventListener('message', function (evt) {
                switch (evt.data.type) {
                    case 'tested':
                        var _a = evt.data, a = _a.a, b = _a.b, c = _a.c, actual = _a.actual;
                        _this.addTest({ a: a, b: b, c: c, actual: actual });
                        break;
                    case 'finish':
                        isSuccess = evt.data.isSuccess && (_this.state.assumption === evt.data.expected);
                        _this.setState(function (state) { return (__assign(__assign({}, state), { actual: evt.data.actual, expected: evt.data.expected })); });
                        _this.finish();
                        break;
                }
            });
            worker.postMessage({ type: 'test', a: 1, b: 2, c: 3 });
            return _this;
        }
        App.prototype.render = function (props, state) {
            return (h("main", null,
                h("section", { class: "experiment" },
                    h("h2", null, "1. Experiment"),
                    h("form", { onSubmit: this.procFormAndCancelSubmit.bind(null, this.test), className: "testForm" },
                        h("input", { type: "number", min: 0, max: 99, value: state.val.a, onInput: this.updateVal.bind(null, 'a') }),
                        h("input", { type: "number", min: 0, max: 99, value: state.val.b, onInput: this.updateVal.bind(null, 'b') }),
                        h("input", { type: "number", min: 0, max: 99, value: state.val.c, onInput: this.updateVal.bind(null, 'c') }),
                        h("button", { type: "submit" }, "Check"))),
                h("aside", { class: "results" },
                    h("h2", null, "2. Observe The Results"),
                    h("ol", null, state.tests.map(function (_a) {
                        var a = _a.a, b = _a.b, c = _a.c, actual = _a.actual;
                        return h("li", null,
                            h("span", null, a),
                            h("span", null, b),
                            h("span", null, c),
                            h("span", null,
                                " ",
                                actual ? '✅' : '❌'));
                    }))),
                h("section", { class: "hyposis" },
                    h("h2", null, "3. Submit Your Hypothesis"),
                    h("div", { class: "warning" }, "Careful! you can only submit once!"),
                    h("form", { onSubmit: this.procFormAndCancelSubmit.bind(null, this.makeAssumption) },
                        h("code", null,
                            h("pre", null,
                                "(a,b,c) => ",
                                '{',
                                " return ",
                                h("input", { value: state.assumption, onInput: this.updateAssumption, type: "text", minLength: 5 }),
                                " ",
                                '}',
                                ";")),
                        h("button", { type: "submit" }, "Submit")),
                    (state.isFinished) ? (isSuccess ?
                        h("dialog", { open: true },
                            "Well done!",
                            h("button", { onClick: this.restart, class: "restart" }, "\uD83D\uDD04 Try Another")) : h("dialog", { open: true },
                        h("h2", null, "Fail!"),
                        "You suggest ",
                        h("code", null,
                            h("pre", { class: "expected" },
                                "function (a, b, c) ",
                                '{',
                                " return (",
                                state.assumption,
                                "); ",
                                '}')),
                        "But the rule was ",
                        h("code", null,
                            h("pre", { class: "actual" }, state.actual)),
                        h("button", { onClick: this.restart, class: "restart" }, "\uD83D\uDD04 Try Another"))) : '')));
        };
        return App;
    }(Component));
    window.addEventListener('load', function () { return render(h(App, null), document.body); });
})();
