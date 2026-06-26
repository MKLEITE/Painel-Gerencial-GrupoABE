import { apiFetch } from './api-client';
import type { DashboardResponse, FiltrosDashboard } from './dashboard-types';

export function fetchDashboard(filtros: FiltrosDashboard): Promise<DashboardResponse> {
  const params = new URLSearchParams({
    codCliente: filtros.codCliente,
    loteEnvio: filtros.loteEnvio,
    uf: filtros.uf,
  });
  if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
  if (filtros.dataFinal) params.set('dataFinal', filtros.dataFinal);

  return apiFetch(`/dashboard?${params.toString()}`);
}
