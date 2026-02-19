class Network {
    constructor() {
        this.ws = null;
        this.onMessage = null; // Callback
    }

    connect(onGameStart, onMoveReceived, onOpponentDisconnect) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // ローカル開発環境（localhost）なら 3000 番ポートを使い、本番（Vercelなど）なら Render のURLを使用する
        let host = window.location.hostname + ':3000';
        if (window.location.hostname !== 'localhost') {
            // Render で取得した実際のサーバーURLを設定
            host = 'shogi-server-n1f3.onrender.com';
        }

        this.ws = new WebSocket(`${protocol}//${host}`);

        this.ws.onopen = () => {
            console.log('Connected to server, joining game...');
            this.send({ type: 'join_game' });
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Network msg:', data);

            if (data.type === 'game_start') {
                if (onGameStart) onGameStart(data.player);
            } else if (data.type === 'move') {
                if (onMoveReceived) onMoveReceived(data);
            } else if (data.type === 'drop') {
                if (onMoveReceived) onMoveReceived(data);
            } else if (data.type === 'opponent_disconnected') {
                if (onOpponentDisconnect) onOpponentDisconnect();
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected');
        };
    }

    sendMove(moveData) {
        this.send({ type: 'move', ...moveData });
    }

    sendDrop(dropData) {
        this.send({ type: 'drop', ...dropData });
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}
