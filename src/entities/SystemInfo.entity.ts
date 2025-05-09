import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'system_info' })
export class SystemInfo {
  @PrimaryKey()
  id = 1

  @Property()
  version = '1.0.0'

  @Property()
  lastStartup: Date = new Date()
}
