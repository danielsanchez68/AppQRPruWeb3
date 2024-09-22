import express, { Request, Response } from 'express'
import http from 'http';
import path from 'path';


import config from '../../../config'

import cors from 'cors'
import { IUI } from '../../Puertos/IUI'
import { inject, injectable } from 'inversify'
import TYPES from '../../../container.types'

import { IControladorMaq } from './controladores/IMaquina';
import { IControladorUsuario } from './controladores/IUsuario';


@injectable()
class UI_HTTP implements IUI {
    constructor(
        @inject(TYPES.IControladorMaq) private controladorMaq: IControladorMaq,
        @inject(TYPES.IControladorUsuario) private controladorUsuario: IControladorUsuario
    ) { }

    private configRouterMaq() {
        const router = express.Router()

        router.post('/consulta', this.controladorMaq.enviarConsultaMaquina)

        return router
    }

    private configRouterUsuario() {
        const router = express.Router()

        router.get('/headers', this.controladorUsuario.headers)

        return router
    }

    public async start() {
        const app = express()
        app.use(cors())
        app.use(express.json())

        // --------------------------------------------------------------
        //app.use(express.static('public'))
        // Servir archivos estáticos desde la carpeta "public"
        app.use(express.static(path.join(__dirname, '../../../../public')));
        // Ruta principal
        /* app.get('/', (req: Request, res: Response) => {
            //res.send('Hola Vercel root!: '+ __dirname);
            res.sendFile(path.join(__dirname, '../../../public', 'index.html'));
        }); */
        // --------------------------------------------------------------

        // --------- Configuración de Rutas / endpoints ---------
        app.use('/api/maquina', this.configRouterMaq())
        app.use('/api/usuario', this.configRouterUsuario())

        // --------------- Listen del Servidor ------------------
        const PORT = config.PORT

        const server = http.createServer(app).listen(PORT, () => console.log(`Server AppQR listen in http://localhost:${PORT}`))
        server.on('error', error => console.log(`Error en servidor: ${error.message}`))
    }
}

export default UI_HTTP
