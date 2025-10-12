import { Injectable } from '@nestjs/common';

@Injectable()
export class HomeService 
{
    getHome():string
    {
        return`
            <html>
                <head>
                    <title>Home Page</title>
                </head>
                <body>
                    <h1>¡Bienvenido a Proyectate UCN!</h1>
                    <p>Este contenido viene desde el servicio.</p>
                </body>
            </html>
        `;
    
    }


}
