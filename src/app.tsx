import { h, render, Component } from 'https://unpkg.com/preact?module';

type Test = {a:number,b:number,c:number, expected?:boolean, actual: boolean}
type Values = {a:number|'', b:number|'', c:number|''};
type State = {tests:Test[], rule:Rule, level: number, assumption?:string, result?:boolean, val: Values};
type Rule = (a:number, b:number, c:number)=>boolean;

const rules:Rule[][] = [
	[(a,b,c)=>(a<b && b<c)],
	[
		(a,b,c)=>(a>b && b>c),
		(a,b,c)=>(a+b < c),
		(a,b,c)=>(a+b < c),
		(a,b,c)=>(a+c < b),
		(a,b,c)=>(a+c > b),
		(a,b,c)=>(b+c < a),
		(a,b,c)=>(b+c > a)
	],
	[
		(a,b,c)=>(a<=b && b<=c),
		(a,b,c)=>(a<=b && b<c),
		(a,b,c)=>(a<b && b<=c),
		(a,b,c)=>(a>=b && b>=c),
		(a,b,c)=>(a>b && b>=c),
		(a,b,c)=>(a>=b && b>c),
		(a,b,c)=>(a+b <= c),
		(a,b,c)=>(a+b <= c),
		(a,b,c)=>(a+c <= b),
		(a,b,c)=>(a+c >= b),
		(a,b,c)=>(b+c <= a),
		(a,b,c)=>(b+c >= a)
	]];

function randomPick(arr:any[]):any {
	return arr[Math.floor(Math.random()*arr.length)];
}

function getState(level:number):State {
	if (level < rules.length - 1) {
		level++;
	}
	const rule = randomPick(rules[level]);

	return {
		tests:[{a:1,b:2,c:3,actual:rule(1,2,3)}],
		assumption: '',
		result: undefined,
		val:{a:'',b:'',c:''},
		level,
		rule
	};
}
class App extends Component {
  state:State = getState(0);

	//@ts-ignore
  addTest = (newTest:Test) => this.setState(state => ({ ...state, tests: [...state.tests, newTest ]}));
	setAssumption = (assumption:string) => this.setState(state => ({ ...state, assumption}));
	setResult = (result:boolean) => this.setState(state => ({ ...state, result}));

	restart = () => this.setState(getState(this.state.level));

	test = () => { 
		const a = +this.state.val.a;
		const b = +this.state.val.b;
		const c = +this.state.val.c;
		this.addTest({a,b,c, actual:this.state.rule(a,b,c)});
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

	makeAssumption = (evt:Event) => { 
		const assumption = this.state.assumption as string;

		if (!assumption || assumption.length <= 5) {
			return;
		}

		const method:Rule = (a,b,c) => { return eval(assumption); }

		for (let a=0;a<10;a++) {
			for (let b=0;b<10;b++) {
				for (let c=0;c<10;c++) {
					if (method(a,b,c) !== this.state.rule(a,b,c)) {
						return this.setResult(false);
					}
				}
			}
		}
		this.setResult(true);
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
					{ (state.result!==undefined) ? (state.result!==true ?
						<dialog open>
							<h2>Fail!</h2>
							You suggest <code><pre class="expected">function (a, b, c) {'{'} return ({state.assumption}); {'}'}</pre></code>
							But the rule was <code><pre class="actual">{this.state.rule.toString()}</pre></code>
							<button onClick={this.restart} class="restart">🔄 Try Another</button>
						</dialog> : <dialog open>
							Well done!
							<button onClick={this.restart} class="restart">🔄 Try Another</button>
							</dialog>) :'' }
				</section>
			</main>
    );
  }
}

window.addEventListener('load', () => render(<App />, document.body));
