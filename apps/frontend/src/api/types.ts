export type { TTaskEntity } from '../../server_types/src/types/shared.types'
export type { CreateTaskDto } from '../../server_types/src/task/dto/create-task.dto'
export type { TaskService } from '../../server_types/src/task/task.service'
export enum ExeTypes {
    'find_on_page_elements' = 0,
    'open_browser_tab' = 1
}
export const ExeTypesPayloadMap = {
    [ExeTypes.find_on_page_elements]: {
      url: 'google.com',
      queryToCount: '#ai-helper-widget',
    },
    [ExeTypes.open_browser_tab]: {
      url: 'google.com',
    },
  };
