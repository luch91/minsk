// Exact expected validation failures for locked invalid fixtures. Unexpected exceptions fail closed.
export const expectedValidationErrors:Record<string,string>={
  'MFB-11':'Missing step reference missing-step',
  'MFB-12':'Invalid source evidence span',
};
export function expectedInvalidCase(id:string,error:unknown){return error instanceof Error&&expectedValidationErrors[id]===error.message;}
