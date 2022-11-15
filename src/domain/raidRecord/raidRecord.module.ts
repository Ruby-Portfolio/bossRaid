import { Module } from '@nestjs/common';
import { CustomTypeOrmModule } from '../../module/typeOrm/customTypeOrm.module';
import { UserRepository } from '../user/user.repository';
import { RaidRecordRepository } from './raidRecord.repository';
import { RaidRecordService } from './raidRecord.service';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      RaidRecordRepository,
      UserRepository,
    ]),
  ],
  providers: [RaidRecordService],
})
export class RaidRecordModule {}
