import { http } from '@renderer/src/utils/http'

export default {
  smsCode: async (data: SmsCodeRequest) => await http.post('/api/auth/send-sms', data),
  login: async (data: LoginRequest) => await http.post('api/auth/login', data),
  hospital: async (data: HospitalRequest) => await http.post('api/hospital/list', data),
  order: async (data: OrderRequest) => await http.post('api/order/query', data)
}

export interface SmsCodeRequest {
  phone: string
  sign: string
  timestamp: string
}

export interface LoginRequest {
  account: string
  password: string
  code: string
  sign: string
  timestamp: string
}

export interface HospitalRequest {
  sign: string
  timestamp: string
}

export interface OrderRequest {
  sign: string
  timestamp: string
}
