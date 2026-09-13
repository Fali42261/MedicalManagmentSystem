import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'; import { backendClient } from './backendClient'
const map=x=>({...x,code:x.code,name:x.name,appliesTo:x.appliesTo,type:x.schemeType,value:Number(x.value),validFrom:x.validFrom,validUntil:x.validUntil,status:x.isActive?'Active':'Inactive'})
const body=(x,v)=>({name:x.name,appliesTo:x.appliesTo,schemeType:x.type,value:Number(x.value),validFrom:x.validFrom,validUntil:x.validUntil,...(v?{isActive:x.isActive,rowVersion:x.rowVersion}:{})})
export const schemeApi=Object.freeze({getAll:()=>backendClient.get(BACKEND_API_ENDPOINTS.SCHEMES,{page:1,pageSize:200}).then(r=>r.items.map(map)),create:x=>backendClient.post(BACKEND_API_ENDPOINTS.SCHEMES,body(x)).then(map),update:(id,x)=>backendClient.put(BACKEND_API_ENDPOINTS.SCHEME_BY_ID(id),body(x,true)).then(map),delete:id=>backendClient.delete(BACKEND_API_ENDPOINTS.SCHEME_BY_ID(id))})

