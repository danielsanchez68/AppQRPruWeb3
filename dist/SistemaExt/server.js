"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const fs_1 = __importDefault(require("fs"));
const delay_1 = __importDefault(require("./util/delay"));
const config_1 = __importDefault(require("./config"));
const inversify_1 = require("inversify");
const container_types_1 = __importDefault(require("./container.types"));
const coloring_1 = __importDefault(require("./util/coloring"));
const timeout_1 = __importDefault(require("./timeout"));
const nombres_1 = require("./util/nombres");
const timeOut = new timeout_1.default();
let Server = class Server {
    constructor(maquinas, ultimosMovimientos) {
        this.maquinas = maquinas;
        this.ultimosMovimientos = ultimosMovimientos;
    }
    start() {
        const options = {
            keepAlive: true
        };
        // Crear el servidor TCP
        const server = net_1.default.createServer(options, socket => {
            let buffer = '';
            //https://nodejs.org/docs/latest-v8.x/api/net.html#net_class_net_socket
            //console.log(`\n[${Date.now()} ${new Date().toLocaleString()}] Client connected: ip[${socket.remoteAddress}] port[${socket.remotePort}]`)
            // Evento para manejar datos recibidos del cliente
            socket.on('data', (data) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                buffer += data;
                let imei = '';
                try {
                    const datosRecibidos = JSON.parse(buffer);
                    buffer = '';
                    let datosEnviados = {};
                    const cmd = JSON.parse(yield fs_1.default.promises.readFile('./Comandos/listado.json', 'utf-8'));
                    //nuevo server TCP
                    const comando = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.Comando;
                    imei = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.imei;
                    timeOut.setLive(imei);
                    // para pruebas
                    //console.log(timeOut.getLives())
                    //JSON.parse('Holas')
                    coloring_1.default.colorLog(timeOut.getColorImei(imei), `[${Date.now()} ${new Date().toLocaleString()}] imei[${imei}] <Cmd: ip[${socket.remoteAddress}] port[${socket.remotePort}] cmd[${comando}]`);
                    const comandoExists = (_b = (_a = cmd[comando]) === null || _a === void 0 ? void 0 : _a.tx) === null || _b === void 0 ? void 0 : _b.Comando;
                    if (comandoExists) {
                        let llenarDatosEnviados = true;
                        //console.log(comando)
                        /* if(
                            comando === 'Operacion_SubirDinero' ||
                            comando === 'VinculaTerminal' ||
                            comando === 'ConsultaTerminal' ||
                            comando === 'ListaUID' ||
                            comando === 'UltimosMovimientos'
                        ) */ yield (0, delay_1.default)(200);
                        if (comando == 'Login') {
                            //console.log('LOGIN!!!', timeOut.getSendLogin(imei))
                            if (timeOut.getSendLogin(imei)) {
                                cmd[comando].rx.Operador = (0, nombres_1.getNombre)() || 'Juan Perez';
                                timeOut.resetSendLogin(imei);
                            }
                            else
                                llenarDatosEnviados = false;
                        }
                        else if (comando == 'ConsultaTerminal') {
                            const codigo = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.QR;
                            const maquina = yield this.maquinas.obtenerPorCodigo(codigo);
                            cmd[comando].rx.Fabricante = maquina.NombreFabricante;
                            cmd[comando].rx.Juego = maquina.NombreJuego;
                            cmd[comando].rx.UID = maquina.uuid;
                        }
                        else if (comando == 'ListaUID') {
                            const uuid = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.UID;
                            const maquinas = yield this.maquinas.filtrarPorUuid(uuid);
                            cmd[comando].rx.Terminales = maquinas.map(maq => {
                                return {
                                    Vinculada: maq.codigo,
                                    UID: maq.uuid,
                                    Fabricante: maq.NombreFabricante,
                                    Juego: maq.NombreJuego
                                };
                            });
                        }
                        else if (comando == 'Operacion_SubirDinero') {
                            const codigo = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.QR;
                            const importe = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.Importe;
                            const FyH = new Date().toLocaleString().replace(',', '');
                            const maquina = yield this.maquinas.obtenerPorCodigo(codigo);
                            const movimiento = {
                                Fabricante: maquina.NombreFabricante,
                                Juego: maquina.NombreJuego,
                                UID: maquina.uuid,
                                Importe: importe,
                                FechaHora: FyH
                            };
                            yield this.ultimosMovimientos.agregar(movimiento);
                        }
                        else if (comando == 'UltimosMovimientos') {
                            cmd[comando].rx.Movimientos = (yield this.ultimosMovimientos.obtener()).map(mov => (Object.assign(Object.assign({}, mov), { ticket: '12345678', impuesto: 69.82, neto: mov.Importe - 69.82 })));
                        }
                        else if (comando == 'VinculaTerminal') {
                            const codigo = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.QR;
                            const uuid = datosRecibidos === null || datosRecibidos === void 0 ? void 0 : datosRecibidos.UID;
                            yield this.maquinas.relacionarCodigo(codigo, uuid);
                            const maquina = (yield this.maquinas.filtrarPorUuid(uuid))[0];
                            cmd[comando].rx.Fabricante = maquina.NombreFabricante;
                            cmd[comando].rx.Juego = maquina.NombreJuego;
                            cmd[comando].rx.UID = uuid;
                        }
                        if (llenarDatosEnviados) {
                            datosEnviados = (_c = cmd[comando]) === null || _c === void 0 ? void 0 : _c.rx;
                            coloring_1.default.colorLog(timeOut.getColorImei(imei), `[${Date.now()} ${new Date().toLocaleString()}] imei[${imei}] >Cmd: ip[${socket.remoteAddress}] port[${socket.remotePort}] cmd[${(_d = cmd[comando]) === null || _d === void 0 ? void 0 : _d.rx.Comando}]`);
                        }
                    }
                    // Enviar datos de vuelta al cliente
                    socket.write(JSON.stringify(datosEnviados));
                }
                //catch { }
                catch (error) {
                    console.log(coloring_1.default.colorString(coloring_1.default.BgRed, 'ERROR:'), coloring_1.default.colorString(timeOut.getColorImei(imei), `imei[${imei}]`), coloring_1.default.colorString(coloring_1.default.BgWhite + coloring_1.default.FgBlack, error.message));
                }
            }));
            // Evento cuando se cierra la conexión del cliente
            socket.on('close', () => {
                //console.log(`[${Date.now()} ${new Date().toLocaleString()}] Client disconnected: ip[${socket.remoteAddress}] port[${socket.remotePort}]`)
            });
            // Manejar errores de conexión
            socket.on('error', (err) => {
                console.error('Connection error:', err);
            });
        });
        const PORT = config_1.default.PORT_EXT;
        server.listen(PORT, () => {
            console.log(`Servicio TCP AppQR escuchando en el puerto ${PORT} (persistencia en ${config_1.default.MODO_PERSISTENCIA})`);
        });
    }
};
Server = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(container_types_1.default.IMaquinas)),
    __param(1, (0, inversify_1.inject)(container_types_1.default.IUltimosMovimientos)),
    __metadata("design:paramtypes", [Object, Object])
], Server);
exports.default = Server;
