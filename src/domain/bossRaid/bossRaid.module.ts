import { Module } from '@nestjs/common';
import { CustomTypeOrmModule } from '../../module/typeOrm/customTypeOrm.module';
import { BossRaidRepository } from './bossRaid.repository';
import { BossRaidService } from './bossRaid.service';
import { BossRaidController } from './bossRaid.controller';
import { RaidRecordRepository } from '../raidRecord/raidRecord.repository';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      BossRaidRepository,
      RaidRecordRepository,
    ]),
  ],
  providers: [BossRaidService],
  controllers: [BossRaidController],
})
export class BossRaidModule {}
