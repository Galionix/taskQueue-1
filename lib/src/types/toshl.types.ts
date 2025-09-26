// Toshl Finance API types

export interface ToshlCurrency {
  code: string;
  rate: number;
  main_rate: number;
  fixed: false;
}

export interface ToshlEntry {
  id: string;
  amount: number;
  currency: ToshlCurrency;
  date: string;
  desc: string;
  account: string;
  category?: string;
  tags?: string[];
  created: string;
  modified: string;
  import?: {
    connection: string;
    pending: boolean;
  };
  completed: boolean;
  deleted: boolean;
}

export interface ToshlCategory {
  id: string;
  name: string;
  type: string;
  created: string;
  modified: string;
  deleted: boolean;
}

export interface ToshlBudget {
  id: string;
  name: string;
  amount: number;
  currency: ToshlCurrency;
  spent?: number;
  period?: string;
}

export interface ToshlApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}
