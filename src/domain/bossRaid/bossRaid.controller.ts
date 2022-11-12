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
import { BossRaidState, EnterBossRaid, RankList } from './bossRaid.response';
import { BossRaidInfo, EndBossRaid } from './bossRaid.request';
import { RaidRecordService } from '../raidRecord/raidRecord.service';

@Controller('bossRaid')
export class BossRaidController {
  constructor(
    private readonly bossRaidService: BossRaidService,
    private readonly raidRecordService: RaidRecordService,
  ) {}

  @Get()
  async getBossRaid(): Promise<BossRaidState> {
    return this.bossRaidService.getBossRaidState();
  }

  @Get('topRankerList')
  async getBossRaidTopRankList(@Body() userId: number): Promise<RankList> {
    return this.raidRecordService.getTopRankList(userId);
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
