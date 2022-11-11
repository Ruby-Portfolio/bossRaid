import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { CustomTypeOrmModule } from '../../../src/module/typeOrm/customTypeOrm.module';
import { User } from '../../../src/domain/user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BossRaid } from '../../../src/domain/bossRaid/bossRaid.entity';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';
import { RaidRecordRepository } from '../../../src/domain/raidRecord/raidRecord.repository';
import { BossRaidRepository } from '../../../src/domain/bossRaid/bossRaid.repository';
import * as request from 'supertest';
import { BossRaidModule } from '../../../src/domain/bossRaid/bossRaid.module';

describe('BossRaidController', () => {
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
        BossRaidModule,
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          RaidRecordRepository,
          BossRaidRepository,
        ]),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    userRepository = module.get<UserRepository>(UserRepository);
    raidRecordRepository =
      module.get<RaidRecordRepository>(RaidRecordRepository);
    bossRaidRepository = module.get<BossRaidRepository>(BossRaidRepository);
  });

  describe('GET /bossRaid - 보스레이드 상태 조회', () => {
    describe('보스레이드 시도 불가능', () => {
      let user: User;
      beforeAll(async () => {
        await bossRaidRepository.delete({});
        await raidRecordRepository.delete({});
        await userRepository.delete({});

        user = await userRepository.save({});

        const now = new Date();
        const raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes() - 2,
          ),
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });
      });

      test('진행중인 보스레이드가 제한시간을 초과하지 않았을 경우', async () => {
        const bossRaidState = await request(app.getHttpServer())
          .get(`/bossRaid`)
          .expect(200);

        expect(bossRaidState.body.canEnter).toBeFalsy();
        expect(bossRaidState.body.enteredUserId).toEqual(user.userId);
      });
    });

    describe('보스레이드 시도 가능', () => {
      describe('능', () => {
        let user: User;
        beforeAll(async () => {
          await bossRaidRepository.delete({});
          await raidRecordRepository.delete({});
          await userRepository.delete({});

          user = await userRepository.save({});

          const now = new Date();
          const raidRecord = await raidRecordRepository.save({
            score: 100,
            enterTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              now.getHours(),
              now.getMinutes() - 4,
            ),
            userId: user.userId,
          });
          await bossRaidRepository.insert({
            raidRecord,
          });
        });

        test('진행중인 보스레이드가 제한시간을 초과했을 경우', async () => {
          const bossRaidState = await request(app.getHttpServer())
            .get(`/bossRaid`)
            .expect(200);

          expect(bossRaidState.body.canEnter).toBeTruthy();
          expect(bossRaidState.body.enteredUserId).toEqual(null);
        });
      });

      describe('보스레이드가 진행중이 아닐 경우', () => {
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
            now.getMinutes() - 4,
          );

          const raidRecord = await raidRecordRepository.save({
            score: 100,
            enterTime,
            endTime: new Date(
              enterTime.getFullYear(),
              enterTime.getMonth(),
              enterTime.getDate(),
              enterTime.getHours(),
              now.getMinutes() - 2,
            ),
            userId: user.userId,
          });
          await bossRaidRepository.insert({
            raidRecord,
          });
        });

        test('보스레이드가 진행중이 아닐 경우 보스레이드 시도 가능', async () => {
          const bossRaidState = await request(app.getHttpServer())
            .get(`/bossRaid`)
            .expect(200);

          expect(bossRaidState.body.canEnter).toBeTruthy();
          expect(bossRaidState.body.enteredUserId).toEqual(null);
        });
      });
    });
  });
});
