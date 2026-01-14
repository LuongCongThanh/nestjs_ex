import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthTables1768382228531 implements MigrationInterface {
  name = 'AddAuthTables1768382228531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_addresses_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_categories_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_categories_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_categories_parentId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_categories_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_price"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_sku"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_categoryId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_isFeatured"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_categoryId_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_isFeatured_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_order_items_orderId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_order_items_productId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_orderNumber"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_paymentStatus"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_orderId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_transactionId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cart_items_cartId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cart_items_productId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cart_items_cartId_productId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_carts_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_carts_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_carts_userId_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_addresses_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_addresses_isDefault"`);
    await queryRunner.query(
      `CREATE TABLE "token_blacklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "userId" uuid NOT NULL, "reason" character varying(50) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3e37528d03f0bd5335874afa48d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_8c2ca80e62a4a178870aa9e7a0" ON "token_blacklist" ("token") `);
    await queryRunner.query(`CREATE INDEX "IDX_cde27adb955c236798ccf3b9d5" ON "token_blacklist" ("userId") `);
    await queryRunner.query(
      `CREATE TABLE "reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_acd6ec48b54150b1736d0b454b9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying(500) NOT NULL, "user_id" uuid NOT NULL, "device_info" character varying(255), "ip_address" character varying(45), "is_revoked" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_4542dd2f38a61354a040ba9fd5" ON "refresh_tokens" ("token") `);
    await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_ba3bd69c8ad1e799c0256e9e50" ON "refresh_tokens" ("expires_at") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_14187aa4d2d58318c82c62c7ea" ON "refresh_tokens" ("user_id", "is_revoked") `,
    );
    await queryRunner.query(
      `CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying(255) NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3d1613f95c6a564a3b588d161ae" UNIQUE ("token"), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_8b0be371d28245da6e4f4b6187" ON "categories" ("name") `);
    await queryRunner.query(`CREATE INDEX "IDX_420d9f679d41281f282f5bc7d0" ON "categories" ("slug") `);
    await queryRunner.query(`CREATE INDEX "IDX_9a6f051e66982b5f0318981bca" ON "categories" ("parentId") `);
    await queryRunner.query(`CREATE INDEX "IDX_77d4cad977bd471fb670059561" ON "categories" ("isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_464f927ae360106b783ed0b410" ON "products" ("slug") `);
    await queryRunner.query(`CREATE INDEX "IDX_75895eeb1903f8a17816dafe0a" ON "products" ("price") `);
    await queryRunner.query(`CREATE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `);
    await queryRunner.query(`CREATE INDEX "IDX_ff56834e735fa78a15d0cf2192" ON "products" ("categoryId") `);
    await queryRunner.query(`CREATE INDEX "IDX_ff39b9ac40872b2de41751eedc" ON "products" ("isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_9e5b46d54cb77570fa51430ef6" ON "products" ("isFeatured") `);
    await queryRunner.query(`CREATE INDEX "IDX_c0050f0a725f90eefc3bc14096" ON "products" ("isFeatured", "isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_32cd206985f4311552152d81c2" ON "products" ("categoryId", "isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
    await queryRunner.query(`CREATE INDEX "IDX_409a0298fdd86a6495e23c25c6" ON "users" ("isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_f1d359a55923bb45b057fbdab0" ON "order_items" ("orderId") `);
    await queryRunner.query(`CREATE INDEX "IDX_cdb99c05982d5191ac8465ac01" ON "order_items" ("productId") `);
    await queryRunner.query(`CREATE INDEX "IDX_59b0c3b34ea0fa5562342f2414" ON "orders" ("orderNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_151b79a83ba240b0cb31b2302d" ON "orders" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_01b20118a3f640214e7a8a6b29" ON "orders" ("paymentStatus") `);
    await queryRunner.query(`CREATE INDEX "IDX_1f4b9818a08b822a31493fdee9" ON "orders" ("createdAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_af929a5f2a400fdb6913b4967e" ON "payments" ("orderId") `);
    await queryRunner.query(`CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_c39d78e8744809ece8ca95730e" ON "payments" ("transactionId") `);
    await queryRunner.query(`CREATE INDEX "IDX_8277a466232344577740a61344" ON "payments" ("createdAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_edd714311619a5ad0952504583" ON "cart_items" ("cartId") `);
    await queryRunner.query(`CREATE INDEX "IDX_72679d98b31c737937b8932ebe" ON "cart_items" ("productId") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2bf7996b7946ce753b60a87468" ON "cart_items" ("cartId", "productId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_69828a178f152f157dcf2f70a8" ON "carts" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_cf9a37169945cf32779a304728" ON "carts" ("isActive") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b7bbcb28b202e775922d525a68" ON "carts" ("userId", "isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_95c93a584de49f0b0e13f75363" ON "addresses" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_1eddd7727ca6a46f1c59deaaad" ON "addresses" ("isDefault") `);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_edd714311619a5ad09525045838" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_72679d98b31c737937b8932ebe6" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_69828a178f152f157dcf2f70a89" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_95c93a584de49f0b0e13f753630" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reset_tokens" ADD CONSTRAINT "FK_69015e2482e433b6d218ad0faf6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
    await queryRunner.query(`ALTER TABLE "reset_tokens" DROP CONSTRAINT "FK_69015e2482e433b6d218ad0faf6"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_95c93a584de49f0b0e13f753630"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_69828a178f152f157dcf2f70a89"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_72679d98b31c737937b8932ebe6"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_edd714311619a5ad09525045838"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1eddd7727ca6a46f1c59deaaad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_95c93a584de49f0b0e13f75363"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b7bbcb28b202e775922d525a68"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cf9a37169945cf32779a304728"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69828a178f152f157dcf2f70a8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2bf7996b7946ce753b60a87468"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_72679d98b31c737937b8932ebe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_edd714311619a5ad0952504583"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8277a466232344577740a61344"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c39d78e8744809ece8ca95730e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_af929a5f2a400fdb6913b4967e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1f4b9818a08b822a31493fdee9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_01b20118a3f640214e7a8a6b29"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_151b79a83ba240b0cb31b2302d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_59b0c3b34ea0fa5562342f2414"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cdb99c05982d5191ac8465ac01"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f1d359a55923bb45b057fbdab0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_409a0298fdd86a6495e23c25c6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_32cd206985f4311552152d81c2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0050f0a725f90eefc3bc14096"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9e5b46d54cb77570fa51430ef6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ff39b9ac40872b2de41751eedc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ff56834e735fa78a15d0cf2192"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_75895eeb1903f8a17816dafe0a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_464f927ae360106b783ed0b410"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77d4cad977bd471fb670059561"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a6f051e66982b5f0318981bca"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_420d9f679d41281f282f5bc7d0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8b0be371d28245da6e4f4b6187"`);
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_14187aa4d2d58318c82c62c7ea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ba3bd69c8ad1e799c0256e9e50"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4542dd2f38a61354a040ba9fd5"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "reset_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cde27adb955c236798ccf3b9d5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8c2ca80e62a4a178870aa9e7a0"`);
    await queryRunner.query(`DROP TABLE "token_blacklist"`);
    await queryRunner.query(`CREATE INDEX "IDX_addresses_isDefault" ON "addresses" ("isDefault") `);
    await queryRunner.query(`CREATE INDEX "IDX_addresses_userId" ON "addresses" ("userId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_carts_userId_isActive" ON "carts" ("userId", "isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_carts_isActive" ON "carts" ("isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_carts_userId" ON "carts" ("userId") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cart_items_cartId_productId" ON "cart_items" ("cartId", "productId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_cart_items_productId" ON "cart_items" ("productId") `);
    await queryRunner.query(`CREATE INDEX "IDX_cart_items_cartId" ON "cart_items" ("cartId") `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_createdAt" ON "payments" ("createdAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_transactionId" ON "payments" ("transactionId") `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_status" ON "payments" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_orderId" ON "payments" ("orderId") `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_createdAt" ON "orders" ("createdAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_paymentStatus" ON "orders" ("paymentStatus") `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_orderNumber" ON "orders" ("orderNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_productId" ON "order_items" ("productId") `);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId") `);
    await queryRunner.query(`CREATE INDEX "IDX_users_isActive" ON "users" ("isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_products_isFeatured_isActive" ON "products" ("isActive", "isFeatured") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_categoryId_isActive" ON "products" ("categoryId", "isActive") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_products_isFeatured" ON "products" ("isFeatured") `);
    await queryRunner.query(`CREATE INDEX "IDX_products_isActive" ON "products" ("isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_products_categoryId" ON "products" ("categoryId") `);
    await queryRunner.query(`CREATE INDEX "IDX_products_sku" ON "products" ("sku") `);
    await queryRunner.query(`CREATE INDEX "IDX_products_price" ON "products" ("price") `);
    await queryRunner.query(`CREATE INDEX "IDX_products_slug" ON "products" ("slug") `);
    await queryRunner.query(`CREATE INDEX "IDX_categories_isActive" ON "categories" ("isActive") `);
    await queryRunner.query(`CREATE INDEX "IDX_categories_parentId" ON "categories" ("parentId") `);
    await queryRunner.query(`CREATE INDEX "IDX_categories_slug" ON "categories" ("slug") `);
    await queryRunner.query(`CREATE INDEX "IDX_categories_name" ON "categories" ("name") `);
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_addresses_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_parent" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
