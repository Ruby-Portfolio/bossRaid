import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { CustomTypeOrmModule } from '../../../src/module/typeOrm/customTypeOrm.module';
import { UserModule } from '../../../src/domain/user/user.module';
import { User } from '../../../src/domain/user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { CacheModule, HttpStatus } from '@nestjs/common';
import { BossRaid } from '../../../src/domain/bossRaid/bossRaid.entity';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';
import { RaidRecordRepository } from '../../../src/domain/raidRecord/raidRecord.repository';
import { UserErrorMessage } from '../../../src/domain/user/user.exception';
import { BossRaidRepository } from '../../../src/domain/bossRaid/bossRaid.repository';
import * as redisStore from 'cache-manager-ioredis';

describe('UserController', () => {
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
        CacheModule.register({
          store: redisStore,
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          ttl: +process.env.REDIS_TTL,
          isGlobal: true,
        }),
        UserModule,
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

  describe('POST /user - 유저 생성', () => {
    beforeAll(async () => {
      await bossRaidRepository.delete({});
      await raidRecordRepository.delete({});
      await userRepository.delete({});
    });

    test('유저 생성 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/user')
        .expect(HttpStatus.CREATED);

      const users: User[] = await userRepository.find();

      expect(res.body.userId).toEqual(users[0].userId);
    });
  });

  describe('GET /user/:userId - 유저 조회', () => {
    let userId: number;
    let totalScore = 0;
    beforeAll(async () => {
      await bossRaidRepository.delete({});
      await raidRecordRepository.delete({});
      await userRepository.delete({});

      const user = await userRepository.save({});
      userId = user.userId;

      const now = new Date();
      for (let i = 0; i < 5; i++) {
        const endTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() + i,
        );

        const score = i * 10;
        totalScore += score;

        await raidRecordRepository.save({
          score,
          endTime,
          userId,
        });
      }
    });

    describe('유저 조회 실패', () => {
      test('userId 값이 올바른 타입이 아닐 경우 400 응답', async () => {
        await request(app.getHttpServer()).get(`/user/asdasd`).expect(400);
      });

      test('userId 에 해당하는 유저 정보가 없을 경우 404 응답', async () => {
        const err = await request(app.getHttpServer())
          .get(`/user/${userId + 999}`)
          .expect(404);

        expect(err.body.message).toEqual(UserErrorMessage.NOT_FOUND);
      });
    });

    describe('유저 조회 성공', () => {
      test('유저의 기록 조회', async () => {
        const res = await request(app.getHttpServer())
          .get(`/user/${userId}`)
          .expect(200);

        expect(res.body.totalScore).toEqual(totalScore);
        expect(res.body.bossRaidHistory.length).toEqual(5);
      });
    });
  });
});
