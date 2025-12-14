import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearEstructuraNAN1765677814228 implements MigrationInterface {
    name = 'CrearEstructuraNAN1765677814228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "proyecciones" ("idProyeccion" SERIAL NOT NULL, "rutUsuario" text NOT NULL, "ideal" boolean NOT NULL, "nombreProyeccion" text NOT NULL, CONSTRAINT "UQ_e3f3dca7c4e882b50d9db1a7356" UNIQUE ("rutUsuario", "nombreProyeccion"), CONSTRAINT "PK_62f522379fd0aff294016de3768" PRIMARY KEY ("idProyeccion"))`);
        await queryRunner.query(`CREATE TABLE "asignaturas" ("codigoAsignatura" text NOT NULL, "nombreAsignatura" text NOT NULL, "creditos" integer NOT NULL, "nivel" integer NOT NULL, "prerrequisitos" text NOT NULL, CONSTRAINT "PK_3e6f2568245e3c22da8b3cc9315" PRIMARY KEY ("codigoAsignatura"))`);
        await queryRunner.query(`CREATE TABLE "instancias_asignaturas" ("id" SERIAL NOT NULL, "aprobada" boolean NOT NULL DEFAULT false, "semestreIdSemestre" integer, "asignaturaCodigoAsignatura" text, CONSTRAINT "PK_b74ac23173871bf3295fc736161" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "semestres" ("idSemestre" SERIAL NOT NULL, "numero" integer NOT NULL, "periodo" text NOT NULL, "totalCreditos" integer NOT NULL, "proyeccionIdProyeccion" integer, CONSTRAINT "PK_731684f8d2a4c8d226bb920ea7f" PRIMARY KEY ("idSemestre"))`);
        await queryRunner.query(`CREATE TABLE "roles_usuarios" ("email" text NOT NULL, "password" text, "rol" text NOT NULL DEFAULT 'student', "rut" text, CONSTRAINT "PK_e0224421186e9355a1c175ee7f8" PRIMARY KEY ("email"))`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" ADD CONSTRAINT "FK_b8a9bf27fcec5d639da47177831" FOREIGN KEY ("semestreIdSemestre") REFERENCES "semestres"("idSemestre") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" ADD CONSTRAINT "FK_ba6177918c1fa60f24bd95f20dc" FOREIGN KEY ("asignaturaCodigoAsignatura") REFERENCES "asignaturas"("codigoAsignatura") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "semestres" ADD CONSTRAINT "FK_baf60d69cbf216750ac965220bb" FOREIGN KEY ("proyeccionIdProyeccion") REFERENCES "proyecciones"("idProyeccion") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "semestres" DROP CONSTRAINT "FK_baf60d69cbf216750ac965220bb"`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" DROP CONSTRAINT "FK_ba6177918c1fa60f24bd95f20dc"`);
        await queryRunner.query(`ALTER TABLE "instancias_asignaturas" DROP CONSTRAINT "FK_b8a9bf27fcec5d639da47177831"`);
        await queryRunner.query(`DROP TABLE "roles_usuarios"`);
        await queryRunner.query(`DROP TABLE "semestres"`);
        await queryRunner.query(`DROP TABLE "instancias_asignaturas"`);
        await queryRunner.query(`DROP TABLE "asignaturas"`);
        await queryRunner.query(`DROP TABLE "proyecciones"`);
    }

}
