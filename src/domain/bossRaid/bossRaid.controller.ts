import { Body, Controller, Get, Post } from '@nestjs/common';
import { BossRaidService } from './bossRaid.service';
import { BossRaidState, EnterBossRaid } from './bossRaid.response';
import { BossRaidInfo } from './bossRaid.request';

@Controller('bossRaid')
export class BossRaidController {
  constructor(private readonly bossRaidService: BossRaidService) {}

  @Get()
  async getBossRaid(): Promise<BossRaidState> {
    return this.bossRaidService.getBossRaidState();
  }

  @Post('enter')
  async enterBossRaid(
    @Body() bossRaidInfo: BossRaidInfo,
  ): Promise<EnterBossRaid> {
    return this.bossRaidService.enterBossRaid(bossRaidInfo);
  }
}
