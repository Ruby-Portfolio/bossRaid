import { Test, TestingModule } from '@nestjs/testing';
import { RaidRecordRepository } from '../../../src/domain/raidRecord/raidRecord.repository';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';
import { BossRaidRepository } from '../../../src/domain/bossRaid/bossRaid.repository';
import { BossRaidService } from '../../../src/domain/bossRaid/bossRaid.service';
import { BossRaidInfo } from '../../../src/domain/bossRaid/bossRaid.request';
import {
  EnterBossRaid,
  RankingInfo,
} from '../../../src/domain/bossRaid/bossRaid.response';
import { InsertResult, UpdateResult } from 'typeorm';
import { RaidRecordErrorMessage } from '../../../src/domain/raidRecord/raidRecord.exception';
import { RaidScoreStore } from '../../../src/domain/bossRaid/bossRaid.store';
import { HttpModule } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { BossRaidErrorMessage } from '../../../src/domain/bossRaid/bossRaid.exception';

describe('BossRaidService', () => {
  let bossRaidRepository: BossRaidRepository;
  let raidRecordRepository: RaidRecordRepository;
  let bossRaidService: BossRaidService;
  let raidScoreStore: RaidScoreStore;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        BossRaidRepository,
        RaidRecordRepository,
        BossRaidService,
        RaidScoreStore,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    bossRaidRepository = await module.get<BossRaidRepository>(
      BossRaidRepository,
    );
    raidRecordRepository = await module.get<RaidRecordRepository>(
      RaidRecordRepository,
    );
    bossRaidService = await module.get<BossRaidService>(BossRaidService);
    raidScoreStore = await module.get<RaidScoreStore>(RaidScoreStore);
    cacheManager = await module.get<Cache>(CACHE_MANAGER);
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
        jest
          .spyOn(raidScoreStore, 'getLimitTime')
          .mockReturnValue(Promise.resolve(1000));
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
        jest
          .spyOn(raidScoreStore, 'getLimitTime')
          .mockReturnValue(Promise.resolve(1000));
        jest.spyOn(raidRecord, 'isProceedingState').mockReturnValue(false);

        const bossRaidState = await bossRaidService.getBossRaidState();
        expect(bossRaidState.canEnter).toBeTruthy();
        expect(bossRaidState.enteredUserId).toEqual(undefined);
      });

      test('보스레이드가 진행중이 아닐 경우 보스레이드 시도 가능', async () => {
        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(null));
        jest
          .spyOn(raidScoreStore, 'getLimitTime')
          .mockReturnValue(Promise.resolve(1000));

        const bossRaidState = await bossRaidService.getBossRaidState();
        expect(bossRaidState.canEnter).toBeTruthy();
        expect(bossRaidState.enteredUserId).toEqual(undefined);
      });
    });
  });

  describe('enterBossRaid - 보스레이드 시작', () => {
    describe('보스레이드 시작 불가능', () => {
      test('다른 유저의 진행중인 보스레이즈가 제한 시간을 초과하지 않은 경우', async () => {
        const userId = 123;
        const raidRecord = new RaidRecord();
        raidRecord.userId = userId;

        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(raidRecord));
        jest
          .spyOn(raidScoreStore, 'getLimitTime')
          .mockReturnValue(Promise.resolve(1000));
        jest.spyOn(raidRecord, 'isProceedingState').mockReturnValue(true);

        const bossRaidInfo: BossRaidInfo = { level: 0, userId: 124 };
        const enterBossRaid: EnterBossRaid =
          await bossRaidService.enterBossRaid(bossRaidInfo);
        expect(enterBossRaid.isEntered).toBeFalsy();
        expect(enterBossRaid.raidRecordId).toEqual(undefined);
      });
    });

    describe('보스레이드를 시작 가능', () => {
      test('다른 유저의 진행중인 보스레이드가 없는 경우', async () => {
        const newRaidRecord: RaidRecord = {
          raidRecordId: 222,
        } as RaidRecord;
        const updateResult: UpdateResult = {
          affected: 1,
        } as UpdateResult;

        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(null));
        jest
          .spyOn(raidScoreStore, 'getLimitTime')
          .mockReturnValue(Promise.resolve(1000));
        jest
          .spyOn(raidScoreStore, 'getScore')
          .mockReturnValue(Promise.resolve(100));
        jest
          .spyOn(raidRecordRepository, 'save')
          .mockResolvedValue(Promise.resolve(newRaidRecord));
        jest
          .spyOn(bossRaidRepository, 'update')
          .mockResolvedValue(Promise.resolve(updateResult));

        const bossRaidInfo: BossRaidInfo = { level: 0, userId: 124 };
        const enterBossRaid: EnterBossRaid =
          await bossRaidService.enterBossRaid(bossRaidInfo);
        expect(enterBossRaid.isEntered).toBeTruthy();
        expect(enterBossRaid.raidRecordId).toEqual(newRaidRecord.raidRecordId);
      });

      test('다른 유저의 진행중인 보스레이드가 제한 시간을 초과한 경우', async () => {
        const userId = 123;
        const raidRecord = new RaidRecord();
        raidRecord.userId = userId;
        const newRaidRecord: RaidRecord = {
          raidRecordId: 222,
        } as RaidRecord;
        const updateResult: UpdateResult = {
          affected: 1,
        } as UpdateResult;

        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(raidRecord));
        jest.spyOn(raidRecord, 'isProceedingState').mockReturnValue(false);
        jest
          .spyOn(raidScoreStore, 'getLimitTime')
          .mockReturnValue(Promise.resolve(1000));
        jest
          .spyOn(raidScoreStore, 'getScore')
          .mockReturnValue(Promise.resolve(100));
        jest
          .spyOn(raidRecordRepository, 'save')
          .mockResolvedValue(Promise.resolve(newRaidRecord));
        jest
          .spyOn(bossRaidRepository, 'update')
          .mockResolvedValue(Promise.resolve(updateResult));

        const bossRaidInfo: BossRaidInfo = { level: 0, userId: 124 };
        const enterBossRaid: EnterBossRaid =
          await bossRaidService.enterBossRaid(bossRaidInfo);
        expect(enterBossRaid.isEntered).toBeTruthy();
        expect(enterBossRaid.raidRecordId).toEqual(newRaidRecord.raidRecordId);
      });

      test('생성된 보스레이드가 없는 경우 보스레이드 생성하여 진행', async () => {
        const userId = 123;
        const raidRecord = new RaidRecord();
        raidRecord.userId = userId;
        const newRaidRecord: RaidRecord = {
          raidRecordId: 222,
        } as RaidRecord;
        const updateResult: UpdateResult = {
          affected: 0,
        } as UpdateResult;

        jest
          .spyOn(raidRecordRepository, 'getRaidRecordByBossRaid')
          .mockResolvedValue(Promise.resolve(raidRecord));
        jest.spyOn(raidRecord, 'isProceedingState').mockReturnValue(false);
        jest
          .spyOn(raidScoreStore, 'getLimitTime')
          .mockReturnValue(Promise.resolve(1000));
        jest
          .spyOn(raidScoreStore, 'getScore')
          .mockReturnValue(Promise.resolve(100));
        jest
          .spyOn(raidRecordRepository, 'save')
          .mockResolvedValue(Promise.resolve(newRaidRecord));
        jest
          .spyOn(bossRaidRepository, 'update')
          .mockResolvedValue(Promise.resolve(updateResult));
        jest
          .spyOn(bossRaidRepository, 'insert')
          .mockResolvedValue(Promise.resolve(new InsertResult()));

        const bossRaidInfo: BossRaidInfo = { level: 0, userId: 124 };
        const enterBossRaid: EnterBossRaid =
          await bossRaidService.enterBossRaid(bossRaidInfo);
        expect(enterBossRaid.isEntered).toBeTruthy();
        expect(enterBossRaid.raidRecordId).toEqual(newRaidRecord.raidRecordId);
      });
    });
  });

  describe('endBossRaid - 보스레이드 종료', () => {
    test('유저 id와 레이드 레코드 id에 해당하는 레코드가 존재하지 않을 경우 NotFoundRaidRecordException 예외 처리', async () => {
      const userId = 123;
      const raidRecordId = 1234;

      jest
        .spyOn(raidRecordRepository, 'findOneBy')
        .mockReturnValue(Promise.resolve(null));
      await expect(
        bossRaidService.endBossRaid({ userId, raidRecordId }),
      ).rejects.toThrowError(RaidRecordErrorMessage.NOT_FOUND);
    });

    test('레이드 제한시간을 초과했을 경우 FailBossRaidException 예외 처리', async () => {
      const userId = 123;
      const raidRecordId = 1234;

      jest
        .spyOn(raidRecordRepository, 'findOneBy')
        .mockReturnValue(Promise.resolve(new RaidRecord()));
      jest
        .spyOn(raidScoreStore, 'isRaidClear')
        .mockReturnValue(Promise.resolve(false));

      await expect(
        bossRaidService.endBossRaid({ userId, raidRecordId }),
      ).rejects.toThrowError(BossRaidErrorMessage.FAIL_RAID);
    });

    test('레이드 레코드 종료시간 업데이트를 성공했을 경우', async () => {
      const userId = 123;
      const raidRecordId = 1234;
      const updateResult: UpdateResult = {
        affected: 1,
      } as UpdateResult;

      jest
        .spyOn(raidRecordRepository, 'findOneBy')
        .mockReturnValue(Promise.resolve(new RaidRecord()));
      jest
        .spyOn(raidScoreStore, 'isRaidClear')
        .mockReturnValue(Promise.resolve(true));
      jest
        .spyOn(raidRecordRepository, 'update')
        .mockResolvedValue(updateResult);
      jest
        .spyOn(raidRecordRepository, 'getRankRaidRecordByUserId')
        .mockReturnValue(Promise.resolve(new RankingInfo()));
      jest
        .spyOn(raidRecordRepository, 'getTopRankRaidRecord')
        .mockReturnValue(Promise.resolve([]));

      const raidEnd = await bossRaidService.endBossRaid({
        userId,
        raidRecordId,
      });

      expect(raidEnd).toEqual(updateResult);
    });
  });
});
