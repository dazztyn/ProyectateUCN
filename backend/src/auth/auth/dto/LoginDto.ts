
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto
{
    @IsEmail({}, { message: 'El email debe ser una dirección de correo electrónico válida.' })
    email: string;

    @IsNotEmpty({ message: 'La contraseña no debe estar vacía.' })
    @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres.' })
    password: string;
}