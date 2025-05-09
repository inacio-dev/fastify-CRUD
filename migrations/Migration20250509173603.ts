import { Migration } from '@mikro-orm/migrations';

export class Migration20250509173603 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "system_info" ("id" serial primary key, "version" varchar(255) not null default '1.0.0', "last_startup" timestamptz not null);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "system_info" cascade;`);
  }

}
