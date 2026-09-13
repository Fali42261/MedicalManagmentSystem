import { BACKEND_API_ENDPOINTS } from '../constants/api.constants';import { backendClient } from './backendClient';export const reportApi=Object.freeze({summary:q=>backendClient.get(BACKEND_API_ENDPOINTS.REPORT_SUMMARY,q),compliance:q=>backendClient.get(BACKEND_API_ENDPOINTS.COMPLIANCE_SUMMARY,q)})

