import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';

class LoginDto
{
    email: string;
    password: string;
}

@Controller('auth')
export class AuthController 
{
    constructor(private auth: AuthService) {}

    @Post('/login')
    login(@Body() loginDto: LoginDto)
    {
        console.log("correo",loginDto.email, "contraseña",loginDto.password);
        return this.auth.login(loginDto.email, loginDto.password);
    }
    
}
