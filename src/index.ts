import { DBService } from "./DBService";
import { Tcp_Client, Tcp_Server } from "./TcpService";
import { HttpService } from "./HttpService";
export class test {
    static async main() {
        DBService.DBStart();
        HttpService.httpStart(8081);
        var tcp_Server = new Tcp_Server();
        tcp_Server.startServer(8082);
        var tcp_Client = new Tcp_Client();
        tcp_Client.connectRpcServer(8082);
        setTimeout(async function () {
            let data = await tcp_Client.send({ sql: "select * from players_1" });
            console.log(data)
        }, 1000);

    }
}
test.main();
