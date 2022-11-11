import { Module } from '@nestjs/common';
import { CustomTypeOrmModule } from '../../module/typeOrm/customTypeOrm.module';
import { BossRaidRepository } from './bossRaid.repository';
import { BossRaidService } from './bossRaid.service';
import { BossRaidController } from './bossRaid.controller';

@Module({
  imports: [CustomTypeOrmModule.forCustomRepository([BossRaidRepository])],
  providers: [BossRaidService],
  controllers: [BossRaidController],
})
export class BossRaidModule {}
