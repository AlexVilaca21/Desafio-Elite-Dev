import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { QrCodeService } from './qr-code.service';

describe('QrCodeService', () => {
  let service: QrCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrCodeService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-qr-secret'),
          },
        },
      ],
    }).compile();

    service = module.get(QrCodeService);
  });

  it('should sign and verify a ticket code', () => {
    const payload = service.sign('ABC123');

    expect(payload.startsWith('ABC123.')).toBe(true);
    expect(service.verify(payload)).toBe('ABC123');
  });

  it('should reject a forged payload', () => {
    expect(service.verify('ABC123.forgedsignature')).toBeNull();
    expect(service.verify('invalid')).toBeNull();
  });

  it('should generate a qr image data url', async () => {
    const image = await service.toDataUrl(service.sign('ABC123'));

    expect(image.startsWith('data:image/png;base64,')).toBe(true);
  });
});
