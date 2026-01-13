import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create ENUM types
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin', 'staff')`);
    await queryRunner.query(`CREATE TYPE "public"."addresses_type_enum" AS ENUM('home', 'office', 'other')`);
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_paymentstatus_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('cod', 'bank_transfer', 'momo', 'vnpay', 'zalopay', 'credit_card', 'paypal')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')`,
    );

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "firstName" character varying(100),
        "lastName" character varying(100),
        "phone" character varying(20),
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "isActive" boolean NOT NULL DEFAULT true,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_isActive" ON "users" ("isActive")`);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "image" character varying(500),
        "parentId" integer,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_categories_name" ON "categories" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_slug" ON "categories" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_parentId" ON "categories" ("parentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_isActive" ON "categories" ("isActive")`);
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD CONSTRAINT "FK_categories_parent"
      FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL NOT NULL,
        "name" character varying(500) NOT NULL,
        "slug" character varying(500) NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL,
        "comparePrice" numeric(10,2),
        "stock" integer NOT NULL DEFAULT 0,
        "sku" character varying(100) NOT NULL,
        "images" json NOT NULL DEFAULT '[]',
        "categoryId" integer NOT NULL,
        "weight" numeric(8,2),
        "dimensions" json,
        "tags" json NOT NULL DEFAULT '[]',
        "seo" json,
        "isActive" boolean NOT NULL DEFAULT true,
        "isFeatured" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_products_slug" ON "products" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_price" ON "products" ("price")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_sku" ON "products" ("sku")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_categoryId" ON "products" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_isActive" ON "products" ("isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_isFeatured" ON "products" ("isFeatured")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_categoryId_isActive" ON "products" ("categoryId", "isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_isFeatured_isActive" ON "products" ("isFeatured", "isActive")`);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_category"
      FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL
    `);

    // Create addresses table
    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id" SERIAL NOT NULL,
        "userId" uuid NOT NULL,
        "label" character varying(100) NOT NULL,
        "fullName" character varying(255) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "address" character varying(500) NOT NULL,
        "ward" character varying(100),
        "district" character varying(100),
        "city" character varying(100) NOT NULL,
        "country" character varying(100) NOT NULL DEFAULT 'Vietnam',
        "postalCode" character varying(20),
        "isDefault" boolean NOT NULL DEFAULT false,
        "type" "public"."addresses_type_enum" NOT NULL DEFAULT 'home',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_addresses_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_addresses_userId" ON "addresses" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_addresses_isDefault" ON "addresses" ("isDefault")`);
    await queryRunner.query(`
      ALTER TABLE "addresses"
      ADD CONSTRAINT "FK_addresses_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create carts table
    await queryRunner.query(`
      CREATE TABLE "carts" (
        "id" SERIAL NOT NULL,
        "userId" uuid NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_carts_userId" ON "carts" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_carts_isActive" ON "carts" ("isActive")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_carts_userId_isActive" ON "carts" ("userId", "isActive")`);
    await queryRunner.query(`
      ALTER TABLE "carts"
      ADD CONSTRAINT "FK_carts_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create cart_items table
    await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id" SERIAL NOT NULL,
        "cartId" integer NOT NULL,
        "productId" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "price" numeric(10,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_items_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_cart_items_cartId" ON "cart_items" ("cartId")`);
    await queryRunner.query(`CREATE INDEX "IDX_cart_items_productId" ON "cart_items" ("productId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cart_items_cartId_productId" ON "cart_items" ("cartId", "productId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      ADD CONSTRAINT "FK_cart_items_cart"
      FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      ADD CONSTRAINT "FK_cart_items_product"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" SERIAL NOT NULL,
        "orderNumber" character varying(50) NOT NULL,
        "userId" uuid NOT NULL,
        "subtotal" numeric(10,2) NOT NULL,
        "tax" numeric(10,2) NOT NULL DEFAULT 0,
        "shippingFee" numeric(10,2) NOT NULL DEFAULT 0,
        "total" numeric(10,2) NOT NULL,
        "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending',
        "paymentStatus" "public"."orders_paymentstatus_enum" NOT NULL DEFAULT 'pending',
        "shippingAddressSnapshot" json,
        "notes" text,
        "adminNote" text,
        "cancelReason" character varying(500),
        "estimatedDeliveryDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_orderNumber" ON "orders" ("orderNumber")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_paymentStatus" ON "orders" ("paymentStatus")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_createdAt" ON "orders" ("createdAt")`);
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" SERIAL NOT NULL,
        "orderId" integer NOT NULL,
        "productId" integer NOT NULL,
        "productName" character varying(500) NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "quantity" integer NOT NULL,
        "total" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_order_items_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_productId" ON "order_items" ("productId")`);
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_order_items_order"
      FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_order_items_product"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" SERIAL NOT NULL,
        "orderId" integer NOT NULL,
        "method" "public"."payments_method_enum" NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'VND',
        "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending',
        "transactionId" character varying,
        "provider" character varying(50),
        "providerResponse" json,
        "paymentProof" character varying(500),
        "ipAddress" character varying(45),
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_payments_transactionId" UNIQUE ("transactionId"),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_orderId" ON "payments" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_status" ON "payments" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_transactionId" ON "payments" ("transactionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_createdAt" ON "payments" ("createdAt")`);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_order"
      FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_addresses_user"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP TABLE "carts"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."addresses_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
