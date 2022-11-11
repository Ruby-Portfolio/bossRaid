import { Controller, Get } from '@nestjs/common';
import { BossRaidService } from './bossRaid.service';
import { BossRaidState } from './bossRaid.response';

@Controller('bossRaid')
export class BossRaidController {
  constructor(private readonly bossRaidService: BossRaidService) {}

  @Get()
  async getBossRaid(): Promise<BossRaidState> {
    return this.bossRaidService.getBossRaidState();
  }
}
