import { BACKEND_API_ENDPOINTS } from '../constants/api.constants'; import { backendClient } from './backendClient'
export const storeApi=Object.freeze({getAll:()=>backendClient.get(BACKEND_API_ENDPOINTS.STORES,{page:1,pageSize:200}).then(r=>r.items),create:p=>backendClient.post(BACKEND_API_ENDPOINTS.STORES,p)})
export const adminUserApi=Object.freeze({getAll:()=>backendClient.get(BACKEND_API_ENDPOINTS.ADMIN_USERS,{page:1,pageSize:200}).then(r=>r.items),create:p=>backendClient.post(BACKEND_API_ENDPOINTS.ADMIN_USERS,p),update:(id,p)=>backendClient.put(BACKEND_API_ENDPOINTS.ADMIN_USER_BY_ID(id),p)})
export const backupApi=Object.freeze({getAll:()=>backendClient.get(BACKEND_API_ENDPOINTS.BACKUPS,{page:1,pageSize:200}).then(r=>r.items),create:type=>backendClient.post(BACKEND_API_ENDPOINTS.BACKUPS,{type})})

