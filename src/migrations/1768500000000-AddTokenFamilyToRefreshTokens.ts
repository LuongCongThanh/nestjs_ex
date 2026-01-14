import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenFamilyToRefreshTokens1768500000000 implements MigrationInterface {
  name = 'AddTokenFamilyToRefreshTokens1768500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column if not exists (safe re-run)
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "token_family_id" uuid`);

    // Backfill existing rows with a family id
    await queryRunner.query(`UPDATE "refresh_tokens" SET "token_family_id" = uuid_generate_v4() WHERE "token_family_id" IS NULL`);

    // Enforce NOT NULL
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "token_family_id" SET NOT NULL`);

    // Add index (idempotent)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_family_id" ON "refresh_tokens" ("token_family_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_refresh_tokens_family_id"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "token_family_id"`);
  }
}
