use axum::{
    Router,
    routing::get,
    response::Html,
    extract::ws::{WebSocket, WebSocketUpgrade, Message},
};
use std::net::SocketAddr;

pub struct WebServer {
    port: u16,
}

impl WebServer {
    pub fn new(port: u16) -> Self {
        Self { port }
    }
    
    pub async fn run(&self) -> Result<(), Box<dyn std::error::Error>> {
        let addr = SocketAddr::from(([0, 0, 0, 0], self.port));
        
        // 创建HTTP路由
        let app = Router::new()
            .route("/", get(index_handler))
            .route("/ws", get(ws_handler));
        
        // 启动服务器
        println!("Web server running on http://localhost:{}", self.port);
        axum::Server::bind(&addr)
            .serve(app.into_make_service())
            .await?;
        
        Ok(())
    }
}

async fn index_handler() -> Html<&'static str> {
    Html("<html><body><h1>ServiceFlow Web Interface</h1></body></html>")
}

async fn ws_handler(ws: WebSocketUpgrade) -> axum::response::Response {
    ws.on_upgrade(handle_websocket)
}

async fn handle_websocket(mut socket: WebSocket) {
    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    println!("Received: {}", text);
                    // Echo back
                    if socket.send(Message::Text(text)).await.is_err() {
                        break;
                    }
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        } else {
            break;
        }
    }
}