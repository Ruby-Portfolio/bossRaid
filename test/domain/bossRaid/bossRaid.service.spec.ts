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

  describe('getBossRaidState - ??????????????? ?????? ??????', () => {
    describe('??????????????? ?????? ?????????', () => {
      test('???????????? ?????????????????? ??????????????? ???????????? ????????? ??????', async () => {
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

    describe('??????????????? ?????? ??????', () => {
      test('???????????? ?????????????????? ??????????????? ???????????? ?????? ??????????????? ?????? ??????', async () => {
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

      test('?????????????????? ???????????? ?????? ?????? ??????????????? ?????? ??????', async () => {
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

  describe('enterBossRaid - ??????????????? ??????', () => {
    describe('??????????????? ?????? ?????????', () => {
      test('?????? ????????? ???????????? ?????????????????? ?????? ????????? ???????????? ?????? ??????', async () => {
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

    describe('?????????????????? ?????? ??????', () => {
      test('?????? ????????? ???????????? ?????????????????? ?????? ??????', async () => {
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

      test('?????? ????????? ???????????? ?????????????????? ?????? ????????? ????????? ??????', async () => {
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

      test('????????? ?????????????????? ?????? ?????? ??????????????? ???????????? ??????', async () => {
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

  describe('endBossRaid - ??????????????? ??????', () => {
    test('?????? id??? ????????? ????????? id??? ???????????? ???????????? ???????????? ?????? ?????? NotFoundRaidRecordException ?????? ??????', async () => {
      const userId = 123;
      const raidRecordId = 1234;

      jest
        .spyOn(raidRecordRepository, 'findOneBy')
        .mockReturnValue(Promise.resolve(null));
      await expect(
        bossRaidService.endBossRaid({ userId, raidRecordId }),
      ).rejects.toThrowError(RaidRecordErrorMessage.NOT_FOUND);
    });

    test('????????? ??????????????? ???????????? ?????? FailBossRaidException ?????? ??????', async () => {
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

    test('????????? ????????? ???????????? ??????????????? ???????????? ??????', async () => {
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
