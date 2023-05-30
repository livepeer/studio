import { Asset, Stream, User } from "@livepeer.studio/api";

export type FileUpload = {
  file: File;
  progress?: number;
  error?: Error;
  updatedAt: number;
  completed: boolean;
};

export type FileUploadsDictionary = {
  [key: string]: FileUpload;
};

export type ApiState = {
  user?: User;
  token?: string;
  userRefresh?: number;
  noStripe?: boolean;
  currentFileUploads?: FileUploadsDictionary;
  latestGetAssetsResult?: Asset[];
};

export interface UsageData {
  sourceSegments: number;
  transcodedSegments: number;
  sourceSegmentsDuration: number;
  transcodedSegmentsDuration: number;
}

export interface BillingUsageData {
  DeliveryUsageMins: number;
  TotalUsageMins: number;
  StorageUsageMins: number;
}

export interface BillingUsageDataWithTimestamp {
  timestamp: number;
  data: BillingUsageData;
}

export interface StreamInfo {
  stream: Stream;
  session?: Stream;
  isPlaybackid: boolean;
  isSession: boolean;
  isStreamKey: boolean;
  user: User;
}

export interface Version {
  tag: string;
  commit: string;
}

export interface Ingest {
  ingest: string;
  playback: string;
  base: string;
}
