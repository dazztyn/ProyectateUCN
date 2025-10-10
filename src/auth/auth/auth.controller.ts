import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

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
        return this.auth.login(loginDto.email, loginDto.password);
    }
    
}
