import { h, render, Component } from 'https://unpkg.com/preact?module';

(() =>{
	type Test = {a:number,b:number,c:number, expected?:boolean, actual: boolean}
	type Values = {a:number|'', b:number|'', c:number|''};
	type State = {tests:Test[], assumption?:string, actual?:string, isFinished:boolean, val: Values };

	const worker = new Worker("webworker.js");
	let isSuccess = false;
	let ping = Math.random();

	function getState():State {
		return {
			tests:[],
			assumption: '',
			actual: '',
			isFinished: false,
			val:{a:'',b:'',c:''},
		};
	}
	class App extends Component {
		state:State = getState();

		//@ts-ignore
		addTest = (newTest:Test) => this.setState(state => ({ ...state, tests: [...state.tests, newTest ]}));
		setAssumption = (assumption:string) => this.setState(state => ({ ...state, assumption}));
		finish = () => this.setState(state => ({ ...state, isFinished: true}));

		constructor() {
			super();
			worker.addEventListener('message', (evt:MessageEvent) => {
				switch(evt.data.type) {
					case 'tested':
						const {a,b,c, actual}:{a:number,b:number,c:number, actual:boolean } = evt.data;
						this.addTest({a,b,c, actual});
						break;
					case 'finish':
						isSuccess = evt.data.isSuccess && (ping===evt.data.pong);
						this.setState(state => ({ ...state, actual: evt.data.actual, expected: evt.data.expected}));
						this.finish();
						break;
				}
			});

			worker.postMessage({type:'test', a:1, b:2, c:3 });
		}
		restart = () => {
			isSuccess = false;
			this.setState(getState()); 
			worker.postMessage({type:'restart'});
			worker.postMessage({type:'test', a:1, b:2, c:3 });
		};

		test = () => { 
			const a = +this.state.val.a;
			const b = +this.state.val.b;
			const c = +this.state.val.c;
			worker.postMessage({type: 'test', a,b,c});
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
			ping = Math.random();
			worker.postMessage({ type: 'testHypothesis', assumption: this.state.assumption, ping })
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
								But the rule was <code><pre class="actual">{state.actual}</pre></code>
								<button onClick={this.restart} class="restart">🔄 Try Another</button>
							</dialog>) :'' }
					</section>
				</main>
			);
		}
	}

	window.addEventListener('load', () => render(<App />, document.body));
})();