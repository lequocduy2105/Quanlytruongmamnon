import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type NotificationType =
  | 'invoice'
  | 'attendance'
  | 'activity'
  | 'announcement'
  | 'health'
  | 'medication'
  | 'incident'
  | 'leave_request'
  | 'ticket';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recipient_user_id', type: 'int' })
  recipientUserId: number;

  @Column({
    type: 'enum',
    enum: [
      'invoice',
      'attendance',
      'activity',
      'announcement',
      'health',
      'medication',
      'incident',
      'leave_request',
      'ticket',
    ],
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'link_url', type: 'varchar', length: 500, nullable: true })
  linkUrl: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'related_id', type: 'int', nullable: true })
  relatedId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
