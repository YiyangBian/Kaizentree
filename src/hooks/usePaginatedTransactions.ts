import { useCallback, useState } from "react";

import {
  PaginatedRequestParams,
  PaginatedResponse,
  Transaction,
} from "../utils/types";
import { PaginatedTransactionsResult } from "./types";
import { useCustomFetch } from "./useCustomFetch";

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch();
  const [paginatedTransactions, setPaginatedTransactions] =
    useState<PaginatedResponse<Transaction[]> | null>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true); // 添加这个状态

  const fetchAll = useCallback(async () => {
    const response = await fetchWithCache<
      PaginatedResponse<Transaction[]>,
      PaginatedRequestParams
    >("paginatedTransactions", {
      page: paginatedTransactions ? paginatedTransactions.nextPage : 0,
    });

    if (response) {
      // 确认 response 存在
      setPaginatedTransactions((previousResponse) => {
        const newData = previousResponse
          ? [...previousResponse.data, ...response.data]
          : response.data;
        return {
          data: newData,
          nextPage: response.nextPage,
        };
      });
      setHasMoreTransactions(response.nextPage !== null); // 根据 nextPage 更新状态
    }
  }, [fetchWithCache, paginatedTransactions]);

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null);
    setHasMoreTransactions(true); // 重置时假设有更多数据可加载
  }, []);

  // 包含 hasMoreTransactions 在钩子的返回值中
  return {
    data: paginatedTransactions,
    loading,
    fetchAll,
    invalidateData,
    hasMoreTransactions,
  };
}
