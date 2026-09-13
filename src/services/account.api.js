import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'; import { backendClient } from './backendClient'
export const accountApi=Object.freeze({getAll:()=>backendClient.get(BACKEND_API_ENDPOINTS.ACCOUNTS,{page:1,pageSize:200}).then(r=>r.items.map(x=>({...x,code:x.voucherNumber,date:x.createdAtUtc,party:x.accountName,mode:x.paymentMode,entry:x.direction,type:x.entryType,amount:Number(x.amount)}))),create:x=>backendClient.post(BACKEND_API_ENDPOINTS.ACCOUNTS,x)})

