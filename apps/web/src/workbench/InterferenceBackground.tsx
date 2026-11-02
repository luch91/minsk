import {memo,useEffect,useRef} from 'react';

/** Decorative Canvas 2D surface. Mounted once above every workspace view. */
export const InterferenceBackground=memo(function InterferenceBackground({enabled}:{enabled:boolean}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const phase=useRef(0);
  useEffect(()=>{
    const canvas=canvasRef.current;
    let context:CanvasRenderingContext2D|null=null;
    try{context=canvas?.getContext('2d')??null;}catch{/* A blocked canvas must never block investigation controls. */}
    if(!canvas||!context){canvas?.setAttribute('data-motion-state','unavailable');return;}
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    let width=0,height=0,frame=0,last:number|null=null,lastPaint=0,disposed=false;
    function paint(){
      if(!context||!canvas)return;
      context.clearRect(0,0,width,height);
      const angle=phase.current*Math.PI*2/32;
      const compact=width<701;
      const rings=compact?22:34,samples=compact?80:120;
      const extent=Math.max(width,height)*.68;
      for(let field=0;field<2;field++){
        const cx=width*(field===0?.35:.70)+width*.065*Math.cos(angle+field*Math.PI);
        const cy=height*(field===0?.59:.46)+height*.065*Math.sin(angle+field*Math.PI);
        for(let ring=1;ring<=rings;ring++){
          const radius=ring/rings*extent;
          const alpha=(1-ring/(rings+4))*.25;
          context.beginPath();
          for(let point=0;point<=samples;point++){
            const a=point/samples*Math.PI*2;
            const r=radius+extent*.018*Math.sin(a*3+angle+ring*.09)+extent*.009*Math.cos(a*5-angle);
            const x=cx+r*Math.cos(a),y=cy+r*.66*Math.sin(a);
            if(point===0)context.moveTo(x,y);else context.lineTo(x,y);
          }
          context.strokeStyle=field===0?`rgba(70,155,185,${alpha})`:`rgba(100,170,175,${alpha})`;
          context.lineWidth=.8;context.stroke();
        }
      }
      canvas.dataset.phase=phase.current.toFixed(3);
    }
    function tick(now:number){
      if(disposed)return;
      if(last!==null)phase.current+=Math.min(now-last,100)/1000;
      last=now;
      if(now-lastPaint>=1000/24){paint();lastPaint=now;}
      frame=requestAnimationFrame(tick);
    }
    function sync(){
      cancelAnimationFrame(frame);last=null;
      const reduced=media.matches;
      canvas!.dataset.motionState=!enabled?'paused':reduced?'reduced':document.hidden?'hidden':'running';
      paint();
      if(enabled&&!reduced&&!document.hidden)frame=requestAnimationFrame(tick);
    }
    function resize(){
      const bounds=canvas!.getBoundingClientRect();width=bounds.width;height=bounds.height;
      // Bound backing-store size on high-DPI and wide displays; the UI itself stays native resolution.
      const ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(2_000_000/Math.max(1,width*height)));
      canvas!.width=Math.max(1,Math.round(width*ratio));canvas!.height=Math.max(1,Math.round(height*ratio));
      context!.setTransform(ratio,0,0,ratio,0,0);paint();
    }
    resize();sync();
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);observer?.observe(canvas);
    window.addEventListener('resize',resize);
    media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
    return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',resize);media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
  },[enabled]);
  return <canvas ref={canvasRef} className="interference-background" aria-hidden="true" data-testid="interference-background"/>;
});
