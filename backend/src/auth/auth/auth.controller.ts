import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/LoginDto.js';

@Controller('auth')
export class AuthController 
{
    constructor(private auth: AuthService) {}

    @Post('/login')
    login(@Body() loginDto: LoginDto)
    {
        return this.auth.login(loginDto.email, loginDto.password);
    }
    
}
