import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class InvoiceCronService {
  private readonly logger = new Logger(InvoiceCronService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Tự động quét hóa đơn quá hạn lúc 00:05 mỗi đêm
   * Cron expression: '0 5 0 * * *' (giây = 0, phút = 5, giờ = 0)
   */
  @Cron('0 5 0 * * *')
  async handleOverdueInvoices() {
    this.logger.log('--- KHỞI ĐỘNG CRONJOB QUÉT HÓA ĐƠN QUÁ HẠN ---');
    
    // Tính toán ngày ân hạn (Grace Period là 3 ngày)
    // Ví dụ: due_date là ngày 5, thì ngày 8 mới bắt đầu tính là quá hạn (due_date + 3 <= today)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 3);
    const thresholdDateStr = thresholdDate.toISOString().slice(0, 10);
    
    this.logger.log(`Ngày quét ngưỡng quá hạn (Hạn thanh toán từ ngày ${thresholdDateStr} trở về trước)`);

    // Sử dụng transaction để bảo đảm tính toàn vẹn dữ liệu
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Tìm các hóa đơn có trạng thái pending hoặc partial đã quá hạn dựa trên ngày ân hạn (dueDate <= thresholdDateStr)
      const overdueInvoices = await queryRunner.manager.find(Invoice, {
        where: [
          { status: 'pending', dueDate: LessThanOrEqual(thresholdDateStr) },
          { status: 'partial', dueDate: LessThanOrEqual(thresholdDateStr) },
        ],
        relations: ['student'],
      });

      this.logger.log(`Tìm thấy ${overdueInvoices.length} hóa đơn quá hạn (sau thời gian ân hạn 3 ngày).`);

      for (const invoice of overdueInvoices) {
        // Cập nhật trạng thái sang overdue
        invoice.status = 'overdue';
        await queryRunner.manager.save(Invoice, invoice);

        // Bắn thông báo về hệ thống cho Phụ huynh với giọng văn thân thiện, lịch sự chuẩn Mầm non
        if (invoice.student && invoice.student.guardianUserId) {
          const title = `Nhắc nhẹ hoàn thành học phí tháng ${invoice.month}`;
          const body = `Kính gửi Phụ huynh bé ${invoice.student.full_name}, nhà trường xin nhắc nhẹ kỳ học phí tháng ${invoice.month} của con đã đến hạn thanh toán (${invoice.dueDate}). Ba mẹ vui lòng kiểm tra và hoàn tất thanh toán để nhà trường chuẩn bị điều kiện chăm sóc và học tập tốt nhất cho các con nhé. Cảm ơn Ba mẹ rất nhiều!`;
          
          const notification = queryRunner.manager.create(Notification, {
            recipientUserId: invoice.student.guardianUserId,
            type: 'invoice',
            title,
            body,
            linkUrl: '/parent/my-invoices',
            isRead: false,
            relatedId: invoice.id,
          });
          await queryRunner.manager.save(Notification, notification);
          this.logger.log(`Đã gửi thông báo quá hạn thân thiện cho hóa đơn #${invoice.id} tới phụ huynh ID=${invoice.student.guardianUserId}`);
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log('✅ Đã hoàn thành cronjob quét hóa đơn quá hạn.');
    } catch (err: any) {
      this.logger.error(`❌ Lỗi khi xử lý hóa đơn quá hạn: ${err.message}`);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
