export interface Browser {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrowserDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateBrowserDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface IBrowserService {
  findAll(): Promise<Browser[]>;
  findActive(): Promise<Browser[]>;
  findOne(id: number): Promise<Browser>;
  create(createBrowserDto: CreateBrowserDto): Promise<Browser>;
  update(id: number, updateBrowserDto: UpdateBrowserDto): Promise<Browser>;
  remove(id: number): Promise<void>;
  toggleActive(id: number): Promise<Browser>;
  restartEngines(): Promise<{ message: string }>;
}
