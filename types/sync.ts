export type CommandType = 'IMPORT' | 'UPDATE' | 'IMPORT_BATCH';

export interface QueueCommand {
  id: string;
  type: CommandType;
  payload: any;
  timestamp: number;
  status?: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount?: number;
}