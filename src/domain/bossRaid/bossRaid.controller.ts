import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { BossRaidService } from './bossRaid.service';
import { BossRaidState, EnterBossRaid } from './bossRaid.response';
import { BossRaidInfo, EndBossRaid } from './bossRaid.request';

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
    @Res() res,
  ): Promise<void> {
    const enterBossRaid: EnterBossRaid =
      await this.bossRaidService.enterBossRaid(bossRaidInfo);
    const httpStatus = enterBossRaid.isEntered
      ? HttpStatus.CREATED
      : HttpStatus.OK;
    res.status(httpStatus).json(enterBossRaid);
  }

  @Patch('end')
  async endBossRaid(@Body() endBossRaid: EndBossRaid) {
    await this.bossRaidService.endBossRaid(endBossRaid);
  }
}
