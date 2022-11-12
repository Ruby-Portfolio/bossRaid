import { Test, TestingModule } from '@nestjs/testing';
import { RaidRecordRepository } from '../../../src/domain/raidRecord/raidRecord.repository';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';
import { BossRaidRepository } from '../../../src/domain/bossRaid/bossRaid.repository';
import { BossRaidService } from '../../../src/domain/bossRaid/bossRaid.service';

describe('BossRaidService', () => {
  let bossRaidRepository: BossRaidRepository;
  let raidRecordRepository: RaidRecordRepository;
  let bossRaidService: BossRaidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BossRaidRepository, RaidRecordRepository, BossRaidService],
    }).compile();

    bossRaidRepository = await module.get<BossRaidRepository>(
      BossRaidRepository,
    );
    raidRecordRepository = await module.get<RaidRecordRepository>(
      RaidRecordRepository,
    );
    bossRaidService = await module.get<BossRaidService>(BossRaidService);
  });

  describe('getBossRaidState - 보스레이드 상태 조회', () => {
    describe('보스레이드 시도 불가능', () => {
      test('진행중인 보스레이드가 제한시간을 초과하지 않았을 경우', async () => {
        const userId = 123;
        const raidRecord = new RaidRecord();
        raidRecord.userId = userId;

        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(raidRecord));
        jest.spyOn(raidRecord, 'isProceedingState').mockReturnValue(true);

        const bossRaidState = await bossRaidService.getBossRaidState();
        expect(bossRaidState.canEnter).toBeFalsy();
        expect(bossRaidState.enteredUserId).toEqual(userId);
      });
    });

    describe('보스레이드 시도 가능', () => {
      test('진행중인 보스레이드가 제한시간을 초과했을 경우 보스레이드 시도 가능', async () => {
        const userId = 123;
        const raidRecord = new RaidRecord();
        raidRecord.userId = userId;

        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(raidRecord));
        jest.spyOn(raidRecord, 'isProceedingState').mockReturnValue(false);

        const bossRaidState = await bossRaidService.getBossRaidState();
        expect(bossRaidState.canEnter).toBeTruthy();
        expect(bossRaidState.enteredUserId).toEqual(undefined);
      });

      test('보스레이드가 진행중이 아닐 경우 보스레이드 시도 가능', async () => {
        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(null));

        const bossRaidState = await bossRaidService.getBossRaidState();
        expect(bossRaidState.canEnter).toBeTruthy();
        expect(bossRaidState.enteredUserId).toEqual(undefined);
      });
    });
  });
});
