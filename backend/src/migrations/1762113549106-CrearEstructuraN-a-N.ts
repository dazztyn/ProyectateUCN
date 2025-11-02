import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearEstructuraNAN1762113549106 implements MigrationInterface {
    name = 'CrearEstructuraNAN1762113549106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asignaturas" DROP CONSTRAINT "FK_6134e2662bf58a8aa4da35cba2a"`);
        await queryRunner.query(`CREATE TABLE "instancias_asignaturas" ("id" SERIAL NOT NULL, "aprobada" boolean NOT NULL DEFAULT false, "semestreIdSemestre" integer, "asignaturaCodigoAsignatura" text, CONSTRAINT "PK_b74ac23173871bf3295fc736161" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "asignaturas" DROP COLUMN "semestreIdSemestre"`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" ADD CONSTRAINT "FK_b8a9bf27fcec5d639da47177831" FOREIGN KEY ("semestreIdSemestre") REFERENCES "semestres"("idSemestre") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" ADD CONSTRAINT "FK_ba6177918c1fa60f24bd95f20dc" FOREIGN KEY ("asignaturaCodigoAsignatura") REFERENCES "asignaturas"("codigoAsignatura") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" DROP CONSTRAINT "FK_ba6177918c1fa60f24bd95f20dc"`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" DROP CONSTRAINT "FK_b8a9bf27fcec5d639da47177831"`);
        await queryRunner.query(`ALTER TABLE "asignaturas" ADD "semestreIdSemestre" integer`);
        await queryRunner.query(`DROP TABLE "instancias_asignaturas"`);
        await queryRunner.query(`ALTER TABLE "asignaturas" ADD CONSTRAINT "FK_6134e2662bf58a8aa4da35cba2a" FOREIGN KEY ("semestreIdSemestre") REFERENCES "semestres"("idSemestre") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
