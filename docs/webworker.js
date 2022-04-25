"use strict";
var HypothesisTest = /** @class */ (function () {
    function HypothesisTest(assumption) {
        this.assumption = assumption;
    }
    HypothesisTest.prototype.test = function (a, b, c) {
        return eval(this.assumption);
    };
    return HypothesisTest;
}());
var rules = [
    [function (a, b, c) { return (a < b && b < c); }],
    [
        function (a, b, c) { return (a > b && b > c); },
        function (a, b, c) { return (a + b < c); },
        function (a, b, c) { return (a + b > c); },
        function (a, b, c) { return (a + c < b); },
        function (a, b, c) { return (a + c > b); },
        function (a, b, c) { return (b + c < a); },
        function (a, b, c) { return (b + c > a); },
        function (a, b, c) { return (a + b === a); },
        function (a, b, c) { return (a + c === b); },
        function (a, b, c) { return (a + b === c); }
    ],
    [
        function (a, b, c) { return (a <= b && b <= c); },
        function (a, b, c) { return (a <= b && b < c); },
        function (a, b, c) { return (a < b && b <= c); },
        function (a, b, c) { return (a >= b && b >= c); },
        function (a, b, c) { return (a > b && b >= c); },
        function (a, b, c) { return (a >= b && b > c); },
        function (a, b, c) { return (a + b <= c); },
        function (a, b, c) { return (a + b >= c); },
        function (a, b, c) { return (a + c <= b); },
        function (a, b, c) { return (a + c >= b); },
        function (a, b, c) { return (b + c <= a); },
        function (a, b, c) { return (b + c >= a); }
    ]
];
var level = 0;
var rule = rules[level][0];
function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function testHypothesis(assumption) {
    if (!assumption || assumption.length <= 5) {
        return;
    }
    if (assumption.indexOf('=>') > -1 && !confirm("'=>' in JS doesn't mean equal-or-great. Do you with to process?")) {
        return;
    }
    var hypothesis = new HypothesisTest(assumption);
    for (var a = 0; a < 10; a++) {
        for (var b = 0; b < 10; b++) {
            for (var c = 0; c < 10; c++) {
                try {
                    if (hypothesis.test(a, b, c) !== rule(a, b, c)) {
                        return false;
                    }
                }
                catch (err) {
                    console.error(err);
                    return false;
                }
            }
        }
    }
    return true;
}
self.addEventListener('message', function (evt) {
    switch (evt.data.type) {
        case 'restart':
            if (level < rules.length - 1) {
                level++;
            }
            rule = randomPick(rules[level]);
            break;
        case 'test':
            var _a = evt.data, a = _a.a, b = _a.b, c = _a.c;
            self.postMessage({ type: 'tested', a: a, b: b, c: c, actual: rule(a, b, c) });
            break;
        case 'testHypothesis':
            self.postMessage({
                type: 'finish',
                isSuccess: testHypothesis(evt.data.assumption),
                expected: evt.data.assumption,
                actual: rule.toString(),
                pong: evt.data.ping
            });
            break;
    }
}, false);
