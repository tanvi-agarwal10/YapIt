import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'auth_service.dart';

const String socketUrl = 'http://localhost:5000';

class SocketService {
  static IO.Socket? _socket;
  static bool _isConnected = false;

  static Future<IO.Socket> connect(String userId) async {
    if (_socket != null && _isConnected) {
      return _socket!;
    }

    final token = await AuthService.getToken();

    _socket = IO.io(socketUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build());

    _socket!.connect();

    _socket!.onConnect((_) {
      _isConnected = true;
      print('✓ Connected to WebSocket');
      _socket!.emit('user:login', userId);
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      print('✗ Disconnected from WebSocket');
    });

    return _socket!;
  }

  static IO.Socket? getSocket() => _socket;

  static bool isConnected() => _isConnected;

  static void disconnect(String userId) {
    if (_socket != null) {
      _socket!.emit('user:logout', userId);
      _socket!.disconnect();
      _isConnected = false;
    }
  }

  static void sendMessage(String senderId, String receiverId, String content) {
    if (_socket != null) {
      _socket!.emit('message:send', {
        'senderId': senderId,
        'receiverId': receiverId,
        'content': content,
      });
    }
  }

  static void onMessageReceive(Function(Map<String, dynamic>) callback) {
    if (_socket != null) {
      _socket!.on('message:receive', (data) {
        callback(data);
      });
    }
  }

  static void onUserOnline(Function(String) callback) {
    if (_socket != null) {
      _socket!.on('user:online', (data) {
        callback(data['userId']);
      });
    }
  }

  static void onUserOffline(Function(String) callback) {
    if (_socket != null) {
      _socket!.on('user:offline', (data) {
        callback(data['userId']);
      });
    }
  }

  static void emitTyping(String receiverId, String senderName) {
    if (_socket != null) {
      _socket!.emit('user:typing', {
        'receiverId': receiverId,
        'senderName': senderName,
      });
    }
  }

  static void emitStopTyping(String receiverId) {
    if (_socket != null) {
      _socket!.emit('user:stopTyping', {'receiverId': receiverId});
    }
  }
}
