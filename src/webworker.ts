type Rule = (a:number, b:number, c:number)=>boolean;

class HypothesisTest {
	assumption:string;

	constructor(assumption:string) {
		this.assumption = assumption;
	}

	test(a:number,b:number,c:number) {
		return eval(this.assumption);
	}
}

const rules:Rule[][] = [
	[(a,b,c)=>(a<b && b<c)],
	[
		(a,b,c)=>(a>b && b>c),
		(a,b,c)=>(a+b < c),
		(a,b,c)=>(a+b > c),
		(a,b,c)=>(a+c < b),
		(a,b,c)=>(a+c > b),
		(a,b,c)=>(b+c < a),
		(a,b,c)=>(b+c > a),
		(a,b,c)=>(a+b === a),
		(a,b,c)=>(a+c === b),
		(a,b,c)=>(a+b === c)
	],
	[
		(a,b,c)=>(a<=b && b<=c),
		(a,b,c)=>(a<=b && b<c),
		(a,b,c)=>(a<b && b<=c),
		(a,b,c)=>(a>=b && b>=c),
		(a,b,c)=>(a>b && b>=c),
		(a,b,c)=>(a>=b && b>c),
		(a,b,c)=>(a+b <= c),
		(a,b,c)=>(a+b >= c),
		(a,b,c)=>(a+c <= b),
		(a,b,c)=>(a+c >= b),
		(a,b,c)=>(b+c <= a),
		(a,b,c)=>(b+c >= a)
	]];

let level = 0;
let rule:Rule = rules[level][0];

function randomPick(arr:any[]):any {
	return arr[Math.floor(Math.random()*arr.length)];
}

function testHypothesis(assumption:string) {
	if (!assumption || assumption.length <= 5) {
		return;
	}

	const hypothesis:HypothesisTest = new HypothesisTest(assumption);
	
	for (let a=0;a<10;a++) {
		for (let b=0;b<10;b++) {
			for (let c=0;c<10;c++) {
				try {
					if (hypothesis.test(a,b,c) !== rule(a,b,c)) {
						return false;
					}
				}
				catch(err) {
					console.error(err);
					return false;
				}
			}
		}
	}
	return true;
}

self.addEventListener('message', function(evt:MessageEvent) {
	switch (evt.data.type) {
		case 'restart':
			if (level < rules.length - 1) {
				level++;
			}
			
			rule = randomPick(rules[level]);
			break;
		case 'test':
			const {a,b,c}:{a:number,b:number,c:number} = evt.data;
			self.postMessage({type:'tested', a,b,c, actual: rule(a,b,c) });
			break;
		case 'testHypothesis':
			self.postMessage({
				type:'finish',
				isSuccess:testHypothesis(evt.data.assumption),
				expected:evt.data.assumption,
				actual: rule.toString(),
				pong: evt.data.ping
			});
			break;
	}
}, false);