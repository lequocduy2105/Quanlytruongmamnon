const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'apps', 'academic-service', 'src', 'academic-service.service.ts');
let content = fs.readFileSync(filepath, 'utf8');

const targetStr = `    invoice.amountPaid = Number(invoice.totalAmount || 0);
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await this.invoiceRepo.save(invoice);

    return { success: true, newStatus: invoice.status };
  }`;

const replacement = `    invoice.amountPaid = Number(invoice.totalAmount || 0);
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await this.invoiceRepo.save(invoice);

    return { success: true, newStatus: invoice.status };
  }

  /** Xử lý thanh toán tự động qua Webhook */
  async processPaymentWebhook(referenceCode: string, amount: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Tìm hóa đơn bằng referenceCode (ví dụ: INV202605STU1)
      const match = referenceCode.match(/^INV(\\d{4})(\\d{2})STU(\\d+)$/i);
      let invoice: Invoice | null = null;
      
      if (match) {
        const year = match[1];
        const month = match[2];
        const studentId = parseInt(match[3], 10);
        invoice = await queryRunner.manager.findOne(Invoice, {
          where: { studentId, month: year + '-' + month },
          relations: ['student'],
          lock: { mode: 'pessimistic_write' },
        });
      } else {
        // Fallback: Tìm theo invoiceId trực tiếp (INV-123 hoặc 123)
        const idMatch = referenceCode.match(/^INV-?(\\d+)$/i);
        const invoiceId = idMatch ? parseInt(idMatch[1], 10) : parseInt(referenceCode, 10);
        if (!isNaN(invoiceId)) {
          invoice = await queryRunner.manager.findOne(Invoice, {
            where: { id: invoiceId },
            relations: ['student'],
            lock: { mode: 'pessimistic_write' },
          });
        }
      }

      if (!invoice) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'Không tìm thấy hóa đơn tương ứng với mã thanh toán: ' + referenceCode };
      }

      if (invoice.status === 'paid') {
        await queryRunner.rollbackTransaction();
        return { success: true, message: 'Hóa đơn đã được thanh toán trước đó.' };
      }

      const totalAmount = Number(invoice.totalAmount || 0);
      if (amount >= totalAmount) {
        // Tạo bản ghi giao dịch
        const payment = queryRunner.manager.create(Payment, {
          invoiceId: invoice.id,
          amount: amount,
          paymentMethod: 'bank_transfer',
          referenceCode: referenceCode,
          note: 'Thanh toán tự động thành công qua cổng Webhook.',
        });
        await queryRunner.manager.save(Payment, payment);

        // Cập nhật hóa đơn
        invoice.amountPaid = amount;
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.note = (invoice.note ? invoice.note + '\\n' : '') + 'Đã thanh toán tự động qua Webhook (' + referenceCode + ').';
        await queryRunner.manager.save(Invoice, invoice);

        await queryRunner.commitTransaction();
        return { success: true, message: 'Xử lý hóa đơn thành công.' };
      } else {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'Số tiền thanh toán không đủ. Yêu cầu: ' + totalAmount + ', Nhận: ' + amount };
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }`;

// Find targetStr and replace it.
const normalize = s => s.replace(/\r\n/g, '\n');
const normalizedContent = normalize(content);
const normalizedTarget = normalize(targetStr);

const index = normalizedContent.indexOf(normalizedTarget);
if (index === -1) {
  console.error('Could not find target string in service!');
  process.exit(1);
}

console.log('Found target at index:', index);

const originalTargetIndex = content.replace(/\r\n/g, '\n').indexOf(normalizedTarget);
let originalLength = 0;
let currentPos = 0;
let normalizedPos = 0;
while (normalizedPos < index + normalizedTarget.length) {
  if (content[currentPos] === '\r' && content[currentPos+1] === '\n') {
    currentPos += 2;
    normalizedPos += 1;
  } else {
    currentPos += 1;
    normalizedPos += 1;
  }
}
const endPos = currentPos;

currentPos = 0;
normalizedPos = 0;
while (normalizedPos < index) {
  if (content[currentPos] === '\r' && content[currentPos+1] === '\n') {
    currentPos += 2;
    normalizedPos += 1;
  } else {
    currentPos += 1;
    normalizedPos += 1;
  }
}
const startPos = currentPos;

const newContent = content.substring(0, startPos) + replacement + content.substring(endPos);
fs.writeFileSync(filepath, newContent, 'utf8');
console.log('Successfully patched processPaymentWebhook!');
