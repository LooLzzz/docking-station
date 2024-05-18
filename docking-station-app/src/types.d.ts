
export interface MonitorSettings {
  lowThresholdMs: number
  highThresholdMs: number
  pingIntervalSec: number
}

export interface MonitorSettingsUpdate {
  lowThresholdMs?: number
  highThresholdMs?: number
  pingIntervalSec?: number
}

export interface MonitoredWebsiteResponse {
  url: string
  isActive: boolean
  friendlyName: string
  id: number
  createdAt: string
  updatedAt: string
}

export interface MonitoredWebsite extends MonitoredWebsiteResponse {
  createdAt: Date
  updatedAt: Date
}

export interface MonitoredWebsiteCreate {
  url: string
  friendlyName: string
  isActive: boolean
}

export interface MonitoredWebsiteUpdate {
  id: number
  url?: string
  isActive?: boolean
  friendlyName?: string
}

export interface HistoryRecordResponse {
  latencyMs: number
  websiteId: number
  id: number
  createdAt: string
}

export interface HistoryRecordClearResponse {
  affectedRows: number
  id: number
}

export interface HistoryRecord extends HistoryRecordResponse {
  createdAt: Date
}
