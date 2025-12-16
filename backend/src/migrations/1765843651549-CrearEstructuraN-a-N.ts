import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearEstructuraNAN1765843651549 implements MigrationInterface {
    name = 'CrearEstructuraNAN1765843651549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "asignaturas" ("codigoAsignatura" text NOT NULL, "codigoCarrera" text NOT NULL, "nombreAsignatura" text NOT NULL, "creditos" integer NOT NULL, "nivel" integer NOT NULL, "prerrequisitos" text NOT NULL, CONSTRAINT "PK_f35b6d1f418583538cd88736145" PRIMARY KEY ("codigoAsignatura", "codigoCarrera"))`);
        await queryRunner.query(`CREATE TABLE "instancias_asignaturas" ("id" SERIAL NOT NULL, "estado" character varying NOT NULL DEFAULT 'PENDIENTE', "semestreIdSemestre" integer, "asignaturaCodigoAsignatura" text, "asignaturaCodigoCarrera" text, CONSTRAINT "PK_b74ac23173871bf3295fc736161" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "semestres" ("idSemestre" SERIAL NOT NULL, "editable" boolean NOT NULL, "numero" integer NOT NULL, "periodo" text NOT NULL, "totalCreditos" integer NOT NULL, "proyeccionIdProyeccion" integer, CONSTRAINT "PK_731684f8d2a4c8d226bb920ea7f" PRIMARY KEY ("idSemestre"))`);
        await queryRunner.query(`CREATE TABLE "proyecciones" ("idProyeccion" SERIAL NOT NULL, "codigoCarrera" text NOT NULL, "rutUsuario" text NOT NULL, "ideal" boolean NOT NULL, "nombreProyeccion" text NOT NULL, CONSTRAINT "UQ_5857a986dc8acf038fa286c8428" UNIQUE ("rutUsuario", "nombreProyeccion", "codigoCarrera"), CONSTRAINT "PK_62f522379fd0aff294016de3768" PRIMARY KEY ("idProyeccion"))`);
        await queryRunner.query(`CREATE TABLE "avance_real" ("id" SERIAL NOT NULL, "rutUsuario" character varying NOT NULL, "nrc" character varying, "codigoCarrera" character varying NOT NULL, "codigoAsignatura" character varying NOT NULL, "nombreAsignatura" character varying NOT NULL, "creditos" integer, "periodo" character varying NOT NULL, "estado" character varying NOT NULL, "nota" double precision, "vez" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_ff0fb7e69d00a5784af63484f42" UNIQUE ("rutUsuario", "codigoCarrera", "codigoAsignatura", "periodo"), CONSTRAINT "PK_544a49d954a439aada0587f96c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles_usuarios" ("email" text NOT NULL, "password" text, "rol" text NOT NULL DEFAULT 'student', "rut" text, CONSTRAINT "PK_e0224421186e9355a1c175ee7f8" PRIMARY KEY ("email"))`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" ADD CONSTRAINT "FK_b8a9bf27fcec5d639da47177831" FOREIGN KEY ("semestreIdSemestre") REFERENCES "semestres"("idSemestre") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" ADD CONSTRAINT "FK_dff8435c5bdf89f1ce4bf85da17" FOREIGN KEY ("asignaturaCodigoAsignatura", "asignaturaCodigoCarrera") REFERENCES "asignaturas"("codigoAsignatura","codigoCarrera") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "semestres" ADD CONSTRAINT "FK_baf60d69cbf216750ac965220bb" FOREIGN KEY ("proyeccionIdProyeccion") REFERENCES "proyecciones"("idProyeccion") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "semestres" DROP CONSTRAINT "FK_baf60d69cbf216750ac965220bb"`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" DROP CONSTRAINT "FK_dff8435c5bdf89f1ce4bf85da17"`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" DROP CONSTRAINT "FK_b8a9bf27fcec5d639da47177831"`);
        await queryRunner.query(`DROP TABLE "roles_usuarios"`);
        await queryRunner.query(`DROP TABLE "avance_real"`);
        await queryRunner.query(`DROP TABLE "proyecciones"`);
        await queryRunner.query(`DROP TABLE "semestres"`);
        await queryRunner.query(`DROP TABLE "instancias_asignaturas"`);
        await queryRunner.query(`DROP TABLE "asignaturas"`);
    }

}
