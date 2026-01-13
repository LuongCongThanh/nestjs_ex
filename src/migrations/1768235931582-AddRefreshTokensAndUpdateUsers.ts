import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokensAndUpdateUsers1768235931582 implements MigrationInterface {
  name = 'AddRefreshTokensAndUpdateUsers1768235931582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
  }
}
