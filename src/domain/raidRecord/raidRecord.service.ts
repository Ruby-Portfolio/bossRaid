import { Injectable } from '@nestjs/common';
import { RaidRecordRepository } from './raidRecord.repository';
import { RaidRecord } from './raidRecord.entity';
import { NotFoundUserException } from '../user/user.exception';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class RaidRecordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly raidRecordRepository: RaidRecordRepository,
  ) {}

  async getRaidRecordByUser(userId: number): Promise<RaidRecord[]> {
    const user = await this.userRepository.findOneBy({ userId });

    if (!user) {
      throw new NotFoundUserException();
    }

    return this.raidRecordRepository.findBy({ user });
  }
}
