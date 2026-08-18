import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  constructor(private readonly configService: ConfigService) {}

  generateCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  generateShareToken(): string {
    return randomBytes(16).toString('hex');
  }

  sign(code: string): string {
    return `${code}.${this.createSignature(code)}`;
  }

  verify(payload: string): string | null {
    const parts = payload.split('.');

    if (parts.length !== 2) {
      return null;
    }

    const [code, signature] = parts;
    const expected = this.createSignature(code);

    if (signature.length !== expected.length) {
      return null;
    }

    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    return isValid ? code : null;
  }

  toDataUrl(payload: string): Promise<string> {
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
    });
  }

  private createSignature(code: string): string {
    const secret = this.configService.getOrThrow<string>('TICKET_QR_SECRET');
    return createHmac('sha256', secret).update(code).digest('hex');
  }
}
