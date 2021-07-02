import net = require('net');
import { DBService } from './DBService';
export class Tcp_Server {
    startServer(port: number) {
        let tcp_server = net.createServer();  // 创建 tcp server
        let Sockets = {};
        let SocketID = 1;
        // 监听 端口
        tcp_server.listen(port, function () {
            console.log('TCP服务器监听端口' + port);
        });

        // 处理客户端连接
        tcp_server.on('connection', (socket) => {
            console.log(socket.address());
            Sockets[SocketID] = socket;
            this.DealConnect(socket)
            SocketID++;

        })

        tcp_server.on('error', function () {
            console.log('tcp_server error!');
        })

        tcp_server.on('close', function () {
            console.log('tcp_server close!');
        })



    }
    // 处理每个客户端消息
    DealConnect(socket) {
        socket.on('data', (data) => {
            //data = data.toString();
            // 向所有客户端广播消息
            // for (let i in Sockets) {
            //     Sockets[i].write(data);
            // }
            this.onMessage(data, socket)
            // socket.write(data);
            console.log('服务端发送信息： %s', data);
        })

        // 客户端正常断开时执行
        socket.on('close', function () {
            console.log('client disconneted!');
        })
        // 客户端正异断开时执行
        socket.on("error", function (err) {
            console.log('client error disconneted!');
        });
    }
    onMessage(data, socket) {
        let database = JSON.parse(data.toString())
        let sql = database.sql;
        let socketIndex = database.socketIndex;
        DBService.execute(sql, (data: any) => {
            console.log(data)
            data[0].socketIndex = socketIndex;
            socket.write(JSON.stringify(data));
        });
    }
}
export class Tcp_Client {
    protected tcp_client;
    protected index = 1;
    resolvemap = new Map<number, Function>();
    connectRpcServer(port) {
        // 指定连接的tcp server ip，端口
        let options = {
            host: '127.0.0.1',
            port: port
        }

        this.tcp_client = new net.Socket();

        // 连接 tcp server
        this.tcp_client.connect(options, () => {
            console.log('连接服务器');
        })

        // 接收数据
        this.tcp_client.on('data', (data) => {
            this.onMessage(data);
            // console.log('客户端接收数据: %s', data.toString());
        })

        this.tcp_client.on('end', function () {
            console.log('data end!');
        })

        this.tcp_client.on('error', function () {
            console.log('tcp_client error!');
        })
    }

    onMessage(data) {
        let database = JSON.parse(data.toString());
        let socketIndex = database[0].socketIndex;
        if (socketIndex) {
            delete database[0].socketIndex
            this.resolvemap.get(socketIndex)(database);
        }
    }

    async send(data) {
        let _this = this;
        return new Promise((resolve, reject) => {
            let socketIndex = _this.index;
            data.socketIndex = socketIndex;
            _this.index++
            _this.tcp_client.write(JSON.stringify(data))
            _this.resolvemap.set(socketIndex, resolve);
        })
    }
}