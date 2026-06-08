import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsNumber()
  @IsOptional()
  class_id?: number | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergy_tags?: string[];

  @IsString()
  @IsOptional()
  date_of_birth?: string | null;

  @IsString()
  @IsOptional()
  allergy_severity?: string;

  @IsString()
  @IsOptional()
  blood_type?: string;

  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @IsOptional()
  emergency_contact_phone?: string;

  @IsString()
  @IsOptional()
  emergency_contact_relation?: string;

  @IsString()
  @IsOptional()
  emergency_action?: string;

  @IsString()
  @IsOptional()
  medical_notes?: string;

  @IsString()
  @IsOptional()
  parent_email?: string;
}
