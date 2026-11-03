import {useState} from 'react';
import {useInvestigation} from './useInvestigation';
import {Workbench} from './workbench/Workbench';
import {InterferenceBackground} from './workbench/InterferenceBackground';
const motionKey='minsk-background-motion';
export default function MinskApp(){
  const state=useInvestigation();
  const [backgroundMotion,setBackgroundMotion]=useState(()=>{try{return localStorage.getItem(motionKey)!=='paused';}catch{return true;}});
  function changeMotion(enabled:boolean){setBackgroundMotion(enabled);try{localStorage.setItem(motionKey,enabled?'running':'paused');}catch{/* Storage is optional; the control still works for this session. */}}
  return <div className="application-frame"><InterferenceBackground enabled={backgroundMotion}/>{!state.workflow?<main className="loading-workspace" aria-busy={state.loading}><h1>Minsk</h1><p role="status">{state.loading?'Preparing investigation workspace...':'No workflow records available.'}</p>{state.error&&<p role="alert">{state.error}</p>}{!state.loading&&state.error&&<button onClick={()=>location.reload()}>Retry loading</button>}</main>:<Workbench state={state} backgroundMotion={backgroundMotion} onBackgroundMotionChange={changeMotion}/>}</div>;
}
