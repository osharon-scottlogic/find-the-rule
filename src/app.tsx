import { h, render, Component } from 'https://unpkg.com/preact?module';

(() =>{
	type Test = {a:number,b:number,c:number, expected?:boolean, actual: boolean}
	type Values = {a:number|'', b:number|'', c:number|''};
	type State = {tests:Test[], level: number, assumption?:string, isFinished:boolean, val: Values};
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

	let rule:Rule = rules[0][0];
	let isSuccess = false;

	function randomPick(arr:any[]):any {
		return arr[Math.floor(Math.random()*arr.length)];
	}

	function getState(level:number):State {
		if (level < rules.length - 1) {
			level++;
		}
		
		rule = randomPick(rules[level]);

		return {
			tests:[{a:1,b:2,c:3,actual:rule(1,2,3)}],
			assumption: '',
			isFinished: false,
			val:{a:'',b:'',c:''},
			level
		};
	}
	class App extends Component {
		state:State = getState(0);

		//@ts-ignore
		addTest = (newTest:Test) => this.setState(state => ({ ...state, tests: [...state.tests, newTest ]}));
		setAssumption = (assumption:string) => this.setState(state => ({ ...state, assumption}));
		finish = () => this.setState(state => ({ ...state, isFinished: true}));

		restart = () => {
			isSuccess = false;
			this.setState(getState(this.state.level)); 
		};

		test = () => { 
			const a = +this.state.val.a;
			const b = +this.state.val.b;
			const c = +this.state.val.c;
			this.addTest({a,b,c, actual: rule(a,b,c)});
		};

		updateVal = (key:'a'|'b'|'c', evt:Event) => {
			const val:Values = {...this.state.val};
			val[key] = +(evt.target as HTMLInputElement).value;
			this.setState({...this.state, val});
		}

		updateAssumption = (evt:Event) => this.setAssumption((evt.target as HTMLInputElement).value);

		procFormAndCancelSubmit = (method:(evt:Event)=>void,evt:Event) => { 
			method(evt)
			
			evt.preventDefault();
			return false;
		}

		makeAssumption = () => { 
			let assumption = this.state.assumption as string;

			if (!assumption || assumption.length <= 5) {
				return;
			}

			if (assumption.indexOf('=>') > -1 && !confirm(`'=>' in JS doesn't mean equal-or-great. Do you with to process?`)) {
				return
			}

			const hypothesis:HypothesisTest = new HypothesisTest(assumption);
			
			for (let a=0;a<10;a++) {
				for (let b=0;b<10;b++) {
					for (let c=0;c<10;c++) {
						try {
							if (hypothesis.test(a,b,c) !== rule(a,b,c)) {
								return this.finish();
							}
						}
						catch(err) {
							console.error(err);
							return this.finish();
						}
					}
				}
			}
			isSuccess = true;
			return this.finish();
		};

		render(props:any, state:State) {
			return (
				<main>
					<section class="experiment">
						<h2>1. Experiment</h2>
						<form onSubmit={this.procFormAndCancelSubmit.bind(null, this.test)} className="testForm">
							<input type="number" min={0} max={99} value={state.val.a} onInput={this.updateVal.bind(null,'a')} />
							<input type="number" min={0} max={99} value={state.val.b} onInput={this.updateVal.bind(null,'b')}/>
							<input type="number" min={0} max={99} value={state.val.c} onInput={this.updateVal.bind(null,'c')} />
							<button type="submit">Check</button>
						</form>
					</section>
					<aside class="results">
						<h2>2. Observe The Results</h2>
						<ol>{ state.tests.map(({a, b, c, actual}) => <li><span>{a}</span><span>{b}</span><span>{c}</span><span> {actual ? '✅': '❌'}</span></li>)}</ol>
					</aside>
					<section class="hyposis">
						<h2>3. Submit Your Hypothesis</h2>
						<div class="warning">Careful! you can only submit once!</div>
						<form onSubmit={this.procFormAndCancelSubmit.bind(null, this.makeAssumption)}>
							<code><pre>(a,b,c) =&gt; {'{'} return <input value={state.assumption} onInput={this.updateAssumption} type="text" minLength={5}/> {'}'};</pre></code>
							<button type="submit">Submit</button>
						</form>
						{ (state.isFinished) ? (isSuccess ?
							<dialog open>
							Well done!
							<button onClick={this.restart} class="restart">🔄 Try Another</button>
							</dialog> : <dialog open>
								<h2>Fail!</h2>
								You suggest <code><pre class="expected">function (a, b, c) {'{'} return ({state.assumption}); {'}'}</pre></code>
								But the rule was <code><pre class="actual">{rule.toString()}</pre></code>
								<button onClick={this.restart} class="restart">🔄 Try Another</button>
							</dialog>) :'' }
					</section>
				</main>
			);
		}
	}

	window.addEventListener('load', () => render(<App />, document.body));
})();