import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1712490000000 implements MigrationInterface {
    name = 'InitSchema1712490000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` enum ('ADMIN', 'TEACHER', 'PARENT') NOT NULL DEFAULT 'PARENT', UNIQUE INDEX \`IDX_user_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE \`teachers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`full_name\` varchar(255) NOT NULL, \`specializations\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`REL_teacher_user\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE \`classrooms\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`teacher_id\` int NULL, \`max_capacity\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE \`students\` (\`id\` int NOT NULL AUTO_INCREMENT, \`full_name\` varchar(255) NOT NULL, \`class_id\` int NULL, \`guardian_user_id\` int NULL, \`allergy_tags\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE \`skill_assessments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NULL, \`teacher_id\` int NULL, \`cognitive_score\` decimal(5,2) NOT NULL, \`social_score\` decimal(5,2) NOT NULL, \`deficiency_log\` text NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        await queryRunner.query(`CREATE TABLE \`health_records\` (\`id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NULL, \`weight\` decimal(5,2) NOT NULL, \`height\` decimal(5,2) NOT NULL, \`heart_rate\` int NOT NULL, \`bmi_value\` decimal(5,2) NOT NULL, \`doctor_note\` text NULL, \`logged_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Foreign keys
        await queryRunner.query(`ALTER TABLE \`teachers\` ADD CONSTRAINT \`FK_teacher_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`classrooms\` ADD CONSTRAINT \`FK_class_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD CONSTRAINT \`FK_student_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`classrooms\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD CONSTRAINT \`FK_student_guardian\` FOREIGN KEY (\`guardian_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`skill_assessments\` ADD CONSTRAINT \`FK_skill_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`skill_assessments\` ADD CONSTRAINT \`FK_skill_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`health_records\` ADD CONSTRAINT \`FK_health_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`health_records\` DROP FOREIGN KEY \`FK_health_student\``);
        await queryRunner.query(`ALTER TABLE \`skill_assessments\` DROP FOREIGN KEY \`FK_skill_teacher\``);
        await queryRunner.query(`ALTER TABLE \`skill_assessments\` DROP FOREIGN KEY \`FK_skill_student\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_student_guardian\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_student_class\``);
        await queryRunner.query(`ALTER TABLE \`classrooms\` DROP FOREIGN KEY \`FK_class_teacher\``);
        await queryRunner.query(`ALTER TABLE \`teachers\` DROP FOREIGN KEY \`FK_teacher_user\``);

        await queryRunner.query(`DROP TABLE \`health_records\``);
        await queryRunner.query(`DROP TABLE \`skill_assessments\``);
        await queryRunner.query(`DROP TABLE \`students\``);
        await queryRunner.query(`DROP TABLE \`classrooms\``);
        await queryRunner.query(`DROP TABLE \`teachers\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}
