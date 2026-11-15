export type CareRoutine={id:string;name:string;record:(day:string)=>boolean|null};
export function careTotals(routines:CareRoutine[],days:string[]){let done=0,total=0;for(const day of days)for(const routine of routines){const value=routine.record(day);if(value!==null){total++;if(value)done++}}return{done,total,percent:total?Math.round(done/total*100):0}}
