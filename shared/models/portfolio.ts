export interface PortfolioCategoryModel {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface PortfolioModel {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly images: string[];
  readonly categoryId: string | null;
  readonly category: PortfolioCategoryModel | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface PortfolioPayloadModel {
  readonly title: string;
  readonly slug?: string;
  readonly description?: string;
  readonly images?: string[];
  readonly categoryId?: string;
  readonly isActive?: boolean;
}

export interface PaginatedPortfolioModel {
  readonly items: PortfolioModel[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
