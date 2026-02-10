import { defineStore } from 'pinia'
import BaseApi from '@renderer/src/api/base'
import { IPC_CHANNEL } from '@shared/config/ipcChannel'

export const useHospitalStore = defineStore('hospital', {
  state: () => ({
    hospitalList: [] as Hospital[]
  }),
  actions: {
    async getHospitalList() {
      try {
        const timestamp = Date.now().toString()
        const sign = (await window.electron.ipcRenderer.invoke(
          IPC_CHANNEL.DEVICE_ID,
          timestamp
        )) as string
        const res: any = await BaseApi.hospital({
          sign,
          timestamp
        })

        // 兼容处理：如果返回的是 { data: [...] } 结构
        const hospitalList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []

        this.hospitalList = hospitalList
        console.log('Hospital List:', this.hospitalList)
      } catch (error) {
        console.error('获取医院列表失败:', error)
        this.hospitalList = []
      }
    }
  }
})

interface Hospital {
  hospitalCode: string
  hospitalName: string
  id: number
}
