/**
 * Hook para consumir datos de WordPress
 * Incluye caché, polling y manejo de errores
 */

import { useEffect, useState } from "react";
import {
  calculateDashboardStats,
  getDailyStats,
  getRecentLogs,
  getRSSSources,
  DashboardStats,
  DailyStats,
} from "@/lib/wpService";

interface UseWordPressDataReturn {
  stats: DashboardStats | null;
  dailyStats: DailyStats[];
  recentLogs: any[];
  rssSources: any[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const POLL_INTERVAL = 30 * 1000; // 30 segundos

let cache: {
  stats: DashboardStats | null;
  dailyStats: DailyStats[];
  recentLogs: any[];
  rssSources: any[];
  timestamp: number;
} = {
  stats: null,
  dailyStats: [],
  recentLogs: [],
  rssSources: [],
  timestamp: 0,
};

export function useWordPressData(): UseWordPressDataReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [rssSources, setRssSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);

      // Verificar caché
      const now = Date.now();
      if (cache.timestamp && now - cache.timestamp < CACHE_DURATION && cache.stats) {
        setStats(cache.stats);
        setDailyStats(cache.dailyStats);
        setRecentLogs(cache.recentLogs);
        setRssSources(cache.rssSources);
        setLoading(false);
        return;
      }

      // Obtener datos en paralelo
      const [statsData, dailyStatsData, logsData, sourcesData] = await Promise.all([
        calculateDashboardStats(),
        getDailyStats(),
        getRecentLogs(5),
        getRSSSources(),
      ]);

      // Actualizar caché
      cache = {
        stats: statsData,
        dailyStats: dailyStatsData,
        recentLogs: logsData,
        rssSources: sourcesData,
        timestamp: now,
      };

      // Actualizar estado
      setStats(statsData);
      setDailyStats(dailyStatsData);
      setRecentLogs(logsData);
      setRssSources(sourcesData);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const refetch = () => {
    cache.timestamp = 0; // Invalidar caché
    fetchData();
  };

  useEffect(() => {
    // Fetch inicial
    fetchData();

    // Polling periódico
    const interval = setInterval(fetchData, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    dailyStats,
    recentLogs,
    rssSources,
    loading,
    error,
    refetch,
  };
}
