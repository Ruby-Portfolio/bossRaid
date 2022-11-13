import { Module } from '@nestjs/common';
import { CustomTypeOrmModule } from '../../module/typeOrm/customTypeOrm.module';
import { BossRaidRepository } from './bossRaid.repository';
import { BossRaidService } from './bossRaid.service';
import { BossRaidController } from './bossRaid.controller';
import { RaidRecordRepository } from '../raidRecord/raidRecord.repository';
import { RaidRecordService } from '../raidRecord/raidRecord.service';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      BossRaidRepository,
      RaidRecordRepository,
      UserRepository,
    ]),
  ],
  providers: [BossRaidService, RaidRecordService],
  controllers: [BossRaidController],
})
export class BossRaidModule {}
