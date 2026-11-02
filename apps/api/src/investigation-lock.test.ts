import {describe,it,expect,vi} from 'vitest';
import {BudgetLedger} from './budget';

describe('persistent investigation lease',()=>{
 it('covers long fallback requests and prevents an expired owner from releasing a newer lease',async()=>{
  const {DatabaseSync}=await vi.importActual<{DatabaseSync:new(path:string)=>{exec(query:string):void;prepare(query:string):{all(...args:Array<string|number|null>):unknown[]};close():void}}>('node:sqlite');
  const db=new DatabaseSync(':memory:');
  // Start with the deployed pre-migration schema.
  db.exec('CREATE TABLE investigation_lock (id INTEGER PRIMARY KEY CHECK (id=1), started INTEGER NOT NULL)');
  const sql={exec:(query:string,...args:Array<string|number|null>)=>{const rows=db.prepare(query).all(...args);return {toArray:()=>rows,one:()=>rows[0]};}};
  const ledger=Object.assign(Object.create(BudgetLedger.prototype) as BudgetLedger,{ctx:{storage:{sql}},env:{}});
  const now=vi.spyOn(Date,'now').mockReturnValue(1_000_000);
  try{
   expect(ledger.acquireInvestigation('first')).toBe(true);
   now.mockReturnValue(1_105_000);expect(ledger.acquireInvestigation('overlap')).toBe(false);
   now.mockReturnValue(1_181_000);expect(ledger.acquireInvestigation('replacement')).toBe(true);
   ledger.releaseInvestigation('first');expect(ledger.acquireInvestigation('third')).toBe(false);
   ledger.releaseInvestigation('replacement');expect(ledger.acquireInvestigation('third')).toBe(true);
  }finally{now.mockRestore();db.close();}
 });
});
