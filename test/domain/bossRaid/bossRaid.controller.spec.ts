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
import { testApp } from '../../testAppInit';
import { ValidationMessage } from '../../../src/common/validation/validation.decorator';
import { RaidRecordErrorMessage } from '../../../src/domain/raidRecord/raidRecord.exception';
import { RankingInfo } from '../../../src/domain/bossRaid/bossRaid.response';
import { CacheModule } from '@nestjs/common';
import * as redisStore from 'cache-manager-ioredis';

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
        CacheModule.register({
          store: redisStore,
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          ttl: +process.env.REDIS_TTL,
          isGlobal: true,
        }),
        BossRaidModule,
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          RaidRecordRepository,
          BossRaidRepository,
        ]),
      ],
    }).compile();

    app = testApp(module);
    await app.init();

    userRepository = module.get<UserRepository>(UserRepository);
    raidRecordRepository =
      module.get<RaidRecordRepository>(RaidRecordRepository);
    bossRaidRepository = module.get<BossRaidRepository>(BossRaidRepository);
  });

  describe('GET /bossRaid - ??????????????? ?????? ??????', () => {
    describe('??????????????? ?????? ?????????', () => {
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

      test('???????????? ?????????????????? ??????????????? ???????????? ????????? ??????', async () => {
        const bossRaidState = await request(app.getHttpServer())
          .get(`/bossRaid`)
          .expect(200);

        expect(bossRaidState.body.canEnter).toBeFalsy();
        expect(bossRaidState.body.enteredUserId).toEqual(user.userId);
      });
    });

    describe('??????????????? ?????? ??????', () => {
      describe('?????????????????? ???????????? ??????', () => {
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

        test('???????????? ?????????????????? ??????????????? ???????????? ??????', async () => {
          const bossRaidState = await request(app.getHttpServer())
            .get(`/bossRaid`)
            .expect(200);

          expect(bossRaidState.body.canEnter).toBeTruthy();
          expect(bossRaidState.body.enteredUserId).toEqual(undefined);
        });
      });

      describe('?????????????????? ???????????? ?????? ??????', () => {
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

        test('?????????????????? ???????????? ?????? ?????? ??????????????? ?????? ??????', async () => {
          const bossRaidState = await request(app.getHttpServer())
            .get(`/bossRaid`)
            .expect(200);

          expect(bossRaidState.body.canEnter).toBeTruthy();
          expect(bossRaidState.body.enteredUserId).toEqual(undefined);
        });
      });
    });
  });

  describe('POST /bossRaid/enter - ??????????????? ??????', () => {
    describe('??????????????? ?????? ?????????', () => {
      let newUser: User;
      beforeAll(async () => {
        await bossRaidRepository.delete({});
        await raidRecordRepository.delete({});
        await userRepository.delete({});

        const user = await userRepository.save({});

        const now = new Date();
        const enterTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() - 2,
        );

        const raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime,
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });

        newUser = await userRepository.save({});
      });

      test('????????? ????????? ?????? ????????? ?????? 400 ??????', async () => {
        const err = await request(app.getHttpServer())
          .post(`/bossRaid/enter`)
          .send({
            userId: 0,
            level: '??????',
          })
          .expect(400);

        expect(err.body.message.length).toEqual(2);
        expect(err.body.message).toContain(ValidationMessage.INVALID_USER_ID);
        expect(err.body.message).toContain(ValidationMessage.INVALID_LEVEL);
      });
      test('?????? ????????? ???????????? ?????????????????? ?????? ????????? ???????????? ?????? ?????? ??? ????????? ???????????? ???????????? ?????? 200 ??????', async () => {
        const res = await request(app.getHttpServer())
          .post(`/bossRaid/enter`)
          .send({
            userId: newUser.userId,
            level: 0,
          })
          .expect(200);

        expect(res.body.isEntered).toEqual(false);
        expect(res.body.raidRecordId).toEqual(undefined);
      });
    });

    describe('??????????????? ?????? ??????', () => {
      describe('?????????????????? ???????????? ?????? ??????', () => {
        let user: User;
        let newUser: User;
        beforeAll(async () => {
          await bossRaidRepository.delete({});
          await raidRecordRepository.delete({});
          await userRepository.delete({});

          user = await userRepository.save({});

          newUser = await userRepository.save({});
        });

        test('??? ??????????????? ??? ??? ????????? ???????????? ???????????? 201 ??????', async () => {
          const res = await request(app.getHttpServer())
            .post(`/bossRaid/enter`)
            .send({
              userId: newUser.userId,
              level: 0,
            })
            .expect(201);

          const bossRaids = await bossRaidRepository.find({});
          const raidRecord = await raidRecordRepository.find({});

          expect(res.body.isEntered).toEqual(true);
          expect(bossRaids.length).toEqual(1);
          expect(res.body.raidRecordId).toEqual(raidRecord[0].raidRecordId);
        });
      });

      describe('?????????????????? ???????????? ?????? ??????', () => {
        describe('?????? ????????? ???????????? ?????????????????? ?????? ??????', () => {
          let user: User;
          let newUser: User;
          beforeAll(async () => {
            await bossRaidRepository.delete({});
            await raidRecordRepository.delete({});
            await userRepository.delete({});

            user = await userRepository.save({});

            newUser = await userRepository.save({});

            await bossRaidRepository.insert({});
          });

          test('?????? ????????? ???????????? ?????????????????? ?????? ?????? ??? ????????? ???????????? ???????????? 201 ??????', async () => {
            const res = await request(app.getHttpServer())
              .post(`/bossRaid/enter`)
              .send({
                userId: newUser.userId,
                level: 0,
              })
              .expect(201);

            const raidRecord = await raidRecordRepository.find({});

            expect(res.body.isEntered).toEqual(true);
            expect(res.body.raidRecordId).toEqual(raidRecord[0].raidRecordId);
          });
        });

        describe('?????? ????????? ???????????? ?????????????????? ?????? ????????? ????????? ??????', () => {
          let user: User;
          let newUser: User;
          beforeAll(async () => {
            await bossRaidRepository.delete({});
            await raidRecordRepository.delete({});
            await userRepository.delete({});

            user = await userRepository.save({});
            newUser = await userRepository.save({});

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
              userId: user.userId,
            });
            await bossRaidRepository.insert({
              raidRecord,
            });
          });

          test('?????? ????????? ???????????? ?????????????????? ?????? ????????? ????????? ?????? ??? ????????? ???????????? ???????????? 201 ??????', async () => {
            const res = await request(app.getHttpServer())
              .post(`/bossRaid/enter`)
              .send({
                userId: newUser.userId,
                level: 0,
              })
              .expect(201);

            const raidRecords = await raidRecordRepository
              .createQueryBuilder('raidRecord')
              .orderBy('raidRecordId', 'DESC')
              .getMany();

            expect(res.body.isEntered).toEqual(true);
            expect(res.body.raidRecordId).toEqual(raidRecords[0].raidRecordId);
          });
        });
      });
    });
  });

  describe('PATCH /bossRaid/end - ??????????????? ??????', () => {
    describe('??????????????? ?????? ??????', () => {
      let user: User;
      let newUser: User;
      let raidRecord: RaidRecord;
      beforeAll(async () => {
        await bossRaidRepository.delete({});
        await raidRecordRepository.delete({});
        await userRepository.delete({});

        user = await userRepository.save({});
        newUser = await userRepository.save({});

        const now = new Date();
        const enterTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() - 2,
        );

        raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime,
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });
        await bossRaidRepository.insert({});
      });
      test('????????? ????????? ?????? ????????? ?????? 400 ??????', async () => {
        const err = await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: '?',
            raidRecordId: -1,
          })
          .expect(400);

        expect(err.body.message.length).toEqual(2);
        expect(err.body.message).toContain(ValidationMessage.INVALID_USER_ID);
        expect(err.body.message).toContain(
          ValidationMessage.INVALID_RAID_RECORD_ID,
        );
      });
      test('????????? ????????? ???????????? ???????????? ?????? ?????? 404 ??????', async () => {
        const err = await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: user.userId,
            raidRecordId: raidRecord.raidRecordId + 99,
          })
          .expect(404);

        expect(err.body.message).toEqual(RaidRecordErrorMessage.NOT_FOUND);
      });

      test('????????? ???????????? ????????? ???????????? ???????????? ?????? ?????? 404 ??????', async () => {
        const err = await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: newUser.userId,
            raidRecordId: raidRecord.raidRecordId,
          })
          .expect(404);

        expect(err.body.message).toEqual(RaidRecordErrorMessage.NOT_FOUND);
      });
    });

    describe('??????????????? ?????? ??????', () => {
      let user: User;
      let raidRecord: RaidRecord;
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

        raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime,
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });
      });
      test('????????? ???????????? ?????? ????????? ???????????? ??? 200 ??????', async () => {
        await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: user.userId,
            raidRecordId: raidRecord.raidRecordId,
          })
          .expect(200);

        const endRaidRecord = await raidRecordRepository.findOneBy({
          raidRecordId: raidRecord.raidRecordId,
        });

        expect(endRaidRecord.endTime).toBeTruthy();
      });
    });
  });

  describe('GET /bossRaid/topRankerList - ??????????????? ?????? ??????', () => {
    let user: User;
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
        const otherUser = await userRepository.save({});
        if (i === 10) {
          user = otherUser;
        }
        for (let j = 0; j < 10; j++) {
          await raidRecordRepository.save({
            score: i * j * 100,
            enterTime,
            endTime: new Date(),
            user: otherUser,
          });
        }
      }
    });

    describe('?????? ?????? ??????', () => {
      test('????????? ????????? ?????? ????????? ?????? 400 ??????', async () => {
        const err = await request(app.getHttpServer())
          .get(`/bossRaid/topRankerList`)
          .send({
            userId: 0,
          })
          .expect(400);

        expect(err.body.message[0]).toEqual(ValidationMessage.INVALID_USER_ID);
      });
    });

    describe('?????? ?????? ??????', () => {
      test('????????? ?????? ?????? ??? topRank ?????? ?????? ?????? ????????? 200 ??????', async () => {
        const res = await request(app.getHttpServer())
          .get(`/bossRaid/topRankerList`)
          .send({
            userId: user.userId,
          })
          .expect(200);

        const myRankingInfo: RankingInfo = res.body.myRankingInfo;
        const topRankerInfoList: RankingInfo[] = res.body.topRankerInfoList;

        expect(myRankingInfo.ranking).toEqual(4);
        expect(
          topRankerInfoList.every((rankingInfo) => {
            return rankingInfo.ranking < 10;
          }),
        ).toBeTruthy();
        expect(
          topRankerInfoList.every((rankingInfo, idx) => {
            if (++idx === topRankerInfoList.length) {
              return true;
            }
            return rankingInfo.ranking <= topRankerInfoList[idx].ranking;
          }),
        ).toBeTruthy();
        expect(
          topRankerInfoList.every((rankingInfo, idx) => {
            if (++idx === topRankerInfoList.length) {
              return true;
            }
            return rankingInfo.totalScore >= topRankerInfoList[idx].totalScore;
          }),
        ).toBeTruthy();
      });
    });
  });
});
