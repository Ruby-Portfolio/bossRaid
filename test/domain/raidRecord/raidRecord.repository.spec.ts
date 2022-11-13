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

  describe('getRaidRecordByBossRaid - 보스레이드 진행중인 레이드 레코드 조회', () => {
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

    test('보스레이드를 진행중인 레이드 레코드 조회', async () => {
      const raidRecord = await raidRecordRepository.getRaidRecordByBossRaid();
      expect(raidRecord.raidRecordId).toEqual(enteredRaidRecord.raidRecordId);
    });
  });
  describe('getRankRaidRecordByUserId - 유저 id에 해당하는 순위 및 총 점수 조회', () => {});
  describe('getTopRankRaidRecord - 상위 랭크 순위 목록 조회', () => {});
});
