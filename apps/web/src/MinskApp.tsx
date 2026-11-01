import {useInvestigation} from './useInvestigation';
import {Workbench} from './workbench/Workbench';
export default function MinskApp(){const state=useInvestigation();if(!state.workflow)return <main className="loading-workspace"><h1>Minsk</h1><p role="status">{state.loading?'Loading workflow records...':'No workflow records available.'}</p>{state.error&&<p role="alert">{state.error}</p>}<button onClick={()=>location.reload()}>Retry loading</button></main>;return <Workbench state={state}/>;}
