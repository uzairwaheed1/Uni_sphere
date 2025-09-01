import { ApiProperty } from '@nestjs/swagger';

export class UploadPdfDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PDF file to upload',
    example: 'file.pdf'
  })
  file: any;
}

export class PdfResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  courseModuleId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;
}
