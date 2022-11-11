import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { RaidRecordRepository } from '../../../src/domain/raidRecord/raidRecord.repository';
import { RaidRecordService } from '../../../src/domain/raidRecord/raidRecord.service';
import { UserErrorMessage } from '../../../src/domain/user/user.exception';
import { User } from '../../../src/domain/user/user.entity';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';

describe('RaidRecordService', () => {
  let userRepository: UserRepository;
  let raidRecordRepository: RaidRecordRepository;
  let raidRecordService: RaidRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository, RaidRecordRepository, RaidRecordService],
    }).compile();

    userRepository = await module.get<UserRepository>(UserRepository);
    raidRecordRepository = await module.get<RaidRecordRepository>(
      RaidRecordRepository,
    );
    raidRecordService = await module.get<RaidRecordService>(RaidRecordService);
  });

  describe('getRaidRecordByUser - 유저의 레이드 기록 조회', () => {
    test('요청한 유저의 정보가 없을 경우 NotFoundUserException 예외 처리', async () => {
      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(Promise.resolve(null));

      await expect(
        raidRecordService.getRaidRecordByUser(123),
      ).rejects.toThrowError(UserErrorMessage.NOT_FOUND);
    });

    test('요청한 유저의 정보가 있을 경우 해당 유저의 기록 조회 성공', async () => {
      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(Promise.resolve(new User()));

      const raidRecords = [new RaidRecord(), new RaidRecord()];
      jest
        .spyOn(raidRecordRepository, 'findBy')
        .mockResolvedValue(Promise.resolve(raidRecords));

      await expect(raidRecordService.getRaidRecordByUser(123)).resolves.toEqual(
        raidRecords,
      );
    });
  });
});
