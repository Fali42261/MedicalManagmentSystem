import { BACKEND_API_ENDPOINTS } from '../constants/api.constants';import { backendClient } from './backendClient';export const settingsApi=Object.freeze({get:()=>backendClient.get(BACKEND_API_ENDPOINTS.SETTINGS),update:values=>backendClient.put(BACKEND_API_ENDPOINTS.SETTINGS,{values})})

