import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { RaidRecordRepository } from '../../../src/domain/raidRecord/raidRecord.repository';
import { BossRaidRepository } from '../../../src/domain/bossRaid/bossRaid.repository';
import { User } from '../../../src/domain/user/user.entity';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BossRaid } from '../../../src/domain/bossRaid/bossRaid.entity';
import { CustomTypeOrmModule } from '../../../src/module/typeOrm/customTypeOrm.module';
import { testApp } from '../../testAppInit';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

describe('RaidRecordRepository', () => {
  let app: NestFastifyApplication;
  let userRepository: UserRepository;
  let raidRecordRepository: RaidRecordRepository;
  let bossRaidRepository: BossRaidRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [User, BossRaid, RaidRecord],
          synchronize: true,
          logging: true,
        }),
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          RaidRecordRepository,
          BossRaidRepository,
        ]),
      ],
    }).compile();

    app = testApp(module);
    await app.init();

    userRepository = await module.get<UserRepository>(UserRepository);
    raidRecordRepository = await module.get<RaidRecordRepository>(
      RaidRecordRepository,
    );
    bossRaidRepository = await module.get<BossRaidRepository>(
      BossRaidRepository,
    );
  });

  describe('getRaidRecordByBossRaid - ??????????????? ???????????? ????????? ????????? ??????', () => {
    let user: User;
    let enteredRaidRecord: RaidRecord;

    beforeAll(async () => {
      await bossRaidRepository.delete({});
      await raidRecordRepository.delete({});
      await userRepository.delete({});

      user = await userRepository.save({});
      const now = new Date();
      const enterTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes() - 2,
      );

      await raidRecordRepository.save({
        score: 100,
        enterTime,
        endTime: new Date(),
        user,
      });
      enteredRaidRecord = await raidRecordRepository.save({
        score: 100,
        enterTime,
        user,
      });

      await bossRaidRepository.save({ raidRecord: enteredRaidRecord });
    });

    test('?????????????????? ???????????? ????????? ????????? ??????', async () => {
      const raidRecord = await raidRecordRepository.getRaidRecordByBossRaid();
      expect(raidRecord.raidRecordId).toEqual(enteredRaidRecord.raidRecordId);
    });
  });
  describe('getRankRaidRecordByUserId - ?????? id??? ???????????? ?????? ??? ??? ?????? ??????', () => {
    let user: User;

    beforeAll(async () => {
      await bossRaidRepository.delete({});
      await raidRecordRepository.delete({});
      await userRepository.delete({});

      user = await userRepository.save({});

      const now = new Date();
      const enterTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes() - 2,
      );

      for (let i = 0; i < 5; i++) {
        await raidRecordRepository.save({
          score: 100,
          enterTime,
          endTime: new Date(),
          user,
        });
      }

      const otherUser = await userRepository.save({});
      for (let i = 0; i < 5; i++) {
        await raidRecordRepository.save({
          score: 200,
          enterTime,
          endTime: new Date(),
          user: otherUser,
        });
      }
    });

    test('?????? id??? ???????????? ????????? ???????????? ?????? ??????', async () => {
      const rankingInfo = await raidRecordRepository.getRankRaidRecordByUserId(
        user.userId + 99,
      );

      expect(rankingInfo).toBeFalsy();
    });

    test('?????? id??? ???????????? ?????? ??? ??? ?????? ??????', async () => {
      const rankingInfo = await raidRecordRepository.getRankRaidRecordByUserId(
        user.userId,
      );

      expect(rankingInfo.ranking).toEqual(1);
      expect(rankingInfo.totalScore).toEqual(500);
      expect(rankingInfo.userId).toEqual(user.userId);
    });
  });

  describe('getTopRankRaidRecord - ?????? ?????? ?????? ?????? ??????', () => {
    beforeAll(async () => {
      await bossRaidRepository.delete({});
      await raidRecordRepository.delete({});
      await userRepository.delete({});

      const now = new Date();
      const enterTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes() - 2,
      );

      for (let i = 0; i < 15; i++) {
        const user = await userRepository.save({});
        for (let j = 0; j < 10; j++) {
          await raidRecordRepository.save({
            score: i * j * 100,
            enterTime,
            endTime: new Date(),
            user,
          });
        }
      }
    });

    test('topRank ?????? ?????? ??????', async () => {
      const topRankingInfos = await raidRecordRepository.getTopRankRaidRecord();

      expect(
        topRankingInfos.every((rankingInfo) => {
          return rankingInfo.ranking < 10;
        }),
      ).toBeTruthy();
      expect(
        topRankingInfos.every((rankingInfo, idx) => {
          if (++idx === topRankingInfos.length) {
            return true;
          }
          return rankingInfo.ranking <= topRankingInfos[idx].ranking;
        }),
      ).toBeTruthy();
      expect(
        topRankingInfos.every((rankingInfo, idx) => {
          if (++idx === topRankingInfos.length) {
            return true;
          }
          return rankingInfo.totalScore >= topRankingInfos[idx].totalScore;
        }),
      ).toBeTruthy();
    });
  });
});
