import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearTablasProyeccion1760554362936 implements MigrationInterface {
    name = 'CrearTablasProyeccion1760554362936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "proyecciones" ("idProyeccion" SERIAL NOT NULL, "rutUsuario" text NOT NULL, "ideal" boolean NOT NULL, "nombreProyeccion" text NOT NULL, CONSTRAINT "PK_62f522379fd0aff294016de3768" PRIMARY KEY ("idProyeccion"))`);
        await queryRunner.query(`CREATE TABLE "asignaturas" ("codigoAsignatura" text NOT NULL, "nombreAsignatura" text NOT NULL, "creditos" integer NOT NULL, "nivel" integer NOT NULL, "prerrequisitos" text NOT NULL, "semestreIdSemestre" integer, CONSTRAINT "PK_3e6f2568245e3c22da8b3cc9315" PRIMARY KEY ("codigoAsignatura"))`);
        await queryRunner.query(`CREATE TABLE "semestres" ("idSemestre" SERIAL NOT NULL, "numero" integer NOT NULL, "periodo" text NOT NULL, "totalCreditos" integer NOT NULL, "proyeccionIdProyeccion" integer, CONSTRAINT "PK_731684f8d2a4c8d226bb920ea7f" PRIMARY KEY ("idSemestre"))`);
        await queryRunner.query(`ALTER TABLE "asignaturas" ADD CONSTRAINT "FK_6134e2662bf58a8aa4da35cba2a" FOREIGN KEY ("semestreIdSemestre") REFERENCES "semestres"("idSemestre") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "semestres" ADD CONSTRAINT "FK_baf60d69cbf216750ac965220bb" FOREIGN KEY ("proyeccionIdProyeccion") REFERENCES "proyecciones"("idProyeccion") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "semestres" DROP CONSTRAINT "FK_baf60d69cbf216750ac965220bb"`);
        await queryRunner.query(`ALTER TABLE "asignaturas" DROP CONSTRAINT "FK_6134e2662bf58a8aa4da35cba2a"`);
        await queryRunner.query(`DROP TABLE "semestres"`);
        await queryRunner.query(`DROP TABLE "asignaturas"`);
        await queryRunner.query(`DROP TABLE "proyecciones"`);
    }

}
