import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CustomTypeOrmModule } from '../../module/typeOrm/customTypeOrm.module';
import { UserRepository } from './user.repository';

@Module({
  imports: [CustomTypeOrmModule.forCustomRepository([UserRepository])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
