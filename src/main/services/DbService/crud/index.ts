import setting from './setting'

interface ICrudService {
  setting: typeof setting
}

const crudService: ICrudService = { setting }

export default crudService
