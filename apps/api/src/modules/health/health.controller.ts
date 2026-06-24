import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

/**
 * Health check usado por load balancer, monitoramento e CI.
 * Rota neutra de versão: /api/health.
 */
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  check(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
