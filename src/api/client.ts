import axios, { AxiosInstance, CancelTokenSource, AxiosRequestConfig } from 'axios';
import type {
  AdsResponse,
  AdsFilters,
  Advertisement,
  RejectRequest,
  RequestChangesRequest,
  StatsSummary,
  ActivityData,
  DecisionsData,
  StatsFilters,
  Moderator,
} from '@/types';

const API_BASE_URL = '/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private cancelTokens: Map<string, CancelTokenSource> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );
  }

  private createCancelToken(key: string): AxiosRequestConfig {
    const existingToken = this.cancelTokens.get(key);
    if (existingToken) {
      existingToken.cancel('Request cancelled due to navigation');
    }

    const source = axios.CancelToken.source();
    this.cancelTokens.set(key, source);

    return {
      cancelToken: source.token,
    };
  }

  public cancelRequest(key: string): void {
    const token = this.cancelTokens.get(key);
    if (token) {
      token.cancel('Request cancelled');
      this.cancelTokens.delete(key);
    }
  }

  public cancelAllRequests(): void {
    this.cancelTokens.forEach((token) => {
      token.cancel('All requests cancelled');
    });
    this.cancelTokens.clear();
  }

  private buildQueryString(filters: AdsFilters | StatsFilters | Record<string, unknown>): string {
    const params = new URLSearchParams();

    Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, String(item)));
        } else {
          params.append(key, String(value));
        }
      }
    });

    return params.toString();
  }

  async getAds(filters: AdsFilters = {}): Promise<AdsResponse> {
    const config = this.createCancelToken('getAds');
    const queryString = this.buildQueryString(filters);
    const response = await this.client.get<AdsResponse>(
      `/ads${queryString ? `?${queryString}` : ''}`,
      config
    );
    return response.data;
  }

  async getAdById(id: number): Promise<Advertisement> {
    const config = this.createCancelToken(`getAd-${id}`);
    const response = await this.client.get<Advertisement>(`/ads/${id}`, config);
    return response.data;
  }

  async approveAd(id: number): Promise<Advertisement> {
    const response = await this.client.post<{ message: string; ad: Advertisement }>(
      `/ads/${id}/approve`
    );
    return response.data.ad;
  }

  async rejectAd(id: number, data: RejectRequest): Promise<Advertisement> {
    const response = await this.client.post<{ message: string; ad: Advertisement }>(
      `/ads/${id}/reject`,
      data
    );
    return response.data.ad;
  }

  async requestChanges(id: number, data: RequestChangesRequest): Promise<Advertisement> {
    const response = await this.client.post<{ message: string; ad: Advertisement }>(
      `/ads/${id}/request-changes`,
      data
    );
    return response.data.ad;
  }

  async getStatsSummary(filters: StatsFilters = {}): Promise<StatsSummary> {
    const config = this.createCancelToken('getStatsSummary');
    const queryString = this.buildQueryString(filters);
    const response = await this.client.get<StatsSummary>(
      `/stats/summary${queryString ? `?${queryString}` : ''}`,
      config
    );
    return response.data;
  }

  async getActivityChart(filters: StatsFilters = {}): Promise<ActivityData[]> {
    const config = this.createCancelToken('getActivityChart');
    const queryString = this.buildQueryString(filters);
    const response = await this.client.get<ActivityData[]>(
      `/stats/chart/activity${queryString ? `?${queryString}` : ''}`,
      config
    );
    return response.data;
  }

  async getDecisionsChart(filters: StatsFilters = {}): Promise<DecisionsData> {
    const config = this.createCancelToken('getDecisionsChart');
    const queryString = this.buildQueryString(filters);
    const response = await this.client.get<DecisionsData>(
      `/stats/chart/decisions${queryString ? `?${queryString}` : ''}`,
      config
    );
    return response.data;
  }

  async getCategoriesChart(filters: StatsFilters = {}): Promise<Record<string, number>> {
    const config = this.createCancelToken('getCategoriesChart');
    const queryString = this.buildQueryString(filters);
    const response = await this.client.get<Record<string, number>>(
      `/stats/chart/categories${queryString ? `?${queryString}` : ''}`,
      config
    );
    return response.data;
  }

  async getCurrentModerator(): Promise<Moderator> {
    const config = this.createCancelToken('getCurrentModerator');
    const response = await this.client.get<Moderator>('/moderators/me', config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

