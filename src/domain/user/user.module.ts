import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CustomTypeOrmModule } from '../../module/typeOrm/customTypeOrm.module';
import { UserRepository } from './user.repository';
import { RaidRecordService } from '../raidRecord/raidRecord.service';
import { RaidRecordRepository } from '../raidRecord/raidRecord.repository';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      UserRepository,
      RaidRecordRepository,
    ]),
  ],
  providers: [UserService, RaidRecordService],
  controllers: [UserController],
})
export class UserModule {}
