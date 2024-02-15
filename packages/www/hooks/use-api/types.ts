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
  refreshToken?: string;
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

export interface UpcomingInvoice {
  object: string;
  account_country: string;
  account_name: string;
  account_tax_ids: any;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  amount_shipping: number;
  application: any;
  application_fee_amount: any;
  attempt_count: number;
  attempted: boolean;
  automatic_tax: AutomaticTax;
  billing_reason: string;
  charge: any;
  collection_method: string;
  created: number;
  currency: string;
  custom_fields: any;
  customer: string;
  customer_address: any;
  customer_email: string;
  customer_name: any;
  customer_phone: any;
  customer_shipping: any;
  customer_tax_exempt: string;
  customer_tax_ids: any[];
  default_payment_method: any;
  default_source: any;
  default_tax_rates: any[];
  description: any;
  discount: any;
  discounts: any[];
  due_date: any;
  effective_at: any;
  ending_balance: number;
  footer: any;
  from_invoice: any;
  last_finalization_error: any;
  latest_revision: any;
  lines: Lines;
  livemode: boolean;
  metadata: Metadata4;
  next_payment_attempt: number;
  number: any;
  on_behalf_of: any;
  paid: boolean;
  paid_out_of_band: boolean;
  payment_intent: any;
  payment_settings: PaymentSettings;
  period_end: number;
  period_start: number;
  post_payment_credit_notes_amount: number;
  pre_payment_credit_notes_amount: number;
  quote: any;
  receipt_number: any;
  rendering_options: any;
  shipping_cost: any;
  shipping_details: any;
  starting_balance: number;
  statement_descriptor: any;
  status: string;
  status_transitions: StatusTransitions;
  subscription: string;
  subtotal: number;
  subtotal_excluding_tax: number;
  tax: any;
  test_clock: any;
  total: number;
  total_discount_amounts: any[];
  total_excluding_tax: number;
  total_tax_amounts: any[];
  transfer_data: any;
  webhooks_delivered_at: any;
}

export interface AutomaticTax {
  enabled: boolean;
  status: any;
}

export interface Lines {
  object: string;
  data: Daum[];
  has_more: boolean;
  total_count: number;
  url: string;
}

export interface Daum {
  id: string;
  object: string;
  amount: number;
  amount_excluding_tax: number;
  currency: string;
  description: string;
  discount_amounts: any[];
  discountable: boolean;
  discounts: any[];
  invoice_item?: string;
  livemode: boolean;
  metadata: Metadata;
  period: Period;
  plan: Plan;
  price: Price;
  proration: boolean;
  proration_details: ProrationDetails;
  quantity: number;
  subscription: string;
  subscription_item: string;
  tax_amounts: any[];
  tax_rates: any[];
  type: string;
  unit_amount_excluding_tax?: string;
}

export interface Metadata {}

export interface Period {
  end: number;
  start: number;
}

export interface Plan {
  id: string;
  object: string;
  active: boolean;
  aggregate_usage?: string;
  amount?: number;
  amount_decimal: string;
  billing_scheme: string;
  created: number;
  currency: string;
  interval: string;
  interval_count: number;
  livemode: boolean;
  metadata: Metadata2;
  nickname?: string;
  product: string;
  tiers_mode: any;
  transform_usage: any;
  trial_period_days: any;
  usage_type: string;
}

export interface Metadata2 {}

export interface Price {
  id: string;
  object: string;
  active: boolean;
  billing_scheme: string;
  created: number;
  currency: string;
  custom_unit_amount: any;
  livemode: boolean;
  lookup_key: string;
  metadata: Metadata3;
  nickname?: string;
  product: string;
  recurring: Recurring;
  tax_behavior: string;
  tiers_mode: any;
  transform_quantity: any;
  type: string;
  unit_amount?: number;
  unit_amount_decimal: string;
}

export interface Metadata3 {}

export interface Recurring {
  aggregate_usage?: string;
  interval: string;
  interval_count: number;
  trial_period_days: any;
  usage_type: string;
}

export interface ProrationDetails {
  credited_items?: CreditedItems;
}

export interface CreditedItems {
  invoice: string;
  invoice_line_items: string[];
}

export interface Metadata4 {}

export interface PaymentSettings {
  default_mandate: any;
  payment_method_options: any;
  payment_method_types: any;
}

export interface StatusTransitions {
  finalized_at: any;
  marked_uncollectible_at: any;
  paid_at: any;
  voided_at: any;
}

export interface WebhookLogs {
  id: string;
  event: string;
  userId: string;
  request: Request;
  duration: number;
  response: Response;
  createdAt: number;
  webhookId: string;
}

export interface Request {
  url: string;
  body: string;
  method: string;
  headers: Headers;
}

export interface Headers {
  "user-agent": string;
  "content-type": string;
}

export interface Response {
  body: string;
  status: number;
  statusText: string;
}
