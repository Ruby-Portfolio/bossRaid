import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RaidRecordService } from '../raidRecord/raidRecord.service';
import { UserInfo } from './user.response';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly raidRecordService: RaidRecordService,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async postUser() {
    const User = await this.userService.addUser();
    return { userId: User.userId };
  }

  @Get(':userId')
  async getUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserInfo> {
    const raidRecords = await this.raidRecordService.getRaidRecordByUser(
      userId,
    );
    return new UserInfo(raidRecords);
  }
}
